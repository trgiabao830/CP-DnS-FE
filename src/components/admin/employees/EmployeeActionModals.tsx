import React, { useState, useEffect } from "react";
import {
  Loader2,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
} from "lucide-react";
import Modal from "../../Modal";
import type { Employee } from "../../../types/admin/employees";
import { employeeService } from "../../../services/admin/employee.service";

export {
  SuccessModal,
  ErrorModal,
  DeleteConfirmModal,
} from "../common/ActionModals";

export const EmployeeDetailModal = ({
  employee,
  onClose,
}: {
  employee: Employee | null;
  onClose: () => void;
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Modal isOpen={!!employee} onClose={onClose} title="Thông tin nhân viên">
      {employee && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b pb-6">
            <div>
              <h3 className="text-xl font-bold">{employee.fullName}</h3>
              <p className="text-gray-500">{employee.jobTitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">
                Tài khoản
              </label>
              <p className="font-medium text-gray-900">{employee.username}</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">
                SĐT
              </label>
              <p className="font-medium text-gray-900">{employee.phone}</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">
                Ngày tạo
              </label>
              <p className="font-medium text-gray-900">
                {formatDate(employee.createdAt)}
              </p>
            </div>

            <div className="col-span-2 mt-2 border-t pt-4">
              <label className="mb-2 flex gap-2 text-xs font-bold uppercase text-gray-400">
                Quyền hạn
              </label>
              <div className="flex flex-wrap gap-2">
                {employee.permissions && employee.permissions.length > 0 ? (
                  employee.permissions.map((p) => (
                    <span
                      key={p.permissionId}
                      className="rounded border bg-gray-100 px-2 py-1 text-xs text-gray-700"
                      title={p.code}
                    >
                      {p.description}
                    </span>
                  ))
                ) : (
                  <span className="text-sm italic text-gray-400">
                    Chưa được cấp quyền
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export const StatusConfirmModal = ({
  employee,
  isOpen,
  onClose,
  onSuccess,
}: {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!employee) return;
    const newStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setLoading(true);
    try {
      await employeeService.updateStatus(employee.empId, newStatus);
      onSuccess(
        `Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "khóa"} tài khoản thành công!`,
      );
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  const isActive = employee.status === "ACTIVE";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận đổi trạng thái"
      size="md"
    >
      <div className="p-4 text-center">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            isActive
              ? "bg-orange-100 text-orange-600"
              : "bg-green-100 text-green-600"
          }`}
        >
          {isActive ? <Lock size={24} /> : <Unlock size={24} />}
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-800">
          {isActive ? "Khóa tài khoản?" : "Kích hoạt tài khoản?"}
        </h3>
        <p className="mb-6 text-sm text-gray-500">
          Bạn có chắc muốn {isActive ? "KHÓA" : "KÍCH HOẠT"} tài khoản{" "}
          <strong>{employee.username}</strong> không?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white ${
              isActive
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isActive ? "Khóa ngay" : "Kích hoạt"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const ResetPasswordModal = ({
  empId,
  isOpen,
  onClose,
  onSuccess,
}: {
  empId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [data, setData] = useState({ newPassword: "", confirmPassword: "" });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [visibleField, setVisibleField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setData({ newPassword: "", confirmPassword: "" });
      setErrors({});
      setVisibleField(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!data.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (data.newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải từ 6 ký tự trở lên.";
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (data.newPassword !== data.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (!empId) return;

    setLoading(true);
    try {
      await employeeService.resetPassword(empId, data);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (
    label: string,
    fieldName: "newPassword" | "confirmPassword",
    placeholder: string,
  ) => {
    const isVisible = visibleField === fieldName;
    const fieldError = errors[fieldName];

    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="group relative">
          <input
            type={isVisible ? "text" : "password"}
            value={data[fieldName]}
            onChange={(e) => {
              setData({ ...data, [fieldName]: e.target.value });
              if (errors[fieldName]) {
                setErrors((prev) => ({ ...prev, [fieldName]: "" }));
              }
            }}
            className={`w-full rounded-lg border px-3 py-2 pl-3 pr-10 outline-none transition-all focus:ring-2 ${
              fieldError
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="absolute right-2 top-2 cursor-pointer select-none rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Nhấn giữ để hiện mật khẩu"
            onMouseDown={() => setVisibleField(fieldName)}
            onMouseUp={() => setVisibleField(null)}
            onMouseLeave={() => setVisibleField(null)}
            onTouchStart={() => setVisibleField(fieldName)}
            onTouchEnd={() => setVisibleField(null)}
          >
            <Eye size={18} className={isVisible ? "text-blue-600" : ""} />
          </button>
        </div>

        {/* 👇 Hiển thị lỗi ngay bên dưới input */}
        {fieldError && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
            <AlertTriangle size={12} /> {fieldError}
          </p>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đặt lại mật khẩu" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lỗi chung từ Backend (nếu có) */}
        {errors.general && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {renderPasswordField(
          "Mật khẩu mới",
          "newPassword",
          "Nhập mật khẩu mới",
        )}
        {renderPasswordField(
          "Xác nhận mật khẩu",
          "confirmPassword",
          "Nhập lại mật khẩu",
        )}

        <div className="mt-2 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600 disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Lưu mật khẩu
          </button>
        </div>
      </form>
    </Modal>
  );
};
