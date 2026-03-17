import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

import { useRoomClasses } from "../../hooks/admin/useRoomClasses";
import type { HomestayRoomClass } from "../../types/admin/room-class";

import RoomClassFormModal from "../../components/admin/room-classes/RoomClassFormModal";
import Modal from "../../components/Modal";
import {
  DeleteConfirmModal,
  SuccessModal,
  ErrorModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

const API_BASE_URL = "/api/admin/homestay";

const RoomClass: React.FC = () => {
  const {
    roomClasses,
    isLoading,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    fetchRoomClasses,
    createRoomClass,
    updateRoomClass,
    updateStatus,
    deleteRoomClass,
    error: hookError,
  } = useRoomClasses();

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomestayRoomClass | null>(
    null,
  );

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusItem, setStatusItem] = useState<HomestayRoomClass | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const fetchRoomClassesRef = useRef(fetchRoomClasses);

  useEffect(() => {
    fetchRoomClassesRef.current = fetchRoomClasses;
  }, [fetchRoomClasses]);

  useEffect(() => {
    let isActive = true;

    console.log("Connecting to SSE (RoomClass)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (RoomClass)!");
    };

    eventSource.addEventListener("ROOM_CLASS_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: ROOM_CLASS_UPDATE", event.data);
        if (fetchRoomClassesRef.current) {
          fetchRoomClassesRef.current();
        }
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) {
        eventSource.close();
      }
    };

    return () => {
      console.log("Closing SSE connection (RoomClass)...");
      isActive = false;
      eventSource.close();
    };
  }, []);

  const handleError = (err: any) => {
    console.error("Lỗi hệ thống:", err);
    if (err?.status === 403 || err?.message === "FORBIDDEN") {
      setIsPermissionDenied(true);
    } else {
      setErrorMsg(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (hookError) handleError(hookError);
  }, [hookError]);

  const handleFormSubmit = async (data: any) => {
    if (editingItem) {
      await updateRoomClass(editingItem.classId, data);
      setSuccessMsg("Cập nhật hạng phòng thành công!");
    } else {
      await createRoomClass(data);
      setSuccessMsg("Thêm hạng phòng mới thành công!");
    }
    setModalFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteRoomClass(deleteId);
      setSuccessMsg("Đã xóa hạng phòng!");
    } catch (err: any) {
      handleError(err);
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusItem) return;
    try {
      const newStatus = statusItem.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await updateStatus(statusItem.classId, newStatus);
      setSuccessMsg(
        `Đã chuyển trạng thái sang ${newStatus === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động"}`,
      );
      setStatusItem(null);
    } catch (err: any) {
      handleError(err);
    }
  };

  const renderStatus = (status: string) => {
    const isActive = status === "ACTIVE";
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isActive ? "border-green-100 bg-green-50 text-green-700" : "border-red-100 bg-red-50 text-red-700"}`}
      >
        {isActive ? "Hoạt động" : "Ngưng"}
      </span>
    );
  };

  const startRecord = meta.totalElements === 0 ? 0 : meta.page * meta.size + 1;
  const endRecord = Math.min((meta.page + 1) * meta.size, meta.totalElements);

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
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? "border border-blue-600 bg-blue-600 text-white shadow-sm" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          {pageNum + 1}
        </button>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-fit">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            Quản lý Hạng phòng
          </h1>
          <p className="text-sm text-gray-500">
            Phân cấp chất lượng phòng (Standard, Deluxe, VIP...)
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 0 }));
              }}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
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
              className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setModalFormOpen(true);
            }}
            className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} /> Thêm mới
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Tên hạng phòng</th>
                    <th className="w-36 px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roomClasses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-12 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    roomClasses.map((item, index) => (
                      <tr
                        key={item.classId}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + index + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          <div className="flex items-center">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatus(item.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setStatusItem(item)}
                              className={`rounded-lg p-2 ${item.status === "ACTIVE" ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                              title={
                                item.status === "ACTIVE"
                                  ? "Đang hiện"
                                  : "Đang ẩn"
                              }
                            >
                              {item.status === "ACTIVE" ? (
                                <Eye size={18} />
                              ) : (
                                <EyeOff size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setModalFormOpen(true);
                              }}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              title="Sửa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.classId)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row">
              <span className="text-sm text-gray-500">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {startRecord} - {endRecord}
                </span>{" "}
                dữ liệu trên tổng{" "}
                <span className="font-bold text-gray-900">
                  {meta.totalElements}
                </span>{" "}
                hạng phòng
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 0}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPaginationButtons()}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      <RoomClassFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa hạng phòng?"
        message="Hành động này sẽ xóa hạng phòng khỏi hệ thống. Lưu ý: Không thể xóa nếu hạng phòng đang được gán cho loại phòng nào."
      />

      {statusItem && (
        <Modal
          isOpen={!!statusItem}
          onClose={() => setStatusItem(null)}
          title="Đổi trạng thái"
          size="md"
        >
          <div className="p-6 text-center">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${statusItem.status === "ACTIVE" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}
            >
              {statusItem.status === "ACTIVE" ? (
                <EyeOff size={28} />
              ) : (
                <Eye size={28} />
              )}
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              {statusItem.status === "ACTIVE"
                ? "Ngưng hoạt động hạng phòng này?"
                : "Kích hoạt hạng phòng này?"}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc muốn{" "}
              {statusItem.status === "ACTIVE" ? "ngưng hoạt động" : "kích hoạt"}{" "}
              hạng phòng <strong>{statusItem.name}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setStatusItem(null)}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStatusChangeConfirm}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${statusItem.status === "ACTIVE" ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </Modal>
      )}

      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />
    </div>
  );
};

export default RoomClass;
