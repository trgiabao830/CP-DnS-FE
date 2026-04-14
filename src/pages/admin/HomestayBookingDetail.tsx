import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Bed,
  Users,
  Check,
  AlertTriangle,
  Tag,
  Info,
} from "lucide-react";
import { homestayService } from "../../services/admin/homestay.service";
import type {
  AdminHomestayBookingDetailResponse,
  HomestayBookingStatus,
  AdminAvailableRoomGroupResponse,
} from "../../types/admin/homestay-booking";
import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
} from "../../components/admin/common/ActionModals";

import {
  format,
  differenceInCalendarDays,
  parseISO,
  isValid,
  addDays,
  isAfter,
} from "date-fns";
import { vi } from "date-fns/locale";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("vi", vi);

const API_BASE_URL = "/api/admin/homestay";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val,
  );

const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "HH:mm dd/MM/yyyy", { locale: vi });
  } catch {
    return dateString;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
  } catch {
    return dateString;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    CHECKED_IN: "Đã nhận phòng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Khách vắng mặt",
  };
  return labels[status] || status;
};

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: "Tiền mặt",
    VNPAY: "VNPAY",
    BANK_TRANSFER: "Chuyển khoản",
  };
  return labels[method] || method;
};

const HomestayBookingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] =
    useState<AdminHomestayBookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [isChangeRoomModalOpen, setIsChangeRoomModalOpen] = useState(false);
  const [availableRoomGroups, setAvailableRoomGroups] = useState<
    AdminAvailableRoomGroupResponse[]
  >([]);
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<number | null>(
    null,
  );
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [isCouponConflictModalOpen, setIsCouponConflictModalOpen] =
    useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "CHANGE_ROOM" | "UPDATE_STATUS" | null
  >(null);
  const [pendingChangeRoomId, setPendingChangeRoomId] = useState<number | null>(
    null,
  );
  const [newCouponCode, setNewCouponCode] = useState("");
  const [resolvingCoupon, setResolvingCoupon] = useState(false);

  const [targetStatus, setTargetStatus] =
    useState<HomestayBookingStatus | null>(null);

  const [checkOutDateInput, setCheckOutDateInput] = useState<Date | null>(null);

  const [msg, setMsg] = useState({ error: "", success: "" });

  const fetchDetailRef = useRef<() => void>(() => {});

  const checkOutPreview = useMemo(() => {
    if (!booking || targetStatus !== "COMPLETED" || !checkOutDateInput)
      return null;

    const checkIn = parseISO(booking.checkInDate);
    const newCheckOut = checkOutDateInput;

    if (!isValid(newCheckOut) || !isValid(checkIn)) return null;

    let nights = differenceInCalendarDays(newCheckOut, checkIn);
    if (nights < 1) nights = 1;

    const newSubTotal = booking.pricePerNight * nights;
    const deposit = booking.depositAmount;
    const diff = newSubTotal - booking.subTotal;

    return {
      nights,
      newSubTotal,
      deposit,
      diff,
      isValidDate: newCheckOut >= checkIn,
    };
  }, [booking, targetStatus, checkOutDateInput]);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const data = await homestayService.getBookingDetail(Number(id));
      setBooking(data);
    } catch (e: any) {
      setMsg((p) => ({ ...p, error: e.message || "Lỗi tải chi tiết đơn" }));
    } finally {
      setLoading(false);
    }
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
    if (!id) return;
    let isActive = true;
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.addEventListener("HOMESTAY_BOOKING_UPDATE", (event) => {
      if (isActive) {
        try {
          const data = JSON.parse(event.data);
          if (
            Number(data) === Number(id) ||
            (data.bookingId && Number(data.bookingId) === Number(id))
          ) {
            fetchDetailRef.current();
          }
        } catch (e) {
          console.error("SSE Error:", e);
        }
      }
    });

    return () => {
      isActive = false;
      eventSource.close();
    };
  }, [id]);

  const handleUpdateStatusSubmit = async (couponCodeToUpdate?: string) => {
    if (!booking || !targetStatus) return;

    const dateToSend =
      targetStatus === "COMPLETED" && checkOutDateInput
        ? format(checkOutDateInput, "yyyy-MM-dd")
        : undefined;

    if (couponCodeToUpdate !== undefined) setResolvingCoupon(true);

    try {
      if (targetStatus === "CANCELLED") {
        if (booking.status === "PENDING" || booking.status === "CONFIRMED") {
          await homestayService.cancelBooking(booking.bookingId);
        } else {
          await homestayService.updateStatus(booking.bookingId, targetStatus);
        }
      } else {
        await homestayService.updateStatus(
          booking.bookingId,
          targetStatus,
          dateToSend,
          couponCodeToUpdate,
        );
      }

      setMsg((p) => ({
        ...p,
        success: `Đã cập nhật trạng thái: ${getStatusLabel(targetStatus)}`,
      }));

      setTargetStatus(null);
      setCheckOutDateInput(null);
      setIsCouponConflictModalOpen(false);
      setPendingAction(null);
      setNewCouponCode("");

      fetchDetail();
    } catch (e: any) {
      if (
        targetStatus === "COMPLETED" &&
        e.message &&
        (e.message.includes("điều kiện tối thiểu") ||
          e.message.includes("Mã giảm giá"))
      ) {
        setConflictMessage(e.message);
        setPendingAction("UPDATE_STATUS");
        setTargetStatus(null);
        setIsCouponConflictModalOpen(true);
      } else {
        setMsg((p) => ({
          ...p,
          error: e.message || "Lỗi cập nhật trạng thái",
        }));
        setTargetStatus(null);
      }
    } finally {
      setResolvingCoupon(false);
    }
  };

  const handleConfirmStatusChange = () => {
    handleUpdateStatusSubmit();
  };

  const handleOpenChangeRoom = async () => {
    if (!booking) return;
    setLoadingRooms(true);
    setIsChangeRoomModalOpen(true);
    setSelectedNewRoomId(null);
    try {
      const groups = await homestayService.getAvailableRooms(booking.bookingId);
      setAvailableRoomGroups(groups);
    } catch (e: any) {
      setMsg((p) => ({
        ...p,
        error: e.message || "Không thể tải danh sách phòng trống",
      }));
      setIsChangeRoomModalOpen(false);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleChangeRoomSubmit = async (
    roomId?: number,
    couponCodeToUpdate?: string,
  ) => {
    const targetRoomId = roomId || selectedNewRoomId;
    if (!booking || !targetRoomId) return;

    if (couponCodeToUpdate !== undefined) setResolvingCoupon(true);

    try {
      await homestayService.changeRoom(
        booking.bookingId,
        targetRoomId,
        couponCodeToUpdate,
      );
      setMsg((p) => ({ ...p, success: "Đổi phòng thành công!" }));
      setIsChangeRoomModalOpen(false);
      setIsCouponConflictModalOpen(false);
      setPendingAction(null);
      setPendingChangeRoomId(null);
      setNewCouponCode("");
      fetchDetail();
    } catch (e: any) {
      if (
        e.message &&
        (e.message.includes("điều kiện tối thiểu") ||
          e.message.includes("Mã giảm giá"))
      ) {
        setConflictMessage(e.message);
        setPendingAction("CHANGE_ROOM");
        setPendingChangeRoomId(targetRoomId);
        setIsChangeRoomModalOpen(false);
        setIsCouponConflictModalOpen(true);
      } else {
        setMsg((p) => ({ ...p, error: e.message || "Lỗi đổi phòng" }));
      }
    } finally {
      setResolvingCoupon(false);
    }
  };

  const handleResolveCoupon = (action: "REMOVE" | "UPDATE") => {
    const codeToSend = action === "UPDATE" ? newCouponCode : "";

    if (pendingAction === "CHANGE_ROOM" && pendingChangeRoomId) {
      handleChangeRoomSubmit(pendingChangeRoomId, codeToSend);
    } else if (pendingAction === "UPDATE_STATUS") {
      retryCheckOut(codeToSend);
    }
  };

  const retryCheckOut = async (couponCode: string) => {
    if (!booking) return;
    setResolvingCoupon(true);

    const dateToSend = checkOutDateInput
      ? format(checkOutDateInput, "yyyy-MM-dd")
      : undefined;

    try {
      await homestayService.updateStatus(
        booking.bookingId,
        "COMPLETED",
        dateToSend,
        couponCode,
      );
      setMsg((p) => ({ ...p, success: "Check-out thành công!" }));
      setIsCouponConflictModalOpen(false);
      setPendingAction(null);
      setNewCouponCode("");
      fetchDetail();
    } catch (e: any) {
      setMsg((p) => ({
        ...p,
        error: e.message || "Vẫn không thỏa điều kiện mã",
      }));
    } finally {
      setResolvingCoupon(false);
    }
  };

  const onStatusClick = (status: HomestayBookingStatus) => {
    setTargetStatus(status);

    if (status === "COMPLETED" && booking) {
      const today = new Date();
      const checkInDate = parseISO(booking.checkInDate);
      const minCheckOutDate = addDays(checkInDate, 1);

      if (isAfter(today, minCheckOutDate)) {
        setCheckOutDateInput(today);
      } else {
        setCheckOutDateInput(minCheckOutDate);
      }
    }
  };

  const getModalContent = (status: HomestayBookingStatus) => {
    const statusText = getStatusLabel(status);
    switch (status) {
      case "CONFIRMED":
        return {
          btnColor: "bg-blue-600 hover:bg-blue-700",
          title: "Xác nhận đơn phòng?",
          message: (
            <>
              Bạn có chắc muốn chuyển trạng thái sang{" "}
              <strong>{statusText}</strong>?
            </>
          ),
        };
      case "CHECKED_IN":
        return {
          btnColor: "bg-purple-600 hover:bg-purple-700",
          title: "Xác nhận nhận phòng?",
          message: <>Xác nhận khách đã đến và nhận phòng?</>,
        };
      case "COMPLETED":
        const minCheckoutDate = booking
          ? addDays(parseISO(booking.checkInDate), 1)
          : new Date();

        return {
          btnColor: "bg-green-600 hover:bg-green-700",
          title: "Xác nhận trả phòng?",
          message: (
            <div className="space-y-4 text-left">
              <p>Xác nhận khách đã thanh toán và hoàn tất thủ tục?</p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ngày trả phòng thực tế
                </label>
                <DatePicker
                  selected={checkOutDateInput}
                  onChange={(date) => setCheckOutDateInput(date)}
                  dateFormat="dd/MM/yyyy"
                  locale="vi"
                  minDate={minCheckoutDate}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  wrapperClassName="w-full"
                  placeholderText="Chọn ngày trả phòng"
                  popperClassName="z-50"
                />
              </div>

              {checkOutPreview && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2 border-b border-gray-200 pb-2 font-medium text-gray-700">
                    Thông tin thanh toán mới
                  </div>

                  {!checkOutPreview.isValidDate ? (
                    <p className="text-xs text-red-500">
                      Ngày trả phòng phải sau ngày nhận phòng.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ngày nhận:</span>
                        <span>
                          {booking ? formatDate(booking.checkInDate) : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Số đêm thực tế:</span>
                        <span className="font-bold">
                          {checkOutPreview.nights} đêm
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between border-t border-gray-200 pt-1">
                        <span className="font-medium text-gray-700">
                          Tiền phòng (Gốc):
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(checkOutPreview.newSubTotal)}
                        </span>
                      </div>
                      {checkOutPreview.diff !== 0 && (
                        <div className="mt-1 flex justify-between text-xs">
                          <span className="text-gray-400">Chênh lệch:</span>
                          <span
                            className={
                              checkOutPreview.diff > 0
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {checkOutPreview.diff > 0 ? "+" : ""}
                            {formatCurrency(checkOutPreview.diff)}
                          </span>
                        </div>
                      )}
                      <div className="mt-2 rounded border border-yellow-100 bg-yellow-50 p-2 text-xs italic text-yellow-700">
                        Lưu ý: Mã giảm giá (nếu có) sẽ được hệ thống tính lại
                        dựa trên tổng tiền mới.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ),
        };
      case "NO_SHOW":
        return {
          btnColor: "bg-gray-600 hover:bg-gray-700",
          title: "Khách vắng mặt?",
          message: <>Xác nhận khách không đến nhận phòng?</>,
        };
      case "CANCELLED":
        return {
          btnColor: "bg-red-600 hover:bg-red-700",
          title: "Hủy đơn đặt phòng?",
          message: (
            <div className="text-sm text-gray-600">
              <p>Bạn có chắc chắn muốn hủy đơn này không?</p>
              {booking && booking.depositAmount > 0 && (
                <div className="mt-2 text-red-700">
                  <strong>Lưu ý:</strong> Khách đã đặt cọc{" "}
                  <strong>{formatCurrency(booking.depositAmount)}</strong>.
                </div>
              )}
            </div>
          ),
        };
      default:
        return {
          btnColor: "bg-blue-600",
          title: "Cập nhật trạng thái",
          message: "Xác nhận đổi trạng thái?",
        };
    }
  };

  const nights = booking
    ? differenceInCalendarDays(
        parseISO(booking.checkOutDate),
        parseISO(booking.checkInDate),
      )
    : 0;

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  if (!booking)
    return <div className="p-10 text-center">Không tìm thấy đơn đặt phòng</div>;

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
                  Đơn phòng #{booking.bookingId}
                </h1>
                <span
                  className={`rounded-full px-3 py-0.5 text-sm font-bold ${
                    booking.status === "CONFIRMED"
                      ? "bg-blue-50 text-blue-700"
                      : booking.status === "PENDING"
                        ? "bg-orange-50 text-orange-700"
                        : booking.status === "CANCELLED"
                          ? "bg-red-50 text-red-700"
                          : booking.status === "CHECKED_IN"
                            ? "bg-purple-50 text-purple-700"
                            : booking.status === "COMPLETED"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {getStatusLabel(booking.status)}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                Tạo lúc: {formatDateTime(booking.createdAt)}
              </p>
            </div>
          </div>

          {/* ... Action Buttons ... */}
          <div className="flex flex-wrap gap-2">
            {booking.status === "PENDING" && (
              <>
                <button
                  onClick={() => onStatusClick("CONFIRMED")}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => onStatusClick("CANCELLED")}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Hủy đơn
                </button>
              </>
            )}
            {booking.status === "CONFIRMED" && (
              <>
                <button
                  onClick={() => onStatusClick("CHECKED_IN")}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700"
                >
                  Check-in
                </button>
                <button
                  onClick={handleOpenChangeRoom}
                  className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Chuyển phòng
                </button>
                <button
                  onClick={() => onStatusClick("NO_SHOW")}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Khách vắng
                </button>
                <button
                  onClick={() => onStatusClick("CANCELLED")}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Hủy đơn
                </button>
              </>
            )}
            {booking.status === "CHECKED_IN" && (
              <>
                <button
                  onClick={() => onStatusClick("COMPLETED")}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                >
                  Check-out
                </button>
                <button
                  onClick={handleOpenChangeRoom}
                  className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Chuyển phòng
                </button>
                <button
                  onClick={() => onStatusClick("CANCELLED")}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Hủy đơn
                </button>
              </>
            )}
          </div>
        </div>

        {/* --- MAIN INFO (Room & Customer) --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Room Info */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                  Chi tiết phòng ở
                </h3>
              </div>
              <div className="p-5">
                <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                  <img
                    src={booking.roomImage || "https://via.placeholder.com/150"}
                    alt={booking.roomName}
                    className="h-28 w-full rounded-lg border border-gray-200 bg-gray-100 object-cover sm:w-40"
                  />
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {booking.roomName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        {booking.roomNumber
                          ? `Phòng ${booking.roomNumber}`
                          : "Chưa xếp phòng"}
                      </span>
                      <span className="rounded border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {booking.roomClassName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users size={14} /> {booking.numberOfAdults} người lớn,{" "}
                      {booking.numberOfChildren} trẻ em
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="flex gap-3">
                    <div>
                      <span className="block text-xs font-bold uppercase text-gray-400">
                        Nhận phòng
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatDate(booking.checkInDate)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        Từ 14:00
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div>
                      <span className="block text-xs font-bold uppercase text-gray-400">
                        Trả phòng
                      </span>
                      <span className="font-semibold text-gray-800">
                        {formatDate(booking.checkOutDate)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        Trước 12:00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-600">
                  Khách hàng
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-3">
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-400">
                    Họ và tên
                  </span>
                  <p className="mt-1 font-medium text-gray-900">
                    {booking.customerName}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-400">
                    Số điện thoại
                  </span>
                  <p className="mt-1 font-medium text-gray-900">
                    {booking.customerPhone}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase text-gray-400">
                    Email
                  </span>
                  <p className="mt-1 break-all font-medium text-gray-900">
                    {booking.customerEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-6 lg:col-span-1">
            <div className="sticky top-6 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-600">
                  Thanh toán
                </h3>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phương thức</span>
                  <span className="font-medium text-gray-900">
                    {getPaymentMethodLabel(booking.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thời gian TT</span>
                  <span className="font-medium text-gray-900">
                    {booking.paymentTime || "Chưa thanh toán"}
                  </span>
                </div>
                {booking.vnpTxnRef && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mã GD VNPAY</span>
                    <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                      {booking.vnpTxnRef}
                    </code>
                  </div>
                )}
                <div className="space-y-2 border-t border-dashed border-gray-200 pt-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <div className="flex flex-col">
                      <span>Tiền phòng</span>
                      <span className="text-[12px] text-gray-400">
                        {formatCurrency(booking.pricePerNight)} x {nights} đêm
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(booking.subTotal)}
                    </span>
                  </div>
                  {booking.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatCurrency(booking.discountAmount)}</span>
                    </div>
                  )}
                  {booking.appliedCouponCode && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Mã áp dụng</span>
                      <span className="font-medium text-gray-700">
                        {booking.appliedCouponCode}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-lg text-blue-600">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 space-y-2 rounded-lg bg-blue-50 p-4">
                  <div className="flex justify-between text-sm text-blue-800">
                    <span>Đã đặt cọc</span>
                    <span className="font-bold">
                      {formatCurrency(booking.depositAmount)}
                    </span>
                  </div>

                  {/* So sánh tổng tiền và tiền cọc để hiển thị Thu hoặc Hoàn trả */}
                  {booking.totalAmount >= booking.depositAmount ? (
                    <div className="flex justify-between border-t border-blue-200 pt-2 text-base font-bold text-blue-700">
                      <span>Cần thu tại quầy</span>
                      <span>
                        {formatCurrency(
                          booking.totalAmount - booking.depositAmount,
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between border-t border-blue-200 pt-2 text-base font-bold text-orange-600">
                      <span>Cần hoàn trả khách</span>
                      <span>
                        {formatCurrency(
                          booking.depositAmount - booking.totalAmount,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- MODALS --- */}

        {/* 1. Status Modal (Xác nhận, Check-in, Check-out, Hủy) */}
        {targetStatus && (
          <Modal
            isOpen={!!targetStatus}
            onClose={() => setTargetStatus(null)}
            title={getModalContent(targetStatus).title}
            size="md"
          >
            <div className="p-6 text-center">
              <div className="mb-6 text-gray-700">
                {getModalContent(targetStatus).message}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setTargetStatus(null)}
                  className="rounded-lg border px-4 py-2 font-medium text-gray-600 hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={
                    targetStatus === "COMPLETED" &&
                    checkOutPreview &&
                    !checkOutPreview.isValidDate
                  }
                  onClick={handleConfirmStatusChange}
                  className={`rounded-lg px-4 py-2 font-medium text-white shadow-sm transition-colors ${getModalContent(targetStatus).btnColor} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* 2. Change Room Modal */}
        {isChangeRoomModalOpen && (
          <Modal
            isOpen={isChangeRoomModalOpen}
            onClose={() => setIsChangeRoomModalOpen(false)}
            title="Chọn phòng mới"
            size="4xl"
          >
            <div className="flex h-[70vh] flex-col">
              <div className="custom-scrollbar flex-1 overflow-y-auto bg-gray-50 p-6">
                {loadingRooms ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </div>
                ) : availableRoomGroups.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <p>
                      Không có phòng trống nào khác trong khoảng thời gian này.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {availableRoomGroups.map((group) => (
                      <div key={group.classId} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-1 rounded-full bg-blue-600"></div>
                          <h3 className="text-xl font-bold uppercase tracking-wide text-gray-800">
                            {group.className}
                          </h3>
                        </div>
                        <div className="grid gap-4">
                          {group.roomTypes.map((type) => (
                            <div
                              key={type.typeId}
                              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="mb-4 flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                                <div className="min-w-0 flex-1">
                                  <h4
                                    className="break-words text-lg font-bold leading-tight text-gray-800"
                                    title={type.typeName}
                                  >
                                    {type.typeName}
                                  </h4>
                                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                      <Users size={14} /> {type.maxAdults} người
                                      lớn, {type.maxChildren} trẻ em
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="block whitespace-nowrap text-lg font-bold text-blue-600">
                                    {formatCurrency(type.pricePerNight)}
                                  </span>
                                  <span className="whitespace-nowrap text-xs text-gray-400">
                                    / đêm
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                {type.rooms.map((room) => {
                                  const isSelected =
                                    selectedNewRoomId === room.roomId;
                                  const isCurrent = room.isCurrentRoom;
                                  return (
                                    <button
                                      key={room.roomId}
                                      disabled={isCurrent}
                                      onClick={() =>
                                        setSelectedNewRoomId(room.roomId)
                                      }
                                      className={`relative rounded-lg border px-1 py-2 text-sm font-medium transition-all ${isCurrent ? "cursor-default border-gray-200 bg-gray-100 text-gray-400" : isSelected ? "border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-200" : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600"}`}
                                    >
                                      <span className="block w-full truncate px-1">
                                        {room.roomNumber}
                                      </span>
                                      {isCurrent && (
                                        <span className="absolute -right-2 -top-2 z-10 rounded-full bg-gray-500 px-1.5 py-0.5 text-[10px] text-white shadow-sm">
                                          Hiện tại
                                        </span>
                                      )}
                                      {isSelected && (
                                        <div className="absolute -right-2 -top-2 z-10 rounded-full border border-blue-100 bg-white p-0.5 text-blue-600 shadow-sm">
                                          <Check size={12} />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 bg-white p-4">
                <div className="text-sm text-gray-500">
                  {selectedNewRoomId ? (
                    <span className="font-medium text-blue-600">
                      Đã chọn 1 phòng mới
                    </span>
                  ) : (
                    "Vui lòng chọn phòng muốn chuyển đến"
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsChangeRoomModalOpen(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={!selectedNewRoomId}
                    onClick={() => handleChangeRoomSubmit()}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Xác nhận chuyển
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* 3. Coupon Conflict Modal */}
        {isCouponConflictModalOpen && (
          <Modal
            isOpen={isCouponConflictModalOpen}
            onClose={() => setIsCouponConflictModalOpen(false)}
            title="Xung đột Mã giảm giá"
            size="md"
          >
            <div className="p-6">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <AlertTriangle className="text-orange-600" size={24} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-800">
                  Không thể thực hiện
                </h3>
                <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  {conflictMessage}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Giá trị đơn hàng thay đổi khiến mã giảm giá hiện tại không còn
                  hợp lệ. Vui lòng gỡ mã hoặc áp dụng mã mới.
                </p>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nhập mã giảm giá mới (Tùy chọn)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mã coupon..."
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                  />
                  <button
                    onClick={() => handleResolveCoupon("UPDATE")}
                    disabled={!newCouponCode || resolvingCoupon}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {resolvingCoupon ? "Đang xử lý..." : "Áp dụng"}
                  </button>
                </div>
              </div>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="mx-4 flex-shrink-0 text-xs uppercase text-gray-400">
                  Hoặc
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={() => handleResolveCoupon("REMOVE")}
                  disabled={resolvingCoupon}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Tag size={16} className="text-gray-500" /> Gỡ mã giảm giá &
                  Tiếp tục
                </button>
                <button
                  onClick={() => setIsCouponConflictModalOpen(false)}
                  className="mt-2 text-sm text-gray-500 hover:underline"
                >
                  Hủy bỏ thao tác
                </button>
              </div>
            </div>
          </Modal>
        )}

        <SuccessModal
          message={msg.success}
          onClose={() => setMsg((p) => ({ ...p, success: "" }))}
        />
        <ErrorModal
          message={msg.error}
          onClose={() => setMsg((p) => ({ ...p, error: "" }))}
        />
      </div>
    </div>
  );
};

export default HomestayBookingDetail;
