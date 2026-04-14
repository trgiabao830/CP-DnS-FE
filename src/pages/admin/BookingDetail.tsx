import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  XCircle,
  Plus,
  Search,
  Trash2,
  Minus,
  ArrowRightLeft,
} from "lucide-react";
import { restaurantService } from "../../services/admin/restaurant.service";
import { posService } from "../../services/admin/pos.service";
import type {
  AdminBookingDetail,
  BookingStatus,
} from "../../types/admin/booking";
import type { FoodResponse, CartItem } from "../../types/client/booking";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
} from "../../components/admin/common/ActionModals";
import FoodDetailModal from "../../components/client/restaurant/FoodDetailModal";
import MoveTableModal from "../../components/admin/pos/MoveTableModal";
import { bookingService } from "../../services/client/booking.service";
import { toast } from "react-toastify";

const API_BASE_URL = "/api/admin/restaurant";

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    SERVING: "Đang phục vụ",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Khách vắng mặt",
  };
  return labels[status] || status;
};

const getBookingTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    ONLINE_PREORDER: "Đặt trước online (Có món)",
    ONLINE_TABLEONLY: "Đặt trước online (Chỉ bàn)",
    WALK_IN: "Khách vãng lai",
    TAKEAWAY: "Mang về",
    ROOM_SERVICE: "Phục vụ tại phòng",
  };
  return labels[type] || type;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: "Tiền mặt",
    VNPAY: "VNPAY",
    BANK_TRANSFER: "Chuyển khoản",
  };
  return labels[method] || method;
};

const formatPrice = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val,
  );

const BookingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [targetStatus, setTargetStatus] = useState<BookingStatus | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [redirectOnClose, setRedirectOnClose] = useState(false);

  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [isMoveTableOpen, setIsMoveTableOpen] = useState(false);
  const [menuFoods, setMenuFoods] = useState<FoodResponse[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResponse | null>(null);
  const [isFoodDetailOpen, setIsFoodDetailOpen] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const fetchDetailRef = useRef<() => void>(() => {});

  const fetchDetail = () => {
    restaurantService
      .getBookingDetail(Number(id))
      .then(setBooking)
      .catch((err) => {
        console.error(err);
        if (err?.status === 403 || err?.message === "FORBIDDEN") {
          setIsPermissionDenied(true);
        } else {
          setErrorMsg("Không tìm thấy đơn đặt bàn hoặc có lỗi xảy ra!");
          setRedirectOnClose(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetailRef.current = fetchDetail;
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchDetail();
    }
  }, [id]);

  useEffect(() => {
    let isActive = true;
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.addEventListener("BOOKING_UPDATE", (event) => {
      if (isActive) {
        try {
          const data = JSON.parse(event.data);
          console.log("Nhận tín hiệu cập nhật từ SSE:", data);

          if (
            Number(data) === Number(id) ||
            (data.bookingId && Number(data.bookingId) === Number(id))
          ) {
            console.log("♻️ Dữ liệu thay đổi, đang tải lại...");
            fetchDetailRef.current();
          }
        } catch (e) {}
      }
    });

    return () => {
      isActive = false;
      eventSource.close();
    };
  }, [id]);

  const categories = useMemo(() => {
    const cats = new Set(menuFoods.map((f) => f.categoryName || "Khác"));
    return ["ALL", ...Array.from(cats)];
  }, [menuFoods]);

  const filteredFoods = useMemo(() => {
    return menuFoods.filter((food) => {
      const matchCategory =
        activeCategory === "ALL" ||
        (food.categoryName || "Khác") === activeCategory;
      const matchKeyword = food.name
        .toLowerCase()
        .includes(searchKeyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [menuFoods, activeCategory, searchKeyword]);

  const handleOpenAddFood = async () => {
    setShowAddFoodModal(true);
    setSearchKeyword("");
    setActiveCategory("ALL");

    setMenuLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const data = await bookingService.getMenuForBooking(today, "");
      setMenuFoods(data);
    } catch (e) {
      toast.error("Lỗi tải thực đơn");
    } finally {
      setMenuLoading(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!booking || !targetStatus) return;

    if (targetStatus === "CANCELLED") {
      if (booking.status === "SERVING") {
        await executeUpdateStatus();
      } else {
        await executeSpecialCancel();
      }
    } else {
      await executeUpdateStatus();
    }
  };

  const executeUpdateStatus = async () => {
    if (!booking || !targetStatus) return;
    try {
      const updatedData = await restaurantService.updateBookingStatus(
        booking.bookingId,
        targetStatus,
      );
      setBooking(updatedData);
      setSuccessMsg(`Đã cập nhật trạng thái: ${getStatusLabel(targetStatus)}`);
    } catch (error: any) {
      console.error(error);
      if (error?.status === 403 || error?.message === "FORBIDDEN") {
        setIsPermissionDenied(true);
      } else {
        setErrorMsg(error.message || "Lỗi cập nhật trạng thái");
      }
    } finally {
      setTargetStatus(null);
    }
  };

  const executeSpecialCancel = async () => {
    try {
      await restaurantService.cancelBookingByAdmin(booking!.bookingId);

      await fetchDetailRef.current();

      setSuccessMsg("Đã hủy đơn thành công (Đã xử lý hoàn tiền/Email nếu có).");
    } catch (error: any) {
      console.error(error);
      if (error?.status === 403) setIsPermissionDenied(true);
      else setErrorMsg(error.message || "Lỗi khi hủy đơn");
    } finally {
      setTargetStatus(null);
    }
  };

  const onStatusClick = (status: BookingStatus) => setTargetStatus(status);

  const getModalContent = (status: BookingStatus) => {
    const statusText = getStatusLabel(status);

    switch (status) {
      case "CONFIRMED":
        return {
          btnColor: "bg-blue-600 hover:bg-blue-700",
          title: "Xác nhận đơn?",
          message: (
            <>
              Bạn có chắc muốn chuyển trạng thái đơn sang{" "}
              <strong>{statusText}</strong>?
            </>
          ),
        };
      case "SERVING":
        return {
          btnColor: "bg-purple-600 hover:bg-purple-700",
          title: "Bắt đầu phục vụ?",
          message: <>Xác nhận khách đã đến và bắt đầu phục vụ?</>,
        };
      case "COMPLETED":
        return {
          btnColor: "bg-green-600 hover:bg-green-700",
          title: "Hoàn thành đơn?",
          message: <>Xác nhận khách đã thanh toán và hoàn thành đơn?</>,
        };
      case "NO_SHOW":
        return {
          btnColor: "bg-gray-600 hover:bg-gray-700",
          title: "Khách vắng mặt?",
          message: <>Xác nhận khách không đến nhận bàn?</>,
        };
      case "CANCELLED":
        return {
          btnColor: "bg-red-600 hover:bg-red-700",
          title: "Hủy đơn đặt bàn?",
          message: (
            <div className="text-sm text-gray-600">
              <p>Bạn có chắc chắn muốn hủy đơn đặt bàn này không?</p>
              {booking && booking.depositAmount > 0 && (
                <div className="text-red-700">
                  <strong>Lưu ý:</strong> Khách hàng đã đặt cọc{" "}
                  <strong>{formatPrice(booking.depositAmount)}</strong>. Hãy
                  kiểm tra chính sách hoàn tiền trước khi hủy.
                </div>
              )}
            </div>
          ),
        };
      default:
        return {
          color: "bg-gray-100 text-gray-600",
          btnColor: "bg-gray-600",
          title: "Cập nhật trạng thái?",
          message: (
            <>
              Bạn có chắc muốn chuyển trạng thái sang{" "}
              <strong>{statusText}</strong>?
            </>
          ),
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-orange-700";
      case "CONFIRMED":
        return "text-blue-700";
      case "SERVING":
        return "text-purple-700";
      case "COMPLETED":
        return "text-green-700";
      case "CANCELLED":
        return "text-red-700";
      default:
        return "text-gray-700";
    }
  };

  const handleAddFoodToOrder = async (item: CartItem) => {
    if (!booking) return;
    try {
      await posService.addOrderItem(booking.bookingId, {
        foodId: Number(item.foodId),
        quantity: item.quantity,
        note: item.note,

        optionIds: (item.selectedOptions || []).map((opt) => Number(opt.id)),
      });

      toast.success("Đã thêm món thành công!");
      setIsFoodDetailOpen(false);
      fetchDetail();
    } catch (e: any) {
      toast.error(e.message || "Lỗi thêm món");
    }
  };

  const handleUpdateQuantity = async (
    detailId: number,
    newQuantity: number,
  ) => {
    if (!booking) return;

    if (newQuantity <= 0) {
      handleDeleteItem(detailId);
      return;
    }

    setActionLoading(true);
    try {
      await posService.updateOrderItemQuantity(
        booking.bookingId,
        detailId,
        newQuantity,
      );
      await fetchDetailRef.current();
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật số lượng");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (detailId: number) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await posService.updateOrderItemQuantity(booking.bookingId, detailId, 0);
      toast.success("Đã xóa món ăn");
      await fetchDetailRef.current();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi xóa món");
    } finally {
      setActionLoading(false);
    }
  };

  const sortedOrderItems = useMemo(() => {
    if (!booking?.orderItems) return [];

    return [...booking.orderItems].sort((a, b) => a.detailId - b.detailId);
  }, [booking?.orderItems]);
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );

  if (!booking)
    return (
      <>
        <div className="min-h-screen bg-gray-50 p-6"></div>
        <ErrorModal
          message={errorMsg}
          onClose={() => {
            setErrorMsg("");
            if (redirectOnClose) navigate(-1);
          }}
        />
      </>
    );

  const isServing = booking.status === "SERVING";
  const canMoveTable = ["PENDING", "CONFIRMED", "SERVING"].includes(
    booking.status,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full bg-white p-2 text-gray-500 shadow-sm hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">
                  Đơn bàn #{booking.bookingId}
                </h1>
                <span
                  className={`px-3 py-0.5 text-sm font-bold ${getStatusColor(booking.status)}`}
                >
                  {getStatusLabel(booking.status)}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                Tạo lúc: {booking.createdAt} • Loại:{" "}
                {getBookingTypeLabel(booking.bookingType)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canMoveTable && (
              <button
                onClick={() => setIsMoveTableOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowRightLeft size={16} />
                Chuyển bàn
              </button>
            )}
            {booking.status === "PENDING" && (
              <>
                <button
                  onClick={() => onStatusClick("CONFIRMED")}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => onStatusClick("CANCELLED")}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Hủy đơn
                </button>
              </>
            )}

            {booking.status === "CONFIRMED" && (
              <>
                <button
                  onClick={() => onStatusClick("SERVING")}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
                >
                  Bắt đầu phục vụ
                </button>
                <button
                  onClick={() => onStatusClick("NO_SHOW")}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                >
                  Khách vắng
                </button>
                <button
                  onClick={() => onStatusClick("CANCELLED")}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Hủy đơn
                </button>
              </>
            )}

            {booking.status === "SERVING" && (
              <>
                <button
                  onClick={() => onStatusClick("COMPLETED")}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                >
                  Hoàn thành
                </button>

                <button
                  onClick={() => onStatusClick("CANCELLED")}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Hủy đơn
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-600">
                  Khách hàng
                </h3>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-500">
                    Họ và tên
                  </span>
                  <span className="mt-1 block font-medium text-gray-900">
                    {booking.customerName}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-500">
                    Số điện thoại
                  </span>
                  <span className="mt-1 block font-medium text-gray-900">
                    {booking.customerPhone}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-500">
                    Email
                  </span>
                  <span className="mt-1 block font-medium text-gray-900">
                    {booking.customerEmail}
                  </span>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-600">
                  Thông tin bàn
                </h3>
              </div>
              <div className="space-y-4 p-5 text-sm">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">Thời gian</span>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 font-bold text-blue-600">
                      {booking.bookingTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500">Số lượng khách</span>
                  <span className="font-medium">
                    {booking.numberOfGuests} người
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Bàn số</span>
                  <span className="font-bold text-gray-800">
                    {booking.tableNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex h-14 items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-600">
                  Danh sách món ăn
                </h3>
                {isServing && (
                  <div className="flex items-center">
                    {!isEditingMenu ? (
                      <button
                        onClick={() => setIsEditingMenu(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        Chỉnh sửa
                      </button>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-2 duration-200">
                        <button
                          onClick={handleOpenAddFood}
                          className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-100"
                        >
                          Thêm món
                        </button>

                        <button
                          onClick={() => setIsEditingMenu(false)}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
                        >
                          Hoàn tất
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Món ăn</th>
                      <th className="px-5 py-3 text-center">SL</th>
                      <th className="w-32 px-5 py-3 text-right">Đơn giá</th>
                      <th className="w-32 px-5 py-3 text-right">Thành tiền</th>
                      {isEditingMenu && (
                        <th className="px-5 py-3 text-center"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedOrderItems && sortedOrderItems.length > 0 ? (
                      sortedOrderItems.map((item, idx) => (
                        <tr key={item.detailId} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                                {item.foodImage && (
                                  <img
                                    src={item.foodImage}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.foodName}
                                </div>
                                {item.options?.length > 0 && (
                                  <div className="mt-0.5 flex flex-wrap gap-1 text-xs text-gray-500">
                                    {item.options.map((opt, i) => {
                                      const displayOpt = opt.includes(":")
                                        ? opt
                                            .split(":")
                                            .map((s) => s.trim())
                                            .reverse()
                                            .join(": ")
                                        : opt;

                                      return (
                                        <span
                                          key={i}
                                          className="rounded bg-gray-100 px-1.5 py-0.5"
                                        >
                                          {displayOpt}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                {item.note && (
                                  <div className="mt-0.5 text-xs italic text-orange-600">
                                    Ghi chú: {item.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3 text-center font-medium">
                            {isEditingMenu ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.detailId,
                                      item.quantity - 1,
                                    )
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                                >
                                  <Minus size={14} />{" "}
                                </button>
                                <span className="w-6 text-center text-sm">
                                  {item.quantity}
                                </span>
                                <button
                                  disabled={actionLoading}
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.detailId,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <span>x{item.quantity}</span>
                            )}
                          </td>

                          <td className="px-5 py-3 text-right text-gray-600">
                            {formatPrice(item.unitPrice)}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">
                            {formatPrice(item.totalPrice)}
                          </td>

                          {isEditingMenu && (
                            <td className="px-5 py-3 text-center">
                              <button
                                disabled={actionLoading}
                                onClick={() => handleDeleteItem(item.detailId)}
                                className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                title="Xóa món này"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center italic text-gray-500"
                        >
                          Khách hàng chưa đặt món trước
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-600">
                  Thanh toán
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phương thức</span>
                      <span className="font-medium">
                        {getPaymentMethodLabel(booking.paymentMethod)}
                      </span>
                    </div>
                    {(booking.paymentTime ||
                      booking.paymentMethod !== "CASH") && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Thời gian TT</span>
                        <span className="font-medium">
                          {booking.paymentTime || "Chưa thanh toán"}
                        </span>
                      </div>
                    )}
                    {booking.vnpTxnRef && (
                      <div className="flex items-start justify-between">
                        <span className="text-gray-500">VNPAY Ref</span>
                        <code className="break-all rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
                          {booking.vnpTxnRef}
                        </code>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 border-t border-gray-100 pt-4 text-sm md:border-l md:border-t-0 md:pl-8 md:pt-0">
                    <div className="flex justify-between text-gray-600">
                      <span>Tổng tiền món</span>
                      <span>{formatPrice(booking.subTotal)}</span>
                    </div>
                    {booking.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá</span>
                        <span>-{formatPrice(booking.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 font-bold text-gray-900">
                      <span>Tổng cộng</span>
                      <span className="text-lg text-blue-600">
                        {formatPrice(booking.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-2 space-y-2 rounded-lg bg-blue-50 p-3">
                      <div className="flex justify-between text-blue-800">
                        <span>Đã đặt cọc</span>
                        <span className="font-bold">
                          {formatPrice(booking.depositAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200 pt-2 text-base font-bold text-blue-700">
                        <span>Cần thu tại quầy</span>
                        <span>
                          {formatPrice(
                            Math.max(
                              0,
                              booking.totalAmount - booking.depositAmount,
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {targetStatus && (
        <Modal
          isOpen={!!targetStatus}
          onClose={() => setTargetStatus(null)}
          title={getModalContent(targetStatus).title}
          size="md"
        >
          <div className="p-6 text-center">
            {(() => {
              const { btnColor, message } = getModalContent(targetStatus);
              return (
                <>
                  <div className="mb-6 text-gray-700">{message}</div>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setTargetStatus(null)}
                      className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleConfirmStatusChange}
                      className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${btnColor}`}
                    >
                      Đồng ý
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      {showAddFoodModal && (
        <Modal
          isOpen={showAddFoodModal}
          onClose={() => setShowAddFoodModal(false)}
          title="Thêm món vào đơn"
          size="5xl"
          zIndex={40}
        >
          <div className="flex h-[70vh] flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 p-4">
              <div className="relative w-full max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên món..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Hiển thị <strong>{filteredFoods.length}</strong> món
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/4 min-w-[180px] space-y-1 overflow-y-auto border-r border-gray-100 bg-gray-50 p-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat === "ALL" ? "Tất cả" : cat}
                  </button>
                ))}
              </div>

              <div
                className="relative flex-1 overflow-y-auto bg-white p-4"
                style={{ scrollbarGutter: "stable" }}
              >
                {menuLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredFoods.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <Search size={48} className="mb-2 opacity-20" />
                    <p>Không tìm thấy món ăn nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {filteredFoods.map((food) => {
                      const isOutOfStock = food.status === "OUT_OF_STOCK";

                      return (
                        <div
                          key={food.foodId}
                          onClick={() => {
                            if (isOutOfStock) return;

                            setSelectedFood(food);
                            setIsFoodDetailOpen(true);
                          }}
                          className={`flex flex-col gap-2 rounded-lg border p-2 transition-all ${
                            isOutOfStock
                              ? "cursor-not-allowed opacity-60 grayscale"
                              : "cursor-pointer hover:border-blue-300 hover:shadow-md"
                          }`}
                        >
                          <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                            <img
                              src={food.imageUrl}
                              className="h-full w-full object-cover"
                              alt={food.name}
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                                Hết hàng
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div
                              className="line-clamp-2 text-sm font-bold text-gray-800"
                              title={food.name}
                            >
                              {food.name}
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="text-sm font-bold text-blue-600">
                              {formatPrice(
                                food.discountPrice || food.basePrice,
                              )}
                            </div>
                            <button
                              disabled={isOutOfStock} // Vô hiệu hóa nút Plus nếu hết hàng
                              className={`rounded-full p-1 transition-colors ${
                                isOutOfStock
                                  ? "bg-gray-200 text-gray-400"
                                  : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                              }`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isFoodDetailOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto", width: "100%", height: "100%" }}>
            <FoodDetailModal
              isOpen={isFoodDetailOpen}
              onClose={() => setIsFoodDetailOpen(false)}
              food={selectedFood}
              onAddToCart={handleAddFoodToOrder}
            />
          </div>
        </div>
      )}

      {isMoveTableOpen && (
        <MoveTableModal
          isOpen={isMoveTableOpen}
          onClose={() => setIsMoveTableOpen(false)}
          bookingId={booking.bookingId}
          currentTableId={booking.tableId}
          onSuccess={() => {
            fetchDetail();
          }}
        />
      )}

      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => {
          setIsPermissionDenied(false);
          navigate("/admin/booking");
        }}
      />

      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />

      <ErrorModal
        message={errorMsg}
        onClose={() => {
          setErrorMsg("");
          if (redirectOnClose) navigate("/admin/booking");
        }}
      />
    </div>
  );
};

export default BookingDetail;
