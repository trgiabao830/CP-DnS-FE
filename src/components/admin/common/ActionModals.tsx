import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import Modal from '../../Modal';

export const SuccessModal = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <Modal isOpen={!!message} onClose={onClose} title="" size="md">
    <div className="p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle size={32} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-800">Thành công!</h3>
      <p className="mb-6 text-gray-500">{message}</p>
      <button 
        onClick={onClose} 
        className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
      >
        Đóng
      </button>
    </div>
  </Modal>
);

export const ErrorModal = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <Modal isOpen={!!message} onClose={onClose} title="" size="md">
    <div className="p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <XCircle size={32} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-800">Đã có lỗi xảy ra!</h3>
      <p className="mb-6 text-gray-500">{message}</p>
      <button 
        onClick={onClose} 
        className="rounded-lg bg-gray-200 px-6 py-2 text-gray-800 hover:bg-gray-300"
      >
        Đóng
      </button>
    </div>
  </Modal>
);

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
}

export const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận xóa", 
  message = "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?" 
}: DeleteConfirmModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận" size="md">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={28} />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-800">{title}</h3>
        <p className="mb-6 text-sm text-gray-500">{message}</p>
        
        <div className="flex justify-center gap-3">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="rounded-lg bg-gray-100 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={loading} 
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />} Xóa ngay
          </button>
        </div>
      </div>
    </Modal>
  );
};