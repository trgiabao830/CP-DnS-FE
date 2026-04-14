import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../Modal";
import type { AmenityRequest, HomestayAmenity } from "../../../types/admin/amenity";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AmenityRequest) => Promise<void>;
  initialData?: HomestayAmenity | null;
}

const AmenityFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialData ? initialData.name : "");
      setStatus(initialData ? initialData.status : "ACTIVE");
      setErrorMsg("");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg("Tên tiện ích không được để trống");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await onSubmit({ name, status });
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
      title={initialData ? "Cập nhật tiện ích" : "Thêm tiện ích mới"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tên tiện ích <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            className={`w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 ${errorMsg ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"}`}
            placeholder="VD: Wifi, Hồ bơi, BBQ..."
            autoFocus
          />
          {errorMsg && <p className="mt-1 text-xs text-red-500">{errorMsg}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {initialData ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AmenityFormModal;
