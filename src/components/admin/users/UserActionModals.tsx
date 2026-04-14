import React, { useState } from "react";
import { Lock, Unlock, Loader2 } from "lucide-react";
import Modal from "../../Modal";
import { userService } from "../../../services/admin/user.service";
import type { User } from "../../../types/admin/users";

export const UserStatusConfirmModal = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}: {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await userService.toggleStatus(user.userId);
      const newStatus = user.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
      onSuccess(
        `Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "khóa"} tài khoản thành công!`,
      );
      onClose();
    } catch (e: any) {
      alert(e.message || "Lỗi khi đổi trạng thái");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isActive = user.status === "ACTIVE";

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
          <strong>{user.email}</strong> không?
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