import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Bed,
  Users,
  CheckCircle,
} from "lucide-react";
import { homestayBookingService } from "../../services/client/homestay-booking.service";
import type { HomestayBookingDetailResponse } from "../../types/client/homestay-booking";
import {
  ErrorModal,
  SuccessModal,
} from "../../components/admin/common/ActionModals";
import { format, differenceInCalendarDays, subHours } from "date-fns";

const HomestayTrackingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accessToken = searchParams.get("code");

  const [booking, setBooking] = useState<HomestayBookingDetailResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState({
    error: "",
    success: "",
  });

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
    const labels: Record<string, string> = { CASH: "Tiền mặt", VNPAY: "VNPAY" };
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
      case "CHECKED_IN":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-blue-600">
            <span className="text-sm font-bold">Đang lưu trú</span>
          </div>
        );
      case "COMPLETED":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-gray-600">
            <span className="text-sm font-bold">Hoàn thành</span>
          </div>
        );
      case "CANCELLED":
        return (
          <div className="flex items-center gap-2 px-3 py-1 text-red-600">
            <span className="text-sm font-bold">Đã hủy</span>
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
    homestayBookingService
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
    if (isLoggedIn) navigate("/homestay/booking-history");
    else navigate("/homestay/booking");
  };

  const handleCancelBooking = async () => {
    if (!accessToken) return;
    setIsCancelling(true);
    try {
      const message = await homestayBookingService.cancelBooking(accessToken);
      setActionMessage({ error: "", success: message });
      setShowCancelConfirm(false);
      fetchBookingData();
    } catch (err: any) {
      setActionMessage({ error: err.message, success: "" });
      setShowCancelConfirm(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const checkCancellationValidity = () => {
    if (!booking) return { canCancel: false, message: "" };
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED")
      return { canCancel: false, message: "Không thể hủy ở trạng thái này" };

    const checkInDate = new Date(booking.checkInDate);
    checkInDate.setHours(14, 0, 0, 0);

    const now = new Date();
    const hoursLimit = booking.cancellationNoticeHours || 0;
    const deadline = subHours(checkInDate, hoursLimit);

    const canCancel = now < deadline;

    return {
      canCancel,
      message: !canCancel
        ? `Đã quá hạn hủy (trước ${hoursLimit}h nhận phòng).`
        : "",
    };
  };

  if (loading)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <Loader2 size={40} className="mb-4 animate-spin text-blue-500" />
        <p className="text-gray-500">Đang tải thông tin đơn...</p>
      </div>
    );
  if (pageError || !booking)
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
            className="font-bold text-blue-600 hover:underline"
          >
            Quay lại
          </button>
        </div>
      </div>
    );

  const { canCancel, message: cancelMessage, hoursLimit } = checkCancellationValidity();

  const nights = booking
    ? differenceInCalendarDays(
        new Date(booking.checkOutDate),
        new Date(booking.checkInDate),
      )
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-6">
      <div className="mx-auto max-w-5xl">
        {/* Header Navigation */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="rounded-full p-2 transition-colors hover:bg-white"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            Chi tiết đơn đặt phòng
          </h1>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-3">
          {/* --- CỘT TRÁI (2 phần) --- */}
          <div className="space-y-6 md:col-span-2">
            {/* 1. Card Trạng Thái & Thông Tin Chung (Giống BookingTrackingPage) */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                    Mã đơn đặt phòng
                  </p>
                  <p className="font-mono text-xl font-bold tracking-wider text-slate-800">
                    #{booking.bookingId}
                  </p>
                </div>
                {renderStatusBadge(booking.status)}
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Khách hàng
                  </label>
                  <div className="mt-1 font-medium text-slate-800">
                    {booking.customerName}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Liên hệ
                  </label>
                  <div className="mt-1 font-medium text-slate-800">
                    {booking.customerPhone}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">
                    HẠNG PHÒNG
                  </label>
                  <div className="mt-1 font-medium text-slate-800">
                    {booking.roomClass}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Số phòng
                  </label>
                  <div className="mt-1 font-medium text-slate-800">
                    {booking.roomNumber
                      ? `${booking.roomNumber}`
                      : "Đang xếp phòng"}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Card Thông Tin Phòng (Thay thế cho list món ăn) */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-blue-50/50 px-6 py-4">
                <h3 className="font-bold text-slate-800">Chi tiết lưu trú</h3>
              </div>

              <div className="p-6">
                <div className="mb-6 flex flex-col gap-5 sm:flex-row">
                  <img
                    src={booking.roomImage || "https://via.placeholder.com/150"}
                    alt={booking.roomName}
                    className="h-24 w-full rounded-lg border border-slate-200 bg-slate-100 object-cover sm:w-32"
                  />
                  <div className="flex-1 space-y-1">
                    <h4 className="text-lg font-bold text-slate-900">
                      {booking.roomName}
                    </h4>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        <Users size={12} /> {booking.numberOfAdults} người lớn,{" "}
                        {booking.numberOfChildren} trẻ em
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400">
                        Nhận phòng
                      </span>
                      <span className="font-semibold text-slate-700">
                        {format(new Date(booking.checkInDate), "dd/MM/yyyy")}
                      </span>
                      <span className="block text-xs text-slate-400">
                        Từ 14:00
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400">
                        Trả phòng
                      </span>
                      <span className="font-semibold text-slate-700">
                        {format(new Date(booking.checkOutDate), "dd/MM/yyyy")}
                      </span>
                      <span className="block text-xs text-slate-400">
                        Trước 12:00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: THANH TOÁN (Giống BookingTrackingPage) --- */}
          <div className="space-y-6 lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                Thanh toán
              </h3>

              <div className="space-y-3 border-b border-dashed border-slate-200 pb-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Phương thức</span>
                  <span className="font-medium text-slate-800">
                    {getPaymentMethodLabel(booking.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <div className="flex flex-col">
                    <span>Tiền phòng (Gốc)</span>
                    <span className="text-[12px] text-slate-400">
                      {formatPrice(booking.pricePerNight)} x {nights} đêm
                    </span>
                  </div>
                  <span className="font-medium text-slate-800">
                    {formatPrice(booking.subTotal)}
                  </span>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(booking.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 font-bold text-slate-800">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Đã thanh toán (Cọc)</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(booking.depositAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
                  <span className="text-sm font-bold text-blue-800">
                    Cần trả tại quầy
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatPrice(
                      Math.max(0, booking.totalAmount - booking.depositAmount),
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-center text-xs text-slate-400">
                Được tạo lúc: {formatDateTime(booking.createdAt)}
              </div>

              {/* NÚT HỦY ĐẶT PHÒNG */}
              {(booking.status === "PENDING" ||
                booking.status === "CONFIRMED") && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  {canCancel ? (
                    <>
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white"
                      >
                        Hủy đặt phòng
                      </button>
                      {hoursLimit > 0 && (
                        <p className="mt-2 px-2 text-center text-[10px] text-slate-400">
                          Lưu ý: Hủy trước {hoursLimit}h (so với giờ nhận phòng)
                          để không bị tính phí phạt.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex w-full cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-3 font-bold text-slate-400">
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

        {/* --- MODAL XÁC NHẬN HỦY (Giống hệt trang Restaurant) --- */}
        {showCancelConfirm && (
          <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 duration-200">
            <div className="animate-in zoom-in-95 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Xác nhận hủy đặt phòng?
                </h3>
                <p className="mb-6 mt-2 text-sm text-slate-500">
                  Bạn có chắc chắn muốn hủy đơn này không? Hành động này không
                  thể hoàn tác.
                  {booking.depositAmount > 0 && <br />}
                  <span className="font-medium text-red-500">
                    {booking.depositAmount > 0
                      ? "Tiền cọc sẽ được xử lý theo chính sách hoàn hủy."
                      : ""}
                  </span>
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
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

        <ErrorModal
          message={actionMessage.error}
          onClose={() => setActionMessage((prev) => ({ ...prev, error: "" }))}
        />
        <SuccessModal
          message={actionMessage.success}
          onClose={() => setActionMessage((prev) => ({ ...prev, success: "" }))}
        />
      </div>
    </div>
  );
};

export default HomestayTrackingPage;
