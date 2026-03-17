import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { clientAuthService } from "../../services/client/auth.service";
import { useAuthModal } from "../../context/client/AuthModalContext";
import type { ResetPasswordRequest } from "../../types/client/auth";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { openModal } = useAuthModal();

  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    defaultValues: { token: token || "" },
  });

  const toggleShow = (field: "new" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const onSubmit = async (data: ResetPasswordRequest) => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await clientAuthService.resetPassword(data);
      setIsSuccess(true);
    } catch (error: any) {
      setErrorMsg(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/", { replace: true });
  };

  if (!token) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Đường dẫn không hợp lệ</h2>
          <p className="mt-2 text-gray-500">Vui lòng kiểm tra lại email của bạn.</p>
          <button 
            onClick={() => navigate("/")}
            className="mt-6 font-semibold text-cyan-600 hover:underline"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Đổi mật khẩu thành công!</h2>
          <p className="mt-2 text-gray-500">Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.</p>
          <button
            onClick={handleGoToLogin}
            className="mt-6 w-full rounded-xl bg-cyan-500 py-3 font-bold text-white shadow-lg shadow-cyan-200 transition-all hover:bg-cyan-600"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-500">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register("token")} />

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword.new ? "text" : "password"}
                {...register("newPassword", {
                  required: "Vui lòng nhập mật khẩu mới",
                  minLength: { value: 6, message: "Tối thiểu 6 ký tự" },
                })}
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => toggleShow("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword.confirm ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Vui lòng xác nhận mật khẩu",
                  validate: (val) => {
                    if (watch("newPassword") != val) return "Mật khẩu không khớp";
                  },
                })}
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => toggleShow("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3.5 font-bold text-white shadow-lg shadow-cyan-200 transition-all hover:bg-cyan-600 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;