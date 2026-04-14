import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  MapPin,
  Utensils,
  Loader2,
  Tag,
  XCircle,
  Info,
  ArrowLeft,
} from "lucide-react";
import { bookingService } from "../../services/client/booking.service";
import CouponModal from "../../components/client/restaurant/CouponModal";
import { ErrorModal } from "../../components/admin/common/ActionModals";

import type {
  BookingFlowState,
  PaymentPreviewRequest,
  PaymentPreviewResponse,
  CreateBookingRequest,
  OrderItemRequest,
  CouponResponse,
  AvailableTableResponse,
} from "../../types/client/booking";

const BookingCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<BookingFlowState | null>(() => {
    if (location.state) {
      const s = location.state as BookingFlowState;
      return {
        ...s,
        guests: s.guests || s.searchParams?.numberOfGuests || 1,
        bookingDate: s.bookingDate || s.searchParams?.date,
        bookingTime: s.bookingTime || s.searchParams?.time,
      };
    }

    const tableId = searchParams.get("tableId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const guests = searchParams.get("guests");

    if (tableId && date && time) {
      return {
        selectedTable: {
          suggestedTableId: Number(tableId),
          areaId: 0, 
          areaName: "Đang tải...",
          tableName: `Bàn số ${tableId}`,
          capacity: Number(guests || 4),
          remainingTables: 1, 
        },
        bookingDate: date,
        bookingTime: time,
        guests: Number(guests || 1),
        searchParams: { date, time, numberOfGuests: Number(guests || 1) },

        customerInfo: {
          customerName: searchParams.get("name") || "",
          customerPhone: searchParams.get("phone") || "",
          customerEmail: searchParams.get("email") || "",
          isPreOrderFood: false,
        },
        cartItems: [],
      };
    }
    return null;
  });

  const [realTableInfo, setRealTableInfo] = useState<AvailableTableResponse | null>(null);

  const [depositPolicy, setDepositPolicy] = useState<PaymentPreviewResponse | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "MOMO">("VNPAY");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(null);
  const [depositType, setDepositType] = useState<"PERCENT_50" | "FULL_100">("PERCENT_50");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!state || !state.selectedTable || !state.customerInfo) {
      navigate("/restaurant/booking");
    }
  }, [state, navigate]);

  useEffect(() => {
    const fetchTable = async () => {
      const tableId = state?.selectedTable?.suggestedTableId;
      
      if (tableId) {
        try {
          const tableData = await bookingService.getTableDetail(tableId);
          setRealTableInfo(tableData);
        } catch (error) {
          console.error("Lỗi lấy thông tin bàn:", error);
          setRealTableInfo(state.selectedTable);
        }
      }
    };
    fetchTable();
  }, [state?.selectedTable?.suggestedTableId]);

  useEffect(() => {
    const fetchPolicy = async () => {
      if (!state) return;
      setLoadingPolicy(true);
      try {
        const req: PaymentPreviewRequest = {
          isPreOrderFood: state.cartItems && state.cartItems.length > 0,
        };
        const res = await bookingService.previewDepositPolicy(req);
        setDepositPolicy(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPolicy(false);
      }
    };
    fetchPolicy();
  }, [state]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  
  const formatDateDisplay = (dateStr?: string) =>
    dateStr ? dateStr.split("-").reverse().join("-") : "";
  
  const cartItems = state?.cartItems || [];

  const foodTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      const max = appliedCoupon.maxDiscountAmount || Infinity;
      discountAmount = Math.min((foodTotal * appliedCoupon.discountPercent) / 100, max);
    } else {
      discountAmount = appliedCoupon.discountAmount || 0;
    }
  }
  const totalAfterDiscount = Math.max(0, foodTotal - discountAmount);

  let amountToPay = 0;
  if (cartItems.length > 0) {
    amountToPay = depositType === "FULL_100" ? totalAfterDiscount : totalAfterDiscount * 0.5;
  } else {
    amountToPay = depositPolicy?.depositAmount || 0;
  }

  const isSimpleConfirmation = cartItems.length === 0 && amountToPay === 0;

  const handleConfirmBooking = async () => {
    if (!isAgreed || !state) return;
    setSubmitting(true);

    try {
      const orderItems: OrderItemRequest[] = cartItems.map((item) => ({
        foodId: item.foodId,
        quantity: item.quantity,
        optionIds: item.optionIds,
        note: item.note,
      }));

      const payload: CreateBookingRequest = {
        tableId: realTableInfo?.suggestedTableId || state.selectedTable.suggestedTableId,

        date: state.bookingDate,
        time: state.bookingTime,
        numberOfGuests: state.guests,

        customerName: state.customerInfo!.customerName,
        customerPhone: state.customerInfo!.customerPhone,
        customerEmail: state.customerInfo!.customerEmail,
        paymentMethod: isSimpleConfirmation ? "CASH" : paymentMethod,
        isPreOrderFood: cartItems.length > 0,
        depositType: depositType,
        couponCode: appliedCoupon?.code,
        orderItems: orderItems.length > 0 ? orderItems : undefined,
      };

      const res = await bookingService.createBooking(payload);
      if (res.paymentUrl) window.location.href = res.paymentUrl;
      else navigate(`/restaurant/booking/success?accessToken=${res.bookingCode}`);
    } catch (error: any) {
      setErrorMessage(error.message || "Có lỗi xảy ra khi tạo đơn.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (!state) return;
    const path = cartItems.length > 0 ? "/restaurant/booking/menu" : "/restaurant/booking/info";
    navigate(path, { state: state });
  };

  const handleEditCart = () => {
    if (state) navigate("/restaurant/booking/menu", { state: state });
  };

  const ActionSection = () => (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
        <span className="text-xs text-gray-500">Tôi đồng ý với <a href="#" className="text-cyan-600 hover:underline">điều khoản đặt bàn</a> và <a href="#" className="text-cyan-600 hover:underline">chính sách hoàn hủy</a>.</span>
      </label>
      <button onClick={handleConfirmBooking} disabled={!isAgreed || submitting} className="w-full rounded-xl bg-cyan-400 py-4 font-bold text-white shadow-lg shadow-cyan-100 transition-all hover:scale-[1.02] hover:bg-cyan-500 disabled:opacity-50">
        {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Đang xử lý...</span> : isSimpleConfirmation ? "Xác nhận đặt bàn" : "Thanh toán ngay"}
      </button>
      <button onClick={handleBack} className="flex w-full items-center justify-center gap-2 text-center text-sm font-medium text-gray-500 hover:text-gray-800">
        {isSimpleConfirmation && <ArrowLeft size={16} />} Quay lại
      </button>
    </div>
  );

  if (!state || !state.selectedTable) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800 md:text-4xl">{isSimpleConfirmation ? "Xác nhận thông tin" : "Xác nhận & Thanh toán"}</h1>
          <p className="text-gray-500">{isSimpleConfirmation ? "Vui lòng kiểm tra lại thông tin trước khi xác nhận." : "Vui lòng xem lại thông tin đặt chỗ bên dưới và hoàn tất thanh toán."}</p>
        </div>

        <div className={isSimpleConfirmation ? "mx-auto max-w-3xl" : "grid items-start gap-8 lg:grid-cols-3"}>
          <div className={isSimpleConfirmation ? "w-full" : "space-y-6 lg:col-span-2"}>
            {/* CARD THÔNG TIN */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b border-gray-100 pb-4 text-lg font-bold text-gray-800">Thông tin đặt bàn</h3>
              <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                <div><label className="text-xs font-bold uppercase text-gray-500">Họ và tên</label><div className="mt-1 font-medium text-gray-800">{state.customerInfo?.customerName}</div></div>
                <div><label className="text-xs font-bold uppercase text-gray-500">Ngày đặt</label><div className="mt-1 font-medium text-gray-800">{formatDateDisplay(state.bookingDate)}</div></div>
                <div><label className="text-xs font-bold uppercase text-gray-500">SĐT</label><div className="mt-1 font-medium text-gray-800">{state.customerInfo?.customerPhone}</div></div>
                <div><label className="text-xs font-bold uppercase text-gray-500">Giờ đến</label><div className="mt-1 font-medium text-gray-800">{state.bookingTime}</div></div>
                <div><label className="text-xs font-bold uppercase text-gray-500">Email</label><div className="mt-1 break-all font-medium text-gray-800">{state.customerInfo?.customerEmail}</div></div>
                
                {/* 👇 HIỂN THỊ SỐ KHÁCH CHÍNH XÁC */}
                <div>
                    <label className="text-xs font-bold uppercase text-gray-500">Số lượng khách</label>
                    <div className="mt-1 flex items-center gap-2 font-medium text-gray-800">
                        {state.guests} người
                    </div>
                </div>

                {/* 👇 HIỂN THỊ BÀN CHÍNH XÁC (Dùng realTableInfo) */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Bàn đã chọn</label>
                    <div className="mt-1 flex items-center gap-2 font-medium text-gray-800">
                        {realTableInfo 
                            ? `${realTableInfo.areaName} - Bàn ${realTableInfo.tableName}` 
                            : <span className="text-gray-400 italic flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Đang tải thông tin bàn...</span>}
                    </div>
                </div>
              </div>
              {isSimpleConfirmation && <div className="mt-8 border-t border-gray-100 pt-6"><ActionSection /></div>}
            </div>

            {cartItems.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4"><h3 className="text-lg font-bold text-gray-800">Chi tiết đơn món</h3></div>
                {/* ... (Phần cart table giữ nguyên) ... */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Món</th><th className="px-4 py-3 text-center">SL</th><th className="px-4 py-3 text-right">Tiền</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {cartItems.map((item) => (
                        <tr key={item.tempId}>
                          <td className="px-4 py-4 font-bold">{item.name} <span className="block text-xs font-normal text-gray-400">{item.optionNames.join(", ")}</span></td>
                          <td className="px-4 py-4 text-center">{item.quantity}</td>
                          <td className="px-4 py-4 text-right font-bold">{formatPrice(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end gap-2 text-sm italic text-gray-500"><button onClick={handleEditCart} className="text-cyan-500 hover:underline">Chỉnh sửa món</button></div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PAYMENT (ẨN NẾU SIMPLE) */}
          {!isSimpleConfirmation && (
            <div className="space-y-6 lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-6 border-b pb-4 text-lg font-bold text-gray-800">
                  Thanh toán
                </h3>

                {loadingPolicy ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-cyan-500" />
                  </div>
                ) : (
                  <>
                    {/* Coupon */}
                    {cartItems.length > 0 && (
                      <div className="mb-6">
                        <div
                          onClick={() => setIsCouponModalOpen(true)}
                          className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-cyan-300 bg-cyan-50/50 px-4 py-3 transition-colors hover:bg-cyan-50"
                        >
                          <div className="flex items-center gap-2 text-cyan-700">
                            <Tag size={18} />
                            <span className="text-sm font-medium">
                              {appliedCoupon
                                ? `Mã: ${appliedCoupon.code}`
                                : "Chọn mã giảm giá"}
                            </span>
                          </div>
                          {appliedCoupon ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppliedCoupon(null);
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <XCircle size={18} />
                            </button>
                          ) : (
                            <span className="text-sm font-bold text-cyan-600">
                              Chọn &gt;
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tính tiền */}
                    <div className="mb-6 space-y-3 border-b border-gray-100 pb-6 text-sm">
                      {cartItems.length > 0 ? (
                        <>
                          <div className="flex justify-between text-gray-600">
                            <span>Tạm tính (Món ăn)</span>
                            <span>{formatPrice(foodTotal)}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Giảm giá</span>
                              <span>-{formatPrice(discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-dashed pt-2 font-bold text-gray-800">
                            <span>Tổng cộng</span>
                            <span>{formatPrice(totalAfterDiscount)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>
                            Bạn chưa chọn món ăn. Chi phí sẽ được tính tại nhà
                            hàng.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Option Cọc */}
                    {cartItems.length > 0 ? (
                      <div className="mb-6">
                        <h4 className="mb-3 text-sm font-bold text-gray-700">
                          Hình thức đặt cọc
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <label
                            className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${depositType === "PERCENT_50" ? "border-cyan-500 bg-cyan-50/20 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                          >
                            <input
                              type="radio"
                              className="hidden"
                              checked={depositType === "PERCENT_50"}
                              onChange={() => setDepositType("PERCENT_50")}
                            />
                            <div className="mb-1 text-xs font-medium">
                              Cọc trước 50%
                            </div>
                            <div className="font-bold">
                              {formatPrice(totalAfterDiscount * 0.5)}
                            </div>
                          </label>

                          <label
                            className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${depositType === "FULL_100" ? "border-cyan-500 bg-cyan-50/20 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                          >
                            <input
                              type="radio"
                              className="hidden"
                              checked={depositType === "FULL_100"}
                              onChange={() => setDepositType("FULL_100")}
                            />
                            <div className="mb-1 text-xs font-medium">
                              Thanh toán hết
                            </div>
                            <div className="font-bold">
                              {formatPrice(totalAfterDiscount)}
                            </div>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 flex items-start gap-2 rounded-lg bg-cyan-50 p-3 text-xs text-cyan-800">
                        <Info size={14} className="mt-0.5 shrink-0" />
                        <span>
                          Phí giữ chỗ cố định (sẽ được trừ vào hóa đơn khi đến
                          ăn).
                        </span>
                      </div>
                    )}

                    {/* Tổng thanh toán */}
                    <div className="mb-6 flex items-center justify-between pt-2">
                      <span className="font-medium text-gray-600">
                        Thanh toán ngay
                      </span>
                      <span className="text-xl font-bold text-cyan-600">
                        {formatPrice(amountToPay)}
                      </span>
                    </div>

                    {/* Phương thức thanh toán */}
                    <div className="mb-6">
                      <h4 className="mb-3 text-sm font-bold text-gray-700">
                        Phương thức thanh toán
                      </h4>
                      <div className="space-y-3">
                        <label
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${paymentMethod === "VNPAY" ? "border-cyan-500 bg-cyan-50/20" : "border-gray-200 hover:bg-gray-50"}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payment"
                              value="VNPAY"
                              checked={paymentMethod === "VNPAY"}
                              onChange={() => setPaymentMethod("VNPAY")}
                              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="font-bold text-gray-700">
                              VNPAY
                            </span>
                          </div>
                          <img
                            src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png"
                            alt="VNPAY"
                            className="h-6 object-contain"
                          />
                        </label>
                      </div>
                    </div>

                    <ActionSection />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <CouponModal
          isOpen={isCouponModalOpen}
          onClose={() => setIsCouponModalOpen(false)}
          totalOrderValue={foodTotal}
          onApply={(coupon) => {
            setAppliedCoupon(coupon);
            setIsCouponModalOpen(false);
          }}
          serviceType="RESTAURANT"
        />

        <ErrorModal
          message={errorMessage}
          onClose={() => setErrorMessage("")}
        />
      </div>
    </div>
  );
};

export default BookingCheckoutPage;
