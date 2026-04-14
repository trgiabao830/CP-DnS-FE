import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Lock,
  Unlock,
} from "lucide-react";
import type { User } from "../../types/admin/users";
import { userService } from "../../services/admin/user.service";
import UserFormModal from "../../components/admin/users/UserFormModal";
import {
  SuccessModal,
  DeleteConfirmModal,
  ErrorModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";
import { UserStatusConfirmModal } from "../../components/admin/users/UserActionModals";

const API_BASE_URL = "/api/admin/users";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [meta, setMeta] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [modalForm, setModalForm] = useState<{
    isOpen: boolean;
    data: User | null;
  }>({ isOpen: false, data: null });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModalData, setStatusModalData] = useState<User | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) setMeta((prev) => ({ ...prev, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAll(
        meta.page,
        meta.size,
        debouncedSearch,
        statusFilter,
      );
      setUsers(res.content);
      setMeta((prev) => ({
        ...prev,
        totalPages: res.totalPages,
        totalElements: res.totalElements,
      }));
    } catch (error: any) {
      if (error.status === 403) setIsPermissionDenied(true);
      else setErrorMsg(error.message || "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.size, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    let isActive = true;
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);
    eventSource.addEventListener("USER_UPDATE", () => {
      if (isActive && fetchDataRef.current) fetchDataRef.current();
    });
    return () => {
      isActive = false;
      eventSource.close();
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await userService.delete(deleteId);
      setSuccessMsg("Xóa người dùng thành công");
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Lỗi khi xóa người dùng");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await userService.toggleStatus(id);
      setSuccessMsg("Cập nhật trạng thái thành công");
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message || "Lỗi cập nhật trạng thái");
    }
  };

  const renderStatus = (s: string) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-center text-xs font-medium ${
        s === "ACTIVE"
          ? "border-green-100 bg-green-50 text-green-700"
          : "border-red-100 bg-red-50 text-red-700"
      }`}
    >
      {s === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
    </span>
  );

  const getGenderLabel = (g: string) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    return "Khác";
  };

  const renderPaginationButtons = () => {
    const { totalPages, page: currentPage } = meta;
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 3) pages.push("...");
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);
      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 4) start = totalPages - 5;
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 4) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages.map((page, index) => {
      if (page === "...")
        return (
          <span
            key={`ellipsis-${index}`}
            className="mb-1 self-end px-2 text-gray-400"
          >
            ...
          </span>
        );
      const pageNum = page as number;
      return (
        <button
          key={pageNum}
          onClick={() => setMeta((prev) => ({ ...prev, page: pageNum }))}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            currentPage === pageNum
              ? "border border-blue-600 bg-blue-600 text-white shadow-sm"
              : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {pageNum + 1}
        </button>
      );
    });
  };

  const startRecord = meta.totalElements === 0 ? 0 : meta.page * meta.size + 1;
  const endRecord = Math.min((meta.page + 1) * meta.size, meta.totalElements);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-fit">
          <h1 className="whitespace-nowrap text-2xl font-bold text-gray-800">
            Quản lý Khách hàng
          </h1>
          <p className="text-sm text-gray-500">
            Danh sách tài khoản người dùng hệ thống
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((p) => ({ ...p, page: 0 }));
              }}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="relative flex-grow sm:w-64 sm:flex-grow-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setMeta((prev) => ({ ...prev, page: 0 }));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setModalForm({ isOpen: true, data: null })}
            className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} /> Thêm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                  <tr>
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4">Liên hệ</th>
                    <th className="px-6 py-4 text-center">Giới tính</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <tr
                        key={user.userId}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {user.fullName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          <span className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            {getGenderLabel(user.gender)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatus(user.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setStatusModalData(user)}
                              className={`rounded-lg p-2 transition-colors ${
                                user.status === "ACTIVE"
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-400 hover:bg-gray-100"
                              }`}
                              title="Khóa/Mở khóa"
                            >
                              {user.status === "ACTIVE" ? (
                                <Unlock size={18} />
                              ) : (
                                <Lock size={18} />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setModalForm({ isOpen: true, data: user })
                              }
                              className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteId(user.userId)}
                              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-12 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 p-4 sm:flex-row">
              <span className="text-sm text-gray-500">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {startRecord} - {endRecord}
                </span>{" "}
                dữ liệu trên tổng{" "}
                <span className="font-bold text-gray-900">
                  {meta.totalElements}
                </span>{" "}
                khách hàng
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 0}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPaginationButtons()}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={modalForm.isOpen}
        onClose={() => setModalForm({ isOpen: false, data: null })}
        onSuccess={() => {
          setSuccessMsg(
            modalForm.data ? "Cập nhật thành công!" : "Thêm mới thành công!",
          );
          fetchData();
        }}
        userToEdit={modalForm.data}
      />
      <UserStatusConfirmModal
        isOpen={!!statusModalData}
        user={statusModalData}
        onClose={() => setStatusModalData(null)}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          fetchData();
        }}
      />
      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa khách hàng?"
        message="Hành động này không thể hoàn tác. Tài khoản khách hàng sẽ bị xóa vĩnh viễn khỏi hệ thống."
      />
      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />
    </div>
  );
};

export default Users;
