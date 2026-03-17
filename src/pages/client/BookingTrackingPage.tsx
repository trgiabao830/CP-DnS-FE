import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Utensils,
  Loader2,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { bookingService } from "../../services/client/booking.service";
import type { BookingDetailResponse } from "../../types/client/booking";
import {
  ErrorModal,
  SuccessModal,
} from "../../components/admin/common/ActionModals";
import { subHours } from "date-fns";

const BookingTrackingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accessToken = searchParams.get("code");

  const [booking, setBooking] = useState<BookingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: "Tiền mặt",
      VNPAY: "VNPAY",
    };
    return labels[method] || method;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-orange-600">
            <span className="text-sm font-bold">Chờ xác nhận</span>
          </div>
        );
      case "CONFIRMED":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-green-600">
            <span className="text-sm font-bold">Đã xác nhận</span>
          </div>
        );
      case "SERVING":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-purple-600">
            <span className="text-sm font-bold">Đang phục vụ</span>
          </div>
        );
      case "COMPLETED":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-blue-600">
            <span className="text-sm font-bold">Hoàn thành</span>
          </div>
        );
      case "CANCELLED":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-red-600">
            <span className="text-sm font-bold">Đã hủy</span>
          </div>
        );
      case "NO_SHOW":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-gray-500">
            <span className="text-sm font-bold">Vắng</span>
          </div>
        );
      default:
        return <span className="font-bold text-gray-500">{status}</span>;
    }
  };

  const fetchBookingData = () => {
    if (!accessToken) {
      setPageError("Mã đơn không hợp lệ.");
      setLoading(false);
      return;
    }

    setLoading(true);
    bookingService
      .getTrackingDetail(accessToken)
      .then((data) => setBooking(data))
      .catch((err) => setPageError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookingData();
  }, [accessToken]);

  const handleBack = () => {
    const isLoggedIn = !!localStorage.getItem("clientUser");

    if (isLoggedIn) {
      navigate("/restaurant/booking-history");
    } else {
      navigate("/");
    }
  };

  const handleCancelBooking = async () => {
    if (!accessToken) return;
    setIsCancelling(true);
    setActionError("");
    setActionSuccess("");

    try {
      const message = await bookingService.cancelBooking(accessToken);
      setActionSuccess(message);
      setShowCancelConfirm(false);
      fetchBookingData();
    } catch (err: any) {
      setActionError(err.message || "Có lỗi xảy ra khi hủy bàn.");
      setShowCancelConfirm(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const checkCancellationValidity = () => {
    if (!booking) return { canCancel: false, message: "" };

    const bookingTime = new Date(booking.bookingTime);
    const now = new Date();
    const hasDeposit = booking.depositAmount > 0;

    const hoursLimit = booking.cancellationNoticeHours || 0;
    const deadline = subHours(bookingTime, hoursLimit);

    const canCancel = now < deadline;

    let message = "";
    if (!canCancel) {
      message = hasDeposit
        ? `Đã quá hạn hủy (trước ${hoursLimit}h vì có đặt cọc/món).`
        : `Đã quá hạn hủy (trước ${hoursLimit}h nhận bàn).`;
    }

    return { canCancel, message, hoursLimit };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <Loader2 size={40} className="mb-4 animate-spin text-cyan-500" />
        <p className="text-gray-500">Đang tải thông tin đơn...</p>
      </div>
    );
  }

  if (pageError || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800">
            Không tìm thấy đơn
          </h2>
          <p className="mb-6 text-gray-500">{pageError}</p>
          <button
            onClick={handleBack} 
            className="font-bold text-cyan-600 hover:underline"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const { canCancel, message: cancelMessage, hoursLimit } = checkCancellationValidity();

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-20 pt-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-full p-2 transition-colors hover:bg-white"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Chi tiết đơn đặt bàn
          </h1>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-6">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-gray-400">
                    Mã đơn đặt bàn
                  </p>
                  <p className="font-mono text-xl font-bold tracking-wider text-gray-800">
                    #{booking.bookingId}
                  </p>
                </div>
                {renderStatusBadge(booking.status)}
              </div>

              {/* Thông tin chi tiết label trên - data dưới */}
              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Thời gian đặt
                  </label>
                  <div className="mt-1 font-medium text-gray-800">
                    {formatDateTime(booking.bookingTime)}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Bàn số
                  </label>
                  <div className="mt-1 font-medium text-gray-800">
                    {booking.tableNumber}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Khách hàng
                  </label>
                  <div className="mt-1 font-medium text-gray-800">
                    {booking.customerName}{" "}
                    <span className="font-normal text-gray-500">
                      ({booking.numberOfGuests} khách)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-400">
                    Liên hệ
                  </label>
                  <div className="mt-1 font-medium text-gray-800">
                    {booking.customerPhone}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Danh sách món ăn */}
            {booking.orderItems && booking.orderItems.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 bg-cyan-50/30 px-6 py-4">
                  <h3 className="font-bold text-gray-800">Món ăn đã đặt</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {booking.orderItems.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.foodImage ? (
                          <img
                            src={item.foodImage}
                            alt={item.foodName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <Utensils size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="mb-1 flex items-start justify-between">
                          <h4 className="text-sm font-bold text-gray-800">
                            {item.foodName}
                          </h4>
                          <span className="text-sm font-bold text-gray-700">
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                        <div className="mb-1 text-xs text-gray-500">
                          {item.quantity} x {formatPrice(item.unitPrice)}
                        </div>
                        {item.options && item.options.length > 0 && (
                          <div className="mb-1 flex flex-wrap gap-1">
                            {item.options.map((opt, i) => {
                              let displayOpt = opt;

                              const match = opt.match(/^(.*)\s\((.*)\)$/);

                              if (match) {
                                const value = match[1];
                                const group = match[2];
                                displayOpt = `${group}: ${value}`;
                              }

                              return (
                                <span
                                  key={i}
                                  className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                                >
                                  {displayOpt}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {item.note && (
                          <p className="text-xs italic text-orange-500">
                            Ghi chú: "{item.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
                <p className="italic text-gray-500">
                  Đơn này chỉ đặt bàn, không đặt trước món ăn.
                </p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: THANH TOÁN & ACTION */}
          <div className="space-y-6">
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-800">
                Thanh toán
              </h3>

              <div className="space-y-3 border-b border-dashed border-gray-200 pb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Phương thức</span>
                  <span className="font-medium text-gray-800">
                    {getPaymentMethodLabel(booking.paymentMethod)}
                  </span>
                </div>
                {booking.subTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tổng tiền món</span>
                    <span>{formatPrice(booking.subTotal)}</span>
                  </div>
                )}
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(booking.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 font-bold text-gray-800">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Đã thanh toán (Cọc)</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(booking.depositAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-cyan-50 p-4">
                  <span className="text-sm font-bold text-cyan-800">
                    Cần trả tại quầy
                  </span>
                  <span className="text-lg font-bold text-cyan-600">
                    {formatPrice(
                      Math.max(0, booking.totalAmount - booking.depositAmount),
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-center text-xs text-gray-400">
                Được tạo lúc: {formatDateTime(booking.createdAt)}
              </div>

              {/* NÚT HỦY ĐẶT BÀN */}
              {(booking.status === "PENDING" ||
                booking.status === "CONFIRMED") && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  {canCancel ? (
                    <>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white"
                      >
                        Hủy đặt bàn
                      </button>
                      {hoursLimit > 0 && (
                        <p className="mt-2 px-2 text-center text-[10px] text-gray-400">
                          Lưu ý: Hủy trước {hoursLimit}h (so với giờ đến) để
                          không bị tính phí (nếu có cọc).
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex w-full cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-100 py-3 font-bold text-gray-400">
                      <span className="flex items-center gap-2">
                        Không thể hủy
                      </span>
                      <span className="text-[10px] font-normal">
                        {cancelMessage}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- MODAL XÁC NHẬN HỦY --- */}
        {showCancelConfirm && (
          <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200">
            <div className="animate-in zoom-in-95 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Xác nhận hủy đặt bàn?
                </h3>
                <p className="mb-6 mt-2 text-sm text-gray-500">
                  Bạn có chắc chắn muốn hủy đơn đặt bàn này không? Hành động này
                  không thể hoàn tác.
                  {booking.depositAmount > 0 && <br />}
                  <span className="font-medium text-red-500">
                    {booking.depositAmount > 0
                      ? "Tiền cọc sẽ được hoàn lại nếu thỏa mãn chính sách hủy (trước 48h)."
                      : ""}
                  </span>
                </p>

                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Không hủy
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 font-bold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {isCancelling ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      "Đồng ý hủy"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL HIỂN THỊ KẾT QUẢ --- */}
        <ErrorModal message={actionError} onClose={() => setActionError("")} />
        <SuccessModal
          message={actionSuccess}
          onClose={() => setActionSuccess("")}
        />
      </div>
    </div>
  );
};

export default BookingTrackingPage;
