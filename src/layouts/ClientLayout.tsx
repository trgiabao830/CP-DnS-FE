import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  User, MapPin, Phone, Mail, Facebook, Instagram, Menu,
  X, LogOut, ChevronDown, Calendar, Home,
} from "lucide-react";
import { useAuthModal, AuthModalProvider } from "../context/client/AuthModalContext";
import AuthModal from "../components/client/auth/AuthModal";

import { ClientAuthProvider, useClientAuth } from "../context/client/ClientAuthContext";
import ChatWidget from "../components/client/chat/ChatWidget";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const { openModal } = useAuthModal();
  
  const { user, logout } = useClientAuth(); 

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const getLinkClass = (path: string) => {
    const baseClass = "text-sm font-bold uppercase transition-colors whitespace-nowrap";
    const activeClass = "text-cyan-500 hover:text-cyan-600";
    const inactiveClass = "text-gray-600 hover:text-gray-900";
    return location.pathname === path ? `${baseClass} ${activeClass}` : `${baseClass} ${inactiveClass}`;
  };

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white py-2 shadow-md" : "bg-white/95 py-2"}`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center justify-start">
             <Link to="/" className="flex shrink-0 items-center gap-2">
               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 p-1.5">
                 <img src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768500097/logo_bjmcpm.png" alt="Logo" className="h-full w-full object-contain" />
               </div>
               <span className="hidden truncate text-xl font-bold uppercase tracking-wide text-gray-800 sm:block">
                 Cây Phượng <span className="text-cyan-500">Dine & Stay</span>
               </span>
             </Link>
          </div>
          <div className="hidden items-center justify-center gap-8 lg:flex">
            <Link to="/restaurant" className={getLinkClass("/restaurant")}>Nhà hàng</Link>
            <Link to="/" className={getLinkClass("/")}>Trang chủ</Link>
            <Link to="/homestay" className={getLinkClass("/homestay")}>Homestay</Link>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
            <div className="hidden lg:block">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 transition-colors hover:bg-gray-50 focus:outline-none">
                    <span className="max-w-[120px] truncate text-sm font-semibold text-gray-700">{user.name || user.fullName || "User"}</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>
                  {isUserDropdownOpen && (
                    <div className="animate-in fade-in zoom-in-95 absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-100 bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 duration-200 focus:outline-none">
                      <div className="border-b border-gray-100 px-4 py-2">
                        <p className="truncate text-sm font-medium text-gray-900">{user.name || user.fullName}</p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cyan-600"><User size={16} /> Thông tin cá nhân</Link>
                        <Link to="/restaurant/booking-history" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cyan-600"><Calendar size={16} /> Lịch sử đặt bàn</Link>
                        <Link to="/homestay/booking-history" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cyan-600"><Home size={16} /> Lịch sử Homestay</Link>
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"><LogOut size={16} /> Đăng xuất</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => openModal("LOGIN")} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-cyan-600"><User size={18} /> Đăng nhập</button>
              )}
            </div>
            <button className="text-gray-600 lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="absolute left-0 top-full flex w-full flex-col gap-4 border-t bg-white p-4 shadow-lg lg:hidden">
           {/* ... Links ... */}
           <Link to="/restaurant" onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-bold uppercase ${location.pathname === "/restaurant" ? "text-cyan-500" : "text-gray-600"}`}>Nhà hàng</Link>
           <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-bold uppercase ${location.pathname === "/" ? "text-cyan-500" : "text-gray-600"}`}>Trang chủ</Link>
           <Link to="/homestay" onClick={() => setIsMobileMenuOpen(false)} className={`text-sm font-bold uppercase ${location.pathname === "/homestay" ? "text-cyan-500" : "text-gray-600"}`}>Homestay</Link>
           <hr className="border-gray-100" />
           {user ? (
             <div className="space-y-3">
               <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                 <div className="overflow-hidden"><p className="truncate text-sm font-bold text-gray-800">{user.name || user.fullName}</p><p className="truncate text-xs text-gray-500">{user.email}</p></div>
               </div>
               <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600"><User size={18} /> Thông tin cá nhân</Link>
               <Link to="/restaurant/booking-history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600"><Calendar size={18} /> Lịch sử đặt bàn</Link>
               <Link to="/homestay/booking-history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600"><Home size={18} /> Lịch sử Homestay</Link>
               <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600"><LogOut size={18} /> Đăng xuất</button>
             </div>
           ) : (
             <button onClick={() => { setIsMobileMenuOpen(false); openModal("LOGIN"); }} className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"><User size={18} /> Đăng nhập</button>
           )}
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#1a1f2c] pb-8 pt-16 text-gray-400">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400 p-1"><img src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768500097/logo_bjmcpm.png" alt="Logo" className="h-full w-full object-contain" /></div>
              <span className="text-lg font-bold uppercase text-white">Cây Phượng Dine & Stay</span>
            </div>
            <p className="text-sm">Cây Phượng Dine & Stay - Nơi ẩm thực và nghỉ dưỡng hòa quyện.</p>
            <div className="flex gap-4 pt-2"><a href="#" className="hover:text-white"><Facebook size={20} /></a><a href="#" className="hover:text-white"><Instagram size={20} /></a></div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase text-white">Liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3"><Mail size={16} className="mt-0.5 shrink-0" /><span>cayphuongdineandstay@gmail.com</span></li>
              <li className="flex items-start gap-3"><Phone size={16} className="mt-0.5 shrink-0" /><span>0564567890</span></li>
              <li className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0" /><span>123 Nguyễn Huệ, Quận 1, TP.HCM</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase text-white">Điều khoản & Chính sách</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="transition-colors hover:text-white">Điều khoản sử dụng</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Quy chế hoạt động</a></li>
              <li><a href="#" className="transition-colors hover:text-white">Các câu hỏi thường gặp</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-xs text-gray-600">© 2025 Cây Phượng Dine & Stay. All rights reserved.</div>
      </div>
    </footer>
  );
};

const ClientLayoutContent = () => {
  const { openModal } = useAuthModal();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      openModal("LOGIN");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("login");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, openModal]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-gray-800">
      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
      <ChatWidget />
    </div>
  );
};

const ClientLayout = () => {
  return (
    <ClientAuthProvider>
      <AuthModalProvider>
        <ClientLayoutContent />
      </AuthModalProvider>
    </ClientAuthProvider>
  );
};

export default ClientLayout;