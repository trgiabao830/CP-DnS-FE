import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { userService } from "../../../services/client/user.service";
import type { ChangePasswordRequest } from "../../../types/client/user";
import { SuccessModal, ErrorModal } from "../../admin/common/ActionModals";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({
    old: false, newPass: false, confirm: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ChangePasswordRequest>();

  const toggleShow = (field: string) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const onSubmit = async (data: ChangePasswordRequest) => {
    setIsSubmitting(true);
    setMsgError("");
    try {
      const message = await userService.changePassword(data);
      setMsgSuccess(message);
      reset(); 
    } catch (error: any) {
      setMsgError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Đổi mật khẩu
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            
            {/* Mật khẩu cũ */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showPassword.old ? "text" : "password"}
                  {...register("oldPassword", { required: "Vui lòng nhập mật khẩu cũ" })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                  placeholder="••••••"
                />
                <button type="button" onClick={() => toggleShow('old')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.oldPassword && <p className="text-xs text-red-500">{errors.oldPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showPassword.newPass ? "text" : "password"}
                  {...register("newPassword", { 
                    required: "Vui lòng nhập mật khẩu mới",
                    minLength: { value: 6, message: "Mật khẩu phải từ 6 ký tự" }
                  })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                  placeholder="••••••"
                />
                <button type="button" onClick={() => toggleShow('newPass')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword.newPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  {...register("confirmPassword", { 
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (val) => {
                      if (watch('newPassword') != val) {
                        return "Mật khẩu xác nhận không khớp";
                      }
                    }
                  })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                  placeholder="••••••"
                />
                <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-100 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Thông báo kết quả */}
      <SuccessModal message={msgSuccess} onClose={() => { setMsgSuccess(""); onClose(); }} />
      <ErrorModal message={msgError} onClose={() => setMsgError("")} />
    </>
  );
};

export default ChangePasswordModal;