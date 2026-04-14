import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin/layout/Sidebar";
import Header from "../components/admin/layout/Header";
import { useAuth } from "../context/admin/AuthContext";
import { RefreshCw } from "lucide-react";

const API_BASE_URL = "/api/admin/auth";

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const { user, triggerRefreshPermissions } = useAuth();
  const { isPermissionsUpdating } = useAuth();

  const refreshRef = useRef(triggerRefreshPermissions);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    refreshRef.current = triggerRefreshPermissions;
    userIdRef.current = user?.id;
  }, [triggerRefreshPermissions, user]);

  useEffect(() => {
    if (!userIdRef.current) return;

    console.log("Connecting to Permission SSE...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (Permissions)!");
    };

    eventSource.addEventListener("EMPLOYEE_UPDATE", (event) => {
      const targetUserId = Number(event.data);

      if (userIdRef.current === targetUserId) {
        console.log(`Phát hiện thay đổi quyền cho User ID: ${targetUserId}`);
        if (refreshRef.current) {
          refreshRef.current();
        }
      }
    });

    eventSource.onerror = (err) => {
      eventSource.close();
    };

    return () => {
      console.log("Closing SSE connection (Permissions)...");
      eventSource.close();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 font-sans text-gray-900">
      {isPermissionsUpdating && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
            <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-3" />
            <h3 className="text-lg font-bold text-gray-800">Đang đồng bộ dữ liệu...</h3>
            <p className="text-gray-500 text-sm">Vui lòng đợi trong giây lát để cập nhật quyền hạn mới.</p>
          </div>
        </div>
      )}
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-6 [scrollbar-gutter:stable]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
