import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut, Lock, ChevronDown, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../context/admin/AuthContext';
import UserProfileModal from '../common/profile/UserProfileModal';
import ChangePasswordModal from '../common/profile/ChangePasswordModal';
import Modal from '../../Modal';
interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex w-full bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 items-center justify-between px-6 shadow-sm">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Menu size={20} />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pr-2 rounded-full border border-transparent hover:border-gray-200 transition-all select-none">
                <div className="hidden md:flex flex-col items-start mr-1">
                    <span className="text-sm font-semibold text-gray-700 leading-none">{user?.name}</span>
                    <span className="text-[11px] text-gray-400 mt-1 uppercase tracking-wide font-medium">{user?.role}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button onClick={() => { setShowProfile(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"><User size={16} /> Hồ sơ cá nhân</button>
                    <button onClick={() => { setShowChangePass(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"><Lock size={16} /> Đổi mật khẩu</button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"><LogOut size={16} /> Đăng xuất</button>
                </div>
            )}
          </div>
        </div>
      </header>

      {/* Các Modal đã được tách riêng */}
      <UserProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      
      <ChangePasswordModal 
        isOpen={showChangePass} 
        onClose={() => setShowChangePass(false)} 
        onSuccess={() => setSuccessMsg("Đổi mật khẩu thành công!")} 
      />

      {/* Modal thông báo đơn giản */}
      <Modal isOpen={!!successMsg} onClose={() => setSuccessMsg('')} title="" size="md">
        <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Thành công!</h3>
            <p className="text-gray-500 mb-6">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Đóng</button>
        </div>
      </Modal>
    </>
  );
};

export default Header;