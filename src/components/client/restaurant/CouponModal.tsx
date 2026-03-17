import React, { useEffect, useState } from "react";
import { X, Tag, Loader2, AlertCircle } from "lucide-react";
import { bookingService } from "../../../services/client/booking.service";
import { homestayBookingService } from "../../../services/client/homestay-booking.service"; 
import type { CouponResponse } from "../../../types/client/booking";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (coupon: CouponResponse) => void;
  totalOrderValue: number;
  serviceType: "RESTAURANT" | "HOMESTAY";
}

const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  onApply,
  totalOrderValue,
  serviceType,
}) => {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");

  const isHomestay = serviceType === "HOMESTAY";
  const primaryColor = isHomestay ? "blue" : "cyan";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (isOpen) {
      const fetchCoupons = async () => {
        setLoading(true);
        try {
          const data = serviceType === "HOMESTAY"
            ? await homestayBookingService.getAvailableCoupons()
            : await bookingService.getAvailableCoupons();
          setCoupons(data || []);
        } catch (err) {
          console.error(err);
          setCoupons([]);
        } finally {
          setLoading(false);
        }
      };
      fetchCoupons();
    }
  }, [isOpen, serviceType]);

  const handleApplyInput = () => {
    if (!inputCode.trim()) return;
    const found = coupons.find(c => c.code.toLowerCase() === inputCode.toLowerCase());
    if (found) {
      if (checkCondition(found)) {
        onApply(found);
        onClose();
      }
    } else {
      setError("Mã không tồn tại.");
    }
  };

  const checkCondition = (coupon: CouponResponse) => {
    if (coupon.minOrderValue && totalOrderValue < coupon.minOrderValue) {
      setError(`Đơn tối thiểu ${formatPrice(coupon.minOrderValue)}`);
      return false;
    }
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm transition-all">
      {/* Container Modal: Mobile h-5/6 (Bottom Sheet), Desktop h-fit */}
      <div className="animate-in slide-in-from-bottom sm:zoom-in flex h-[85vh] sm:h-auto max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Chọn mã ưu đãi</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">Áp dụng cho dịch vụ {isHomestay ? "Homestay" : "Nhà hàng"}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <X size={22} className="text-gray-400" />
          </button>
        </div>

        {/* Input area - Fixed */}
        <div className="bg-gray-50/50 p-4 sm:p-5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="NHẬP MÃ TẠI ĐÂY"
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value); setError(""); }}
              className={`flex-grow rounded-xl border border-gray-200 px-4 py-2.5 text-sm uppercase outline-none transition-all focus:ring-2 ${
                isHomestay ? "focus:border-blue-500 focus:ring-blue-100" : "focus:border-cyan-500 focus:ring-cyan-100"
              }`}
            />
            <button
              onClick={handleApplyInput}
              disabled={!inputCode}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 ${
                isHomestay ? "bg-blue-600 hover:bg-blue-700" : "bg-cyan-500 hover:bg-cyan-600"
              }`}
            >
              Dùng
            </button>
          </div>
          {error && <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-red-500"><AlertCircle size={12}/> {error}</p>}
        </div>

        {/* List area - Scrollable */}
        <div className="custom-scrollbar flex-grow space-y-3 overflow-y-auto bg-white p-4 sm:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className={`h-8 w-8 animate-spin ${isHomestay ? "text-blue-600" : "text-cyan-500"}`} />
              <p className="text-xs text-gray-400">Đang tải danh sách ưu đãi...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-20 text-center">
              <Tag size={48} className="mx-auto mb-3 opacity-10" />
              <p className="text-sm text-gray-400 font-medium">Hiện tại chưa có mã nào khả dụng</p>
            </div>
          ) : (
            coupons.map((coupon) => {
              const isValid = !coupon.minOrderValue || totalOrderValue >= coupon.minOrderValue;
              
              let estimatedDiscount = 0;
              if (isValid) {
                if (coupon.discountPercent) {
                  estimatedDiscount = (totalOrderValue * coupon.discountPercent) / 100;
                  if (coupon.maxDiscountAmount) estimatedDiscount = Math.min(estimatedDiscount, coupon.maxDiscountAmount);
                } else {
                  estimatedDiscount = coupon.discountAmount || 0;
                }
              }

              return (
                <div
                  key={coupon.couponId}
                  className={`relative flex flex-col gap-3 rounded-2xl border p-4 transition-all ${
                    isValid
                      ? "border-gray-200 bg-white hover:border-blue-200 hover:shadow-md"
                      : "border-gray-100 bg-gray-50 opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isHomestay ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"}`}>
                      <Tag size={24} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-gray-800 uppercase text-sm sm:text-base">{coupon.code}</h4>
                        {isValid && estimatedDiscount > 0 && (
                          <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
                            - {formatPrice(estimatedDiscount)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] sm:text-xs text-gray-600 font-medium leading-tight">
                        {coupon.discountPercent ? `Giảm ${coupon.discountPercent}% cho toàn đơn` : `Giảm giá trực tiếp ${formatPrice(coupon.discountAmount || 0)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-400">
                        {coupon.minOrderValue ? `Đơn tối thiểu: ${formatPrice(coupon.minOrderValue)}` : "Không yêu cầu tối thiểu"}
                      </p>
                      {coupon.validUntil && (
                        <p className="text-[10px] text-gray-400">HSD: <span className="font-bold">{formatDateTime(coupon.validUntil)}</span></p>
                      )}
                    </div>
                    {isValid ? (
                      <button
                        onClick={() => { onApply(coupon); onClose(); }}
                        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all border ${
                          isHomestay ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-cyan-500 text-white border-cyan-500 shadow-sm"
                        }`}
                      >
                        Dùng mã
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded">Yêu cầu đăng nhập để dùng</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponModal;