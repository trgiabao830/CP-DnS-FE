import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../Modal";
import type { Category, CategoryRequest } from "../../../types/admin/categories";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryRequest) => Promise<void>;
  initialData?: Category | null;
}

const CategoryFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setName(initialData ? initialData.name : "");
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Tên danh mục không được để trống";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        name,
        status: initialData ? initialData.status : "AVAILABLE",
        displayOrder: initialData ? initialData.displayOrder : undefined,
      });

      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Cập nhật danh mục" : "Thêm danh mục mới"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tên danh mục <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            className={`w-full rounded-lg border px-3 py-2.5 outline-none transition-all focus:ring-2 ${
              errors.name
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Nhập tên danh mục..."
            autoFocus
          />

          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-gray-100 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}{" "}
            {initialData ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
