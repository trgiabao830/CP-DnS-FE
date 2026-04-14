import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { User, Phone, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { userService } from "../../services/client/user.service";
import type { BookingFlowState } from "../../types/client/booking";

interface BookingInfoForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  isPreOrderFood: boolean; 
}

const BookingInfoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as BookingFlowState;

  const [loadingProfile, setLoadingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingInfoForm>({
    defaultValues: {
      isPreOrderFood: true, 
    },
  });

  const isPreOrderFood = watch("isPreOrderFood");

  useEffect(() => {
    if (!state || !state.selectedTable) {
      navigate("/restaurant/booking");
    }
  }, [state, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
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
          localStorage.removeItem("clientUser");
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    fetchProfile();
  }, [setValue]);

  const onSubmit = (data: BookingInfoForm) => {
    const nextState: BookingFlowState = {
      ...state,
      customerInfo: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        isPreOrderFood: data.isPreOrderFood,
      },
    };

    if (data.isPreOrderFood) {
      navigate("/restaurant/booking/menu", { state: nextState });
    } else {
      navigate("/restaurant/booking/checkout", { state: nextState });
    }
  };

  const handleBack = () => {
    navigate("/restaurant/booking", { state: state });
  };

  if (!state) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-800">
            Thông tin đặt bàn
          </h1>
          <p className="text-gray-500">
            Vui lòng cung cấp thông tin của bạn để hoàn tất đặt bàn.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 👇 GỘP TẤT CẢ VÀO 1 CARD DUY NHẤT */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            {/* --- PHẦN 1: THÔNG TIN CÁ NHÂN --- */}
            <h3 className="mb-6 border-b pb-4 text-lg font-bold text-gray-800">
              Thông tin liên hệ
            </h3>

            <div className="mb-8 grid gap-6 md:grid-cols-2">
              {/* Họ tên */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register("customerName", {
                      required: "Vui lòng nhập họ tên",
                    })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-10 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Nhập họ và tên của bạn"
                    disabled={loadingProfile}
                  />
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
                {errors.customerName && (
                  <p className="mt-1 text-xs text-red-500">
                    {String(errors.customerName.message)}
                  </p>
                )}
              </div>

              {/* SĐT */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-bold text-gray-700">
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
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-10 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Nhập số điện thoại liên hệ"
                    disabled={loadingProfile}
                  />
                  <Phone
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
                {errors.customerPhone && (
                  <p className="mt-1 text-xs text-red-500">
                    {String(errors.customerPhone.message)}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-bold text-gray-700">
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
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-10 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Nhập email của bạn"
                    disabled={loadingProfile}
                  />
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                </div>
                {errors.customerEmail && (
                  <p className="mt-1 text-xs text-red-500">
                    {String(errors.customerEmail.message)}
                  </p>
                )}
              </div>
            </div>

            {/* --- PHẦN 2: TÙY CHỌN GỌI MÓN --- */}
            <h3 className="mb-6 border-b pb-4 pt-2 text-lg font-bold text-gray-800">
              Ưu tiên gọi món
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Option 1: Gọi món từ menu trước */}
              <label
                className={`relative flex h-full cursor-pointer flex-col rounded-xl border-2 p-5 transition-all hover:bg-gray-50 ${isPreOrderFood ? "border-cyan-400 bg-cyan-50/10" : "border-gray-200"}`}
              >
                <input
                  type="radio"
                  value="true"
                  {...register("isPreOrderFood")}
                  onChange={() => setValue("isPreOrderFood", true)}
                  className="hidden"
                />
                <div className="mb-2 flex items-start justify-between">
                  <span className="font-bold text-gray-800">
                    Gọi món từ menu trước
                  </span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${isPreOrderFood ? "border-cyan-500" : "border-gray-300"}`}
                  >
                    {isPreOrderFood && (
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-500">
                  Chọn món ăn bạn yêu thích ngay bây giờ để nhà hàng chuẩn bị
                  tốt nhất.
                </p>
              </label>

              {/* Option 2: Gọi món tại nhà hàng */}
              <label
                className={`relative flex h-full cursor-pointer flex-col rounded-xl border-2 p-5 transition-all hover:bg-gray-50 ${!isPreOrderFood ? "border-cyan-400 bg-cyan-50/10" : "border-gray-200"}`}
              >
                <input
                  type="radio"
                  value="false"
                  {...register("isPreOrderFood")}
                  onChange={() => setValue("isPreOrderFood", false)}
                  className="hidden"
                />
                <div className="mb-2 flex items-start justify-between">
                  <span className="font-bold text-gray-800">
                    Gọi món tại nhà hàng
                  </span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${!isPreOrderFood ? "border-cyan-500" : "border-gray-300"}`}
                  >
                    {!isPreOrderFood && (
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-500">
                  Bạn sẽ gọi món trực tiếp khi đến nhà hàng.
                </p>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loadingProfile}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan-400 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-100 transition-transform hover:scale-[1.01] hover:bg-cyan-500 disabled:opacity-70"
            >
              {isPreOrderFood ? (
                <>
                  Chọn trước món ăn <ArrowRight size={20} />
                </>
              ) : (
                <>
                  Tiếp tục thanh toán <ArrowRight size={20} />
                </>
              )}
            </button>

            {/* 👇 BUTTON QUAY LẠI */}
            <button
              type="button"
              onClick={handleBack}
              className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <ArrowLeft size={18} /> Quay lại chọn bàn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingInfoPage;