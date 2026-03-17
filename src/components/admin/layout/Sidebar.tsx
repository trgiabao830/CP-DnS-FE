import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ShoppingBag,
  Home,
  ChevronDown,
  ChevronRight,
  UserCog,
  User,
  Utensils,
  List,
  Map,
  Table,
  Building,
  Sparkles,
  Star,
  Grid,
  BedDouble,
  CalendarCheck,
  LayoutGrid,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../../../context/admin/AuthContext";

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const [isHovered, setIsHovered] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const isExpanded = isOpen || isHovered;

  const menuItems: MenuItem[] = [
    {
      name: "Thống kê doanh thu",
      icon: <BarChart3 size={20} />,
      path: "/admin",
    },
    {
      name: "Quản lý Người dùng",
      icon: <UserCog size={20} />,
      children: [
        {
          name: "Quản lý Nhân viên",
          path: "/admin/employees",
          icon: <UserCog size={18} />,
        },
        {
          name: "Quản lý Khách hàng",
          path: "/admin/users",
          icon: <User size={18} />,
        },
      ],
    },
    {
      name: "Quản lý Nhà hàng",
      icon: <Utensils size={20} />,
      children: [
        {
          name: "Tổng quan (POS)",
          path: "/admin/restaurant-pos",
          icon: <LayoutGrid size={18} />,
        },
        {
          name: "Đơn đặt bàn",
          path: "/admin/booking",
          icon: <CalendarCheck size={18} />,
        },
        {
          name: "Danh mục",
          path: "/admin/categories",
          icon: <List size={18} />,
        },
        { name: "Món ăn", path: "/admin/foods", icon: <Utensils size={18} /> },
        {
          name: "Khu vực (Tầng/Sảnh)",
          path: "/admin/areas",
          icon: <Map size={18} />,
        },
        { name: "Bàn ăn", path: "/admin/tables", icon: <Table size={18} /> },
      ],
    },
    {
      name: "Quản lý Homestay",
      icon: <Building size={20} />,
      children: [
        {
          name: "Tổng quan (POS)",
          path: "/admin/homestay-pos",
          icon: <LayoutGrid size={18} />,
        },
        {
          name: "Đơn đặt phòng",
          path: "/admin/homestay-booking",
          icon: <CalendarCheck size={18} />,
        },
        {
          name: "Tiện ích",
          path: "/admin/amenities",
          icon: <Sparkles size={18} />,
        },
        {
          name: "Hạng phòng",
          path: "/admin/room-classes",
          icon: <Star size={18} />,
        },
        {
          name: "Loại phòng",
          path: "/admin/room-types",
          icon: <Grid size={18} />,
        },
        {
          name: "Danh sách Phòng",
          path: "/admin/rooms",
          icon: <BedDouble size={18} />,
        },
      ],
    },
    {
      name: "Hỗ trợ Khách hàng",
      icon: <MessageSquare size={20} />,
      path: "/admin/support",
    },
    {
      name: "Quản lý Mã giảm giá",
      icon: <Sparkles size={20} />,
      path: "/admin/coupons",
    },
    {
      name: "Cài đặt",
      icon: <Settings size={20} />,
      path: "/admin/settings",
    },
  ];

  useEffect(() => {
    const activeIndex = menuItems.findIndex(
      (item) =>
        item.children &&
        item.children.some((child) => child.path === location.pathname),
    );
    if (activeIndex !== -1) {
      setOpenMenuIndex(activeIndex);
    }
  }, [location.pathname]);

  const toggleSubmenu = (index: number) => {
    if (isExpanded) {
      setOpenMenuIndex((prev) => (prev === index ? null : index));
    }
  };

  return (
    <aside
      onMouseEnter={() => !isOpen && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={` ${isExpanded ? "w-64" : "w-20"} sticky top-0 z-30 flex h-screen flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${!isOpen && isHovered ? "shadow-2xl" : ""}`}
    >
      <div className="flex h-16 flex-shrink-0 items-center justify-center border-b border-gray-100">
        <div className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            CP
          </div>
          <span
            className={`whitespace-nowrap transition-all duration-200 ${!isExpanded ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"}`}
          >
            Admin
          </span>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-6">
        {menuItems.map((item, index) => {
          const hasChildren = item.children && item.children.length > 0;

          const isParentActive = hasChildren
            ? item.children?.some((child) => child.path === location.pathname)
            : location.pathname === item.path;

          const isMenuOpen = openMenuIndex === index;

          if (hasChildren) {
            return (
              <div key={index}>
                <button
                  onClick={() => toggleSubmenu(index)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 ${isParentActive ? "bg-blue-50 font-medium text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"} `}
                  title={!isExpanded ? item.name : ""}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex-shrink-0 ${isParentActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`truncate transition-all duration-200 ${!isExpanded ? "w-0 opacity-0" : "w-auto opacity-100"}`}
                    >
                      {item.name}
                    </span>
                  </div>
                  {isExpanded && (
                    <span className="ml-2 flex-shrink-0 text-gray-400">
                      {isMenuOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                  )}
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded && isMenuOpen ? "mt-1 max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  {item.children?.map((child) => {
                    const isChildActive = location.pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        to={child.path || "#"}
                        className={`mx-0 mb-0.5 flex items-center rounded-lg py-2 pl-11 pr-4 text-sm transition-colors ${isChildActive ? "bg-blue-50 font-medium text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"} `}
                      >
                        <span className="mr-2 flex-shrink-0">{child.icon}</span>
                        <span className="truncate">{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={index}
              to={item.path || "#"}
              className={`group mb-1 flex items-center rounded-xl px-3 py-2.5 transition-all duration-200 ${
                isParentActive
                  ? "bg-blue-50 font-medium text-blue-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              } `}
              title={!isExpanded ? item.name : ""}
            >
              <span
                className={`flex-shrink-0 ${isParentActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
              >
                {item.icon}
              </span>
              <span
                className={`ml-3 truncate transition-all duration-200 ${!isExpanded ? "w-0 opacity-0" : "w-auto opacity-100"}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
