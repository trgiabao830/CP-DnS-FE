import React from 'react';
import Modal from '../../Modal';
import { ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionDeniedModal: React.FC<Props> = ({ isOpen, onClose }) => {
  return (
<Modal isOpen={isOpen} onClose={onClose} title="" size="md">
  <div className="p-6 text-center">
    {/* Đổi h-14 w-14 thành h-16 w-16 cho đồng bộ */}
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
      <ShieldAlert size={32} />
    </div>
    
    <h3 className="mb-2 text-xl font-bold text-gray-800">Truy cập bị từ chối!</h3>
    
    {/* Bỏ text-sm để font chữ to bằng modal Error */}
    <p className="mb-6 text-gray-500">
      Bạn không có quyền thực hiện hành động này.<br/>
      Vui lòng liên hệ quản trị viên.
    </p>
    
    {/* Bỏ w-full, tăng px-6 để nút gọn gàng giống modal Error */}
    <button 
      onClick={onClose} 
      className="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700"
    >
      Đóng
    </button>
  </div>
</Modal>
  );
};