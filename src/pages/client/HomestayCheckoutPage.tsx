import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Phone,
  Mail,
  Loader2,
  Tag,
  XCircle,
} from "lucide-react";
import { homestayBookingService } from "../../services/client/homestay-booking.service";
import CouponModal from "../../components/client/restaurant/CouponModal";
import { ErrorModal } from "../../components/admin/common/ActionModals";
import { format, differenceInDays } from "date-fns";
import { userService } from "../../services/client/user.service";

import type {
  HomestayBookingFlowState,
  CreateHomestayBookingRequest,
  CouponResponse,
} from "../../types/client/homestay-booking";

interface ExtendedHomestayState extends HomestayBookingFlowState {
  tempCustomerInfo?: {
    name: string;
    phone: string;
    email: string;
  };
}

const HomestayCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ExtendedHomestayState;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateHomestayBookingRequest>();

  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "MOMO">("VNPAY");
  const [isAgreed, setIsAgreed] = useState(false);

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(
    null,
  );
  const [depositType, setDepositType] = useState<"PERCENT_50" | "FULL_100">(
    "PERCENT_50",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!state || !state.selectedRoom || !state.searchParams) {
      navigate("/homestay/booking");
    }
  }, [state, navigate]);

  useEffect(() => {
    const fillCustomerData = async () => {
      const tempInfo = state?.tempCustomerInfo;

      if (tempInfo && (tempInfo.name || tempInfo.phone || tempInfo.email)) {
        if (tempInfo.name) setValue("customerName", tempInfo.name);
        if (tempInfo.phone) setValue("customerPhone", tempInfo.phone);
        if (tempInfo.email) setValue("customerEmail", tempInfo.email);
      }
      else {
        const storedUser = localStorage.getItem("clientUser");
        if (storedUser) {
          setLoadingProfile(true);
          try {
            const profile = await userService.getMyProfile();
            setValue("customerName", profile.fullName);
            setValue("customerPhone", profile.phone);
            setValue("customerEmail", profile.email);
          } catch (error) {
            console.error("Lỗi lấy thông tin user", error);
          } finally {
            setLoadingProfile(false);
          }
        }
      }
    };

    fillCustomerData();
  }, [state, setValue]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const room = state?.selectedRoom;
  const search = state?.searchParams;

  const nights = search
    ? differenceInDays(
        new Date(search.checkOutDate),
        new Date(search.checkInDate),
      )
    : 0;

  const mainImage =
    room?.images && room.images.length > 0 ? room.images[0] : "";

  const roomTotal = (room?.basePrice || 0) * (nights > 0 ? nights : 1);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      discountAmount = (roomTotal * appliedCoupon.discountPercent) / 100;
      if (appliedCoupon.maxDiscountAmount) {
        discountAmount = Math.min(
          discountAmount,
          appliedCoupon.maxDiscountAmount,
        );
      }
    } else if (appliedCoupon.discountAmount) {
      discountAmount = appliedCoupon.discountAmount;
    }
  }

  const totalAfterDiscount = Math.max(0, roomTotal - discountAmount);
  const amountToPay =
    depositType === "FULL_100" ? totalAfterDiscount : totalAfterDiscount * 0.5;

  const onSubmit = async (data: CreateHomestayBookingRequest) => {
    if (!isAgreed) return;
    setSubmitting(true);
    try {
      const payload: CreateHomestayBookingRequest = {
        ...data,
        roomTypeId: room.typeId,
        checkInDate: search.checkInDate,
        checkOutDate: search.checkOutDate,
        numberOfAdults: search.numberOfAdults,
        numberOfChildren: search.numberOfChildren,
        paymentMethod: paymentMethod,
        depositType: depositType,
        couponCode: appliedCoupon?.code,
      };

      const res = await homestayBookingService.createBooking(payload);

      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        navigate(`/homestay/booking/success?code=${res.bookingCode}`);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Có lỗi xảy ra khi tạo đơn.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!state || !state.selectedRoom) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800 md:text-4xl">
            Xác nhận & Thanh toán
          </h1>
          <p className="text-sm text-gray-500">
            Vui lòng kiểm tra thông tin liên hệ và hoàn tất tiền cọc
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid items-start gap-8 lg:grid-cols-3"
        >
          {/* LEFT COLUMN */}
          <div className="space-y-6 lg:col-span-2">
            {/* 1. THÔNG TIN LIÊN HỆ */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              {loadingProfile && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              )}

              <h3 className="mb-6 flex items-center gap-2 border-b pb-4 text-lg font-bold text-slate-800">
                Thông tin liên hệ
              </h3>

              <div className="mb-8 grid gap-6 md:grid-cols-2">
                {/* Họ tên */}
                <div className="col-span-2 md:col-span-1">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register("customerName", {
                        required: "Vui lòng nhập họ tên",
                      })}
                      className={`w-full rounded-xl border ${errors.customerName ? "border-red-500" : "border-slate-200"} px-4 py-3 pl-10 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50`}
                      placeholder="Nhập họ và tên của bạn"
                      disabled={loadingProfile}
                    />
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                  </div>
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>

                {/* SĐT */}
                <div className="col-span-2 md:col-span-1">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register("customerPhone", {
                        required: "Vui lòng nhập số điện thoại",
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Số điện thoại không hợp lệ",
                        },
                      })}
                      className={`w-full rounded-xl border ${errors.customerPhone ? "border-red-500" : "border-slate-200"} px-4 py-3 pl-10 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50`}
                      placeholder="Nhập số điện thoại liên hệ"
                      disabled={loadingProfile}
                    />
                    <Phone
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.customerPhone.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register("customerEmail", {
                        required: "Vui lòng nhập email",
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: "Email không hợp lệ",
                        },
                      })}
                      className={`w-full rounded-xl border ${errors.customerEmail ? "border-red-500" : "border-slate-200"} px-4 py-3 pl-10 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50`}
                      placeholder="Nhập email để nhận xác nhận"
                      disabled={loadingProfile}
                    />
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                  </div>
                  {errors.customerEmail && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.customerEmail.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. CHI TIẾT PHÒNG */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b pb-4 text-lg font-bold text-gray-800">
                Thông tin phòng đã chọn
              </h3>
              <div className="flex flex-col gap-6 md:flex-row">
                <img
                  src={mainImage}
                  className="h-32 w-full rounded-xl object-cover md:w-48"
                  alt={room.typeName}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-lg font-bold leading-snug text-slate-900">
                      {room.typeName}
                    </h4>
                    <span className="shrink-0 whitespace-nowrap rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                      {room.className}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-y-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        Nhận phòng
                      </span>
                      <span className="font-bold text-gray-700">
                        {format(new Date(search.checkInDate), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        Trả phòng
                      </span>
                      <span className="font-bold text-gray-700">
                        {format(new Date(search.checkOutDate), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        Số khách
                      </span>
                      <span className="font-bold text-gray-700">
                        {search.numberOfAdults} người lớn,{" "}
                        {search.numberOfChildren} trẻ em
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        Thời gian
                      </span>
                      <span className="font-bold text-gray-700">
                        {nights} đêm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PAYMENT */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-6 border-b pb-4 text-lg font-bold text-gray-800">
                Thanh toán
              </h3>

              {/* Coupon */}
              <div className="mb-6">
                <div
                  onClick={() => setIsCouponModalOpen(true)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-cyan-300 bg-cyan-50/50 px-4 py-3 hover:bg-cyan-50"
                >
                  <div className="flex items-center gap-2 text-sm text-cyan-700">
                    <Tag size={18} />
                    <span>
                      {appliedCoupon
                        ? `Mã: ${appliedCoupon.code}`
                        : "Chọn mã giảm giá"}
                    </span>
                  </div>
                  {appliedCoupon ? (
                    <button
                      type="button"
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

              {/* Price Details */}
              <div className="mb-6 space-y-3 border-b border-gray-100 pb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <div className="flex flex-col">
                    <span>Tiền phòng</span>
                    <span className="text-[12px] text-gray-400">
                      {formatPrice(room?.basePrice || 0)} x {nights} đêm
                    </span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {formatPrice(roomTotal)}
                  </span>
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
              </div>

              {/* Deposit Type */}
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-bold text-gray-700">
                  Mức đặt cọc
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${depositType === "PERCENT_50" ? "border-cyan-500 bg-cyan-50/20 text-cyan-700" : "border-gray-200 text-gray-600"}`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      checked={depositType === "PERCENT_50"}
                      onChange={() => setDepositType("PERCENT_50")}
                    />
                    <div className="text-xs">Cọc 50%</div>
                    <div className="font-bold">
                      {formatPrice(totalAfterDiscount * 0.5)}
                    </div>
                  </label>
                  <label
                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${depositType === "FULL_100" ? "border-cyan-500 bg-cyan-50/20 text-cyan-700" : "border-gray-200 text-gray-600"}`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      checked={depositType === "FULL_100"}
                      onChange={() => setDepositType("FULL_100")}
                    />
                    <div className="text-xs">Cọc 100%</div>
                    <div className="font-bold">
                      {formatPrice(totalAfterDiscount)}
                    </div>
                  </label>
                </div>
              </div>

              {/* Final Total */}
              <div className="mb-6 flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-gray-600">
                  Thanh toán ngay
                </span>
                <span className="text-xl font-bold text-cyan-600">
                  {formatPrice(amountToPay)}
                </span>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-cyan-500 bg-cyan-50/20 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked
                      readOnly
                      className="h-4 w-4 text-cyan-600"
                    />
                    <span className="font-bold text-gray-700">VNPAY</span>
                  </div>
                  <img
                    src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Icon-VNPAY-QR.png"
                    alt="VNPAY"
                    className="h-6"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600"
                  />
                  <span className="text-[11px] leading-tight text-gray-500">
                    Tôi đồng ý với chính sách và điều khoản của Homestay.
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={!isAgreed || submitting}
                  className="w-full rounded-xl bg-cyan-400 py-4 font-bold text-white shadow-lg shadow-cyan-100 transition-all hover:bg-cyan-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="mx-auto animate-spin" />
                  ) : (
                    "Xác nhận đặt phòng"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full py-2 text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        </form>

        <CouponModal
          isOpen={isCouponModalOpen}
          onClose={() => setIsCouponModalOpen(false)}
          totalOrderValue={roomTotal}
          onApply={(coupon) => {
            setAppliedCoupon(coupon);
            setIsCouponModalOpen(false);
          }}
          serviceType="HOMESTAY"
        />
        <ErrorModal
          message={errorMessage}
          onClose={() => setErrorMessage("")}
        />
      </div>
    </div>
  );
};

export default HomestayCheckoutPage;
