import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Edit2,
  Loader2,
} from "lucide-react";
import { userService } from "../../services/client/user.service";
import { clientAuthService } from "../../services/client/auth.service";
import type {
  UserProfileResponse,
  UpdateUserRequest,
} from "../../types/client/user";
import ChangePasswordModal from "../../components/client/profile/ChangePasswordModal";
import {
  SuccessModal,
  ErrorModal,
} from "../../components/admin/common/ActionModals";
import { useAuthModal } from "../../context/client/AuthModalContext";
import { useNavigate } from "react-router-dom";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";
import { format, parseISO } from "date-fns";

registerLocale("vi", vi);

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<UpdateUserRequest>();

  const navigate = useNavigate();
  const { openModal } = useAuthModal();

  const formatDateDisplay = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await userService.getMyProfile();
      setProfile(data);
      reset({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        gender: data.gender || "OTHER",
      });
    } catch (error) {
      console.error(error);
      localStorage.removeItem("clientUser");
      openModal("LOGIN");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitUpdate = async (data: UpdateUserRequest) => {
    setIsSaving(true);
    try {
      let formattedDob = data.dob;
      if (data.dob && data.dob instanceof Date) {
        formattedDob = format(data.dob, "yyyy-MM-dd");
      }

      const payload = { ...data, dob: formattedDob };

      await userService.updateProfile(payload);

      setActionSuccess(
        "Cập nhật thông tin thành công. Vui lòng đăng nhập lại để áp dụng thay đổi.",
      );
    } catch (error: any) {
      setActionError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccess = async () => {
    setActionSuccess("");

    try {
      await clientAuthService.logout();
    } catch (error) {
      console.error("Lỗi khi gọi API logout:", error);
    } finally {
      localStorage.removeItem("clientUser");

      window.location.href = "/?login=true";
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      reset({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender || "OTHER",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="container mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  Thông tin cá nhân
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-lg bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-600 transition-colors hover:bg-cyan-100"
                  >
                    Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmit(onSubmitUpdate)}
                      disabled={isSaving}
                      className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-600 disabled:opacity-70"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>Lưu</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <form className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={!isEditing}
                        {...register("fullName", {
                          required: "Vui lòng nhập họ tên",
                        })}
                        className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all ${isEditing ? "border-gray-300 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" : "cursor-not-allowed border-transparent bg-gray-50 text-gray-600"}`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Giới tính
                    </label>
                    <div className="relative">
                      <select
                        disabled={!isEditing}
                        {...register("gender")}
                        className={`w-full appearance-none rounded-xl border px-4 py-2.5 outline-none transition-all ${isEditing ? "border-gray-300 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" : "cursor-not-allowed border-transparent bg-gray-50 text-gray-600"}`}
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled={!isEditing}
                        {...register("email", {
                          required: "Vui lòng nhập email",
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Email không hợp lệ",
                          },
                        })}
                        className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all ${isEditing ? "border-gray-300 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" : "cursor-not-allowed border-transparent bg-gray-50 text-gray-600"}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        disabled={!isEditing}
                        {...register("phone", {
                          required: "Vui lòng nhập số điện thoại",
                          pattern: {
                            value: /^(84|0[3|5|7|8|9])([0-9]{8})$/,
                            message: "Số điện thoại không hợp lệ",
                          },
                        })}
                        className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all ${isEditing ? "border-gray-300 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" : "cursor-not-allowed border-transparent bg-gray-50 text-gray-600"}`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Ngày sinh */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Ngày sinh
                    </label>
                    <div className="relative">
                      {isEditing ? (
                        <Controller
                          control={control}
                          name="dob"
                          render={({ field }) => {
                            let selectedDate = field.value
                              ? parseISO(field.value.toString())
                              : null;
                            return (
                              <DatePicker
                                selected={selectedDate}
                                onChange={(date) => {
                                  const formatted = date
                                    ? format(date, "yyyy-MM-dd")
                                    : null;
                                  field.onChange(formatted);
                                }}
                                dateFormat="dd/MM/yyyy"
                                locale="vi"
                                placeholderText="Chọn ngày sinh"
                                wrapperClassName="w-full"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                maxDate={new Date()}
                              />
                            );
                          }}
                        />
                      ) : (
                        <div className="w-full cursor-not-allowed rounded-xl border border-transparent bg-gray-50 px-4 py-2.5 text-gray-600">
                          {formatDateDisplay(watch("dob")) || "Chưa cập nhật"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 px-2 text-sm font-bold uppercase text-gray-400">
                Bảo mật
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="group flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-bold text-gray-700 group-hover:text-cyan-600">
                      Đổi mật khẩu
                    </p>
                    <p className="text-xs text-gray-400">
                      Bảo vệ tài khoản của bạn
                    </p>
                  </div>
                </div>
                <Edit2
                  size={16}
                  className="text-gray-300 group-hover:text-cyan-500"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* 👇 SỬA Ở ĐÂY: Truyền handleCloseSuccess vào onClose */}
      <SuccessModal message={actionSuccess} onClose={handleCloseSuccess} />

      <ErrorModal message={actionError} onClose={() => setActionError("")} />
    </div>
  );
};

export default ProfilePage;
