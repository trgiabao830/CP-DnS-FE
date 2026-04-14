import React, { useEffect, useState } from "react";
import { Loader2, Search, Check, FileSearch, X } from "lucide-react";
import Modal from "../../Modal";
import { employeeService } from "../../../services/admin/employee.service";
import type {
  Employee,
  Permission,
  EmployeeRequest,
} from "../../../types/admin/employees";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: Employee | null;
}

const EmployeeFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoadingPerms, setIsLoadingPerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<EmployeeRequest>({
    username: "",
    fullName: "",
    phone: "",
    jobTitle: "",
    password: "",
    confirmPassword: "",
    permissionIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [permSearch, setPermSearch] = useState("");
  const [debouncedPermSearch, setDebouncedPermSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPermSearch(permSearch), 300);
    return () => clearTimeout(timer);
  }, [permSearch]);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingPerms(true);
      employeeService
        .getPermissions()
        .then(setPermissions)
        .catch(console.error)
        .finally(() => setIsLoadingPerms(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && employeeToEdit && permissions.length > 0) {
      let currentPermIds: number[] = [];

      if (
        Array.isArray(employeeToEdit.permissions) &&
        employeeToEdit.permissions.length > 0
      ) {
        const firstPerm = employeeToEdit.permissions[0];

        if (
          typeof firstPerm === "object" &&
          firstPerm !== null &&
          "id" in firstPerm
        ) {
          currentPermIds = (employeeToEdit.permissions as any[]).map(
            (p: any) => p.id,
          );
        } else {
          currentPermIds = permissions
            .filter((p) => (employeeToEdit.permissions as any).includes(p.code))
            .map((p) => p.permissionId);
        }
      }

      setFormData({
        username: employeeToEdit.username,
        fullName: employeeToEdit.fullName,
        phone: employeeToEdit.phone,
        jobTitle: employeeToEdit.jobTitle,
        permissionIds: currentPermIds,
        password: "",
        confirmPassword: "",
      });
    }
    setErrors({});
    setPermSearch("");
    setDebouncedPermSearch("");
  }, [isOpen, employeeToEdit, permissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = "Tài khoản bắt buộc.";
    if (!formData.fullName.trim()) newErrors.fullName = "Họ tên bắt buộc.";
    if (!formData.phone.trim()) newErrors.phone = "SĐT bắt buộc.";
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Chức vụ bắt buộc.";
    if (!employeeToEdit) {
      if (!formData.password || formData.password.length < 6)
        newErrors.password = "Mật khẩu từ 6 ký tự.";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Mật khẩu không khớp.";
    }
    if (formData.permissionIds.length === 0)
      newErrors.permissions = "Chọn ít nhất 1 quyền.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      if (employeeToEdit) {
        await employeeService.update(employeeToEdit.empId, formData);
      } else {
        await employeeService.create(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (id: number) => {
    setFormData((prev) => {
      const ids = prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((x) => x !== id)
        : [...prev.permissionIds, id];
      return { ...prev, permissionIds: ids };
    });
  };

  const filteredPerms = permissions.filter(
    (p) =>
      p.description.toLowerCase().includes(debouncedPermSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(debouncedPermSearch.toLowerCase()),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="relative mb-6 flex flex-col md:block">
          <div className="w-full space-y-4 md:w-1/2 md:pr-4">
            <h4 className="border-b pb-2 font-semibold text-gray-700">
              Thông tin tài khoản
            </h4>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                disabled={!!employeeToEdit}
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                SĐT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Chức vụ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
              {errors.jobTitle && (
                <p className="mt-1 text-xs text-red-500">{errors.jobTitle}</p>
              )}
            </div>

            {!employeeToEdit && (
              <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="text-xs font-bold uppercase text-blue-700">
                  Mật khẩu khởi tạo
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Mật khẩu"
                  className="w-full rounded border px-3 py-2"
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Xác nhận mật khẩu"
                  className="w-full rounded border px-3 py-2"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex w-full flex-col md:absolute md:bottom-0 md:right-0 md:top-0 md:mt-0 md:w-1/2 md:pl-4">
            <h4 className="mb-3 flex justify-between border-b pb-2 font-semibold text-gray-700">
              Phân quyền{" "}
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                {formData.permissionIds.length}
              </span>
            </h4>

            <div className="relative mb-3 flex-shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Tìm quyền..."
                className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-9 outline-none focus:ring-2 focus:ring-blue-500"
              />

              {permSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setPermSearch("");
                    setDebouncedPermSearch("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {errors.permissions && (
              <p className="mb-2 text-xs text-red-500">{errors.permissions}</p>
            )}

            <div className="flex-1 overflow-y-auto rounded-lg border bg-gray-50 p-2">
              {isLoadingPerms ? (
                <div className="p-4 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </div>
              ) : filteredPerms.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center p-4 text-gray-400">
                  <p className="text-center text-sm">
                    Không tìm thấy quyền nào phù hợp với "{debouncedPermSearch}"
                  </p>
                </div>
              ) : (
                filteredPerms.map((p) => (
                  <div
                    key={p.permissionId}
                    onClick={() => togglePermission(p.permissionId)}
                    className={`mb-2 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${formData.permissionIds.includes(p.permissionId) ? "border-blue-500 bg-white shadow-sm ring-1 ring-blue-500" : "border-gray-200 bg-white hover:border-blue-300"}`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${formData.permissionIds.includes(p.permissionId) ? "border-blue-600 bg-blue-600" : "bg-gray-50"}`}
                    >
                      {formData.permissionIds.includes(p.permissionId) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${formData.permissionIds.includes(p.permissionId) ? "text-blue-700" : "text-gray-700"}`}
                      >
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}{" "}
            {employeeToEdit ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;
