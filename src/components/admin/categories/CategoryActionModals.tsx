import React, { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Modal from '../../Modal';
import type { Category } from '../../../types/admin/categories';

export { SuccessModal, ErrorModal, DeleteConfirmModal } from '../common/ActionModals';

export const StatusConfirmModal = ({ 
  category, isOpen, onClose, onConfirm 
}: { 
  category: Category | null, isOpen: boolean, onClose: () => void, onConfirm: () => Promise<void> 
}) => {
  const [loading, setLoading] = useState(false);
  if (!category) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  const isAvailable = category.status === 'AVAILABLE';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi trạng thái" size="md">
      <div className="p-6 text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isAvailable ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
           {isAvailable ? <EyeOff size={28} /> : <Eye size={28} />}
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-800">{isAvailable ? "Ẩn danh mục này?" : "Hiển thị danh mục này?"}</h3>
        <p className="mb-6 text-sm text-gray-500">Bạn có chắc muốn {isAvailable ? "ẩn" : "hiển thị"} danh mục <strong>{category.name}</strong>?</p>
        <div className="flex justify-center gap-3">
           <button onClick={onClose} className="rounded-lg bg-gray-100 px-5 py-2.5">Hủy bỏ</button>
           <button onClick={handleConfirm} disabled={loading} className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-white ${isAvailable ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {loading && <Loader2 size={18} className="animate-spin" />} Đồng ý
           </button>
        </div>
      </div>
    </Modal>
  );
};