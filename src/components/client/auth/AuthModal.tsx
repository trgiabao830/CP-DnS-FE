import React, { useState } from "react";
import { X, Eye, EyeOff, Loader2, CalendarIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useAuthModal } from "../../../context/client/AuthModalContext";
import { clientAuthService } from "../../../services/client/auth.service";
import type { LoginRequest, RegisterRequest } from "../../../types/client/auth";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";

registerLocale("vi", vi);

const formatDateForJava = (date: Date | null) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const AuthModal = () => {
  const { isOpen, closeModal, view } = useAuthModal();
  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-200">
      <div className="animate-in zoom-in-95 relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="custom-scrollbar max-h-[90vh] overflow-y-auto p-8">
          {view === "LOGIN" && <LoginForm />}
          {view === "REGISTER" && <RegisterForm />}
          {view === "FORGOT_PASSWORD" && <ForgotPasswordForm />}
        </div>
      </div>
    </div>
  );
};

const LoginForm = () => {
  const { switchView, closeModal } = useAuthModal();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    setError("");
    try {
      const user = await clientAuthService.login(data);
      localStorage.setItem("clientUser", JSON.stringify(user));
      closeModal();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Đăng nhập</h2>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            {...register("username", { required: "Vui lòng nhập tài khoản" })}
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Nhập số điện thoại"
          />
          {errors.username && (
            <span className="text-xs text-red-500">
              {errors.username.message}
            </span>
          )}
        </div>

        <div>
          <div className="mb-1 flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              {...register("password", { required: "Vui lòng nhập mật khẩu" })}
              placeholder="••••••"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-red-500">
              {errors.password.message}
            </span>
          )}
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={() => switchView("FORGOT_PASSWORD")}
              className="text-xs text-cyan-600 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-2.5 font-bold text-white hover:bg-cyan-500"
        >
          {loading && <Loader2 size={18} className="animate-spin" />} Đăng nhập
        </button>
      </form>

      <div className="text-center text-sm text-gray-600">
        Chưa có tài khoản?{" "}
        <button
          onClick={() => switchView("REGISTER")}
          className="font-bold text-cyan-600 hover:underline"
        >
          Đăng ký ngay
        </button>
      </div>
    </div>
  );
};

const RegisterForm = () => {
  const { switchView } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<any>();
  const password = watch("password");

  const maxDateValue = new Date("2031-12-31");

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { termsAccepted, ...restData } = data;
      const payload: RegisterRequest = {
        ...restData,
        dob: formatDateForJava(data.dob),
      };
      const msg = await clientAuthService.register(payload);
      setSuccess(msg);
      setTimeout(() => switchView("LOGIN"), 2000);
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Đăng ký</h2>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Họ tên */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            {...register("fullName", { required: "Vui lòng nhập họ tên" })}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="Nguyễn Văn A"
          />
          {errors.fullName && (
            <span className="text-xs text-red-500">
              {String(errors.fullName.message)}
            </span>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Vui lòng nhập email",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: "Email không hợp lệ",
                },
              })}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="dineandstay@gmail.com"
            />
            {errors.email && (
              <span className="text-xs text-red-500">
                {String(errors.email.message)}
              </span>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              {...register("phone", {
                required: "Nhập số điện thoại",
                minLength: { value: 10, message: "SĐT phải từ 10-11 số" },
                maxLength: { value: 11, message: "SĐT phải từ 10-11 số" },
                pattern: { value: /^[0-9]+$/, message: "Chỉ nhập số" },
                onChange: (e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setValue("phone", value);
                },
              })}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="0546..."
            />
            {errors.phone && (
              <span className="text-xs text-red-500">
                {String(errors.phone.message)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <select
              {...register("gender", { required: "Chọn giới tính" })}
              className="h-[42px] w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ngày sinh <span className="text-red-500">*</span>
            </label>
            <Controller
              control={control}
              name="dob"
              rules={{ required: "Chọn ngày sinh" }}
              render={({ field }) => (
                <div className="relative w-full">
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    dateFormat="dd/MM/yyyy"
                    maxDate={maxDateValue}
                    locale="vi"
                    placeholderText="dd/mm/yyyy"
                    showYearDropdown
                    showMonthDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                    wrapperClassName="w-full"
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <CalendarIcon size={16} />
                  </div>
                </div>
              )}
            />
            {errors.dob && (
              <span className="text-xs text-red-500">
                {String(errors.dob.message)}
              </span>
            )}
          </div>
        </div>

        {/* Mật khẩu */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            {...register("password", {
              required: "Nhập mật khẩu",
              minLength: { value: 6, message: "Tối thiểu 6 ký tự" },
              setValueAs: (v) => v.trim(),
            })}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="••••••"
          />
          {errors.password && (
            <span className="text-xs text-red-500">
              {String(errors.password.message)}
            </span>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nhập lại mật khẩu <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Nhập lại mật khẩu",
              validate: (v) => v === password || "Mật khẩu không khớp",
              setValueAs: (v) => v.trim(),
            })}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="••••••"
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-500">
              {String(errors.confirmPassword.message)}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="terms"
              {...register("termsAccepted", {
                required: "Bạn vui lòng đồng ý với điều khoản sử dụng",
              })}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              Bằng việc Đăng ký, bạn đã đọc và đồng ý với{" "}
              <a href="#" className="font-medium text-cyan-600 hover:underline">
                Điều khoản sử dụng
              </a>{" "}
              và{" "}
              <a href="#" className="font-medium text-cyan-600 hover:underline">
                Chính sách bảo mật
              </a>{" "}
              của Cây Phượng Dine & Stay.
            </label>
          </div>
          {errors.termsAccepted && (
            <span className="mt-1 block text-xs text-red-500">
              {String(errors.termsAccepted.message)}
            </span>
          )}
        </div>

        <button
          disabled={loading}
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-2.5 font-bold text-white hover:bg-cyan-500"
        >
          {loading && <Loader2 size={18} className="animate-spin" />} Đăng ký
        </button>
      </form>

      <div className="text-center text-sm text-gray-600">
        Đã có tài khoản?{" "}
        <button
          onClick={() => switchView("LOGIN")}
          className="font-bold text-cyan-600 hover:underline"
        >
          Đăng nhập
        </button>
      </div>
    </div>
  );
};

const ForgotPasswordForm = () => {
  const { switchView } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { register, handleSubmit } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    setMsg(null);
    try {
      const responseMsg = await clientAuthService.forgotPassword({
        email: data.email,
      });
      setMsg({ type: "success", text: responseMsg });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gửi yêu cầu thất bại" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Quên mật khẩu</h2>
      </div>
      {msg && (
        <div
          className={`rounded-lg p-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
        >
          {msg.text}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email đăng ký <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            {...register("email", {
              required: "Vui lòng nhập email",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Email không hợp lệ",
              },
            })}
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="cayphuong@gmail.com"
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-2.5 font-bold text-white hover:bg-cyan-500"
        >
          {loading && <Loader2 size={18} className="animate-spin" />} Gửi yêu
          cầu
        </button>
      </form>
      <button
        onClick={() => switchView("LOGIN")}
        className="w-full text-center text-sm text-gray-500 hover:text-gray-800"
      >
        Quay lại đăng nhập
      </button>
    </div>
  );
};

export default AuthModal;
