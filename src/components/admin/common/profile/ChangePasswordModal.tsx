import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Eye } from 'lucide-react';
import Modal from '../../../Modal';
import { profileService } from '../../../../services/admin/profile.service';
import type { ChangePasswordRequest } from '../../../../types/admin/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<ChangePasswordRequest>({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [visibleField, setVisibleField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      setVisibleField(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: FormErrors = {};
    if (!formData.oldPassword) newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại.";
    
    if (!formData.newPassword) newErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    else if (formData.newPassword.length < 6) newErrors.newPassword = "Mật khẩu mới phải từ 6 ký tự trở lên.";
    
    if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setLoading(true);
    try {
      await profileService.changePassword(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.message || "Có lỗi xảy ra";
      if (message.toLowerCase().includes("mật khẩu cũ")) {
          setErrors({ oldPassword: message });
      } else {
          setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ChangePasswordRequest, val: string) => {
      setFormData(prev => ({...prev, [field]: val}));
      if (errors[field as keyof FormErrors]) {
          setErrors(prev => ({ ...prev, [field]: undefined }));
      }
      if (errors.general) setErrors(prev => ({ ...prev, general: undefined }));
  }

  const renderPasswordField = (
    label: string, 
    fieldName: keyof ChangePasswordRequest, 
    placeholder: string = ""
  ) => {
    const isVisible = visibleField === fieldName;
    const hasError = !!errors[fieldName as keyof FormErrors];

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative group">
          <input 
            type={isVisible ? "text" : "password"} 
            value={formData[fieldName]} 
            onChange={e => handleChange(fieldName, e.target.value)} 
            className={`w-full pl-3 pr-10 py-2.5 border rounded-lg outline-none transition-all ${
              hasError 
                ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
            }`}
            placeholder={placeholder}
          />
          
          <button
            type="button"
            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer select-none"
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
        
        {errors[fieldName as keyof FormErrors] && (
          <p className="text-red-500 text-xs mt-1">{errors[fieldName as keyof FormErrors]}</p>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {errors.general && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                <AlertTriangle size={18} /> {errors.general}
            </div>
        )}
        
        {renderPasswordField("Mật khẩu hiện tại", "oldPassword")}
        {renderPasswordField("Mật khẩu mới", "newPassword", "Tối thiểu 6 ký tự")}
        {renderPasswordField("Xác nhận mật khẩu", "confirmPassword")}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
           <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">Hủy</button>
           <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-70">
             {loading && <Loader2 size={16} className="animate-spin" />} Cập nhật
           </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;