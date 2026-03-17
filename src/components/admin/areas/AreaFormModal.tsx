import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../Modal";
import type { RestaurantArea, RestaurantAreaRequest } from "../../../types/admin/area";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RestaurantAreaRequest) => Promise<void>;
  initialData?: RestaurantArea | null;
}

const AreaFormModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<RestaurantAreaRequest>({
    name: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      if (initialData) {
        setFormData({ name: initialData.name });
      } else {
        setFormData({ name: "" });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Tên khu vực không được để trống");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? "Cập nhật khu vực" : "Thêm khu vực mới"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Tên khu vực <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
                setFormData({ name: e.target.value });
                if(error) setError("");
            }}
            className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
              error ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
            }`}
            placeholder="VD: Tầng 1, Sân vườn..."
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {initialData ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AreaFormModal;