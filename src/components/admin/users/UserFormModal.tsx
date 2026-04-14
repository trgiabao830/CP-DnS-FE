import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Modal from "../../Modal";
import { userService } from "../../../services/admin/user.service";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "../../../types/admin/users";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";
import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";

registerLocale("vi", vi);

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}) => {
  const isEdit = !!userToEdit;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserRequest>();

  useEffect(() => {
    if (isOpen) {
      if (isEdit && userToEdit) {
        reset({
          fullName: userToEdit.fullName,
          email: userToEdit.email,
          phone: userToEdit.phone,
          gender: userToEdit.gender,
          dob: userToEdit.dob,
        });
      } else {
        reset({
          fullName: "",
          email: "",
          phone: "",
          gender: "",
          dob: "",
          password: "",
          confirmPassword: "",
        });
      }
    }
  }, [isOpen, isEdit, userToEdit, reset]);

  const onSubmit = async (data: CreateUserRequest) => {
    try {
      if (isEdit && userToEdit) {
        const updateData: UpdateUserRequest = {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          dob: data.dob,
        };
        await userService.update(userToEdit.userId, updateData);
      } else {
        await userService.create(data);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Cập nhật người dùng" : "Thêm người dùng mới"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              {...register("fullName", { required: "Vui lòng nhập họ tên" })}
              className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1"
            />
            {errors.fullName && (
              <span className="text-xs text-red-500">
                {errors.fullName.message}
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Ngày sinh <span className="text-red-500">*</span>
            </label>
            <Controller
              control={control}
              name="dob"
              rules={{ required: "Vui lòng chọn ngày sinh" }}
              render={({ field }) => {
                const selectedDate = field.value ? parseISO(field.value) : null;

                return (
                  <div className="relative">
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date: Date | null) => {
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      dateFormat="dd/MM/yyyy"
                      locale="vi"
                      maxDate={new Date()}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      placeholderText="DD/MM/YYYY"
                      className="w-full rounded-lg border p-2 pl-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                      wrapperClassName="w-full"
                    />
                    <Calendar
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                );
              }}
            />
            {errors.dob && (
              <span className="text-xs text-red-500">{errors.dob.message}</span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register("email", { required: "Vui lòng nhập email" })}
              className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1"
            />
            {errors.email && (
              <span className="text-xs text-red-500">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              {...register("phone", { required: "Vui lòng nhập SĐT" })}
              className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1"
            />
            {errors.phone && (
              <span className="text-xs text-red-500">
                {errors.phone.message}
              </span>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Giới tính <span className="text-red-500">*</span>
            </label>
            <select
              {...register("gender", { required: "Vui lòng chọn giới tính" })}
              className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1"
            >
              <option value="">Chọn giới tính</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
            {errors.gender && (
              <span className="text-xs text-red-500">
                {errors.gender.message}
              </span>
            )}
          </div>

          {/* 👇 GỘP MẬT KHẨU VÀ XÁC NHẬN MẬT KHẨU VÀO CÙNG 1 DÒNG */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu",
                  })}
                  className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                />
                {errors.password && (
                  <span className="text-xs text-red-500">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...register("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu",
                  })}
                  className="w-full rounded-lg border p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                />
                {errors.confirmPassword && (
                  <span className="text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
