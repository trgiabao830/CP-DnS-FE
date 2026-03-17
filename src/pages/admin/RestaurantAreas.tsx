import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { useAreas } from "../../hooks/admin/useArea";
import type {
  RestaurantArea,
  RestaurantAreaRequest,
  AreaStatus,
} from "../../types/admin/area";

import AreaFormModal from "../../components/admin/areas/AreaFormModal";
import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
  DeleteConfirmModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

const API_BASE_URL = "/api/admin/restaurant";

const RestaurantAreas: React.FC = () => {
  const {
    areas,
    isLoading,
    error: hookError,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
    updateStatus,
  } = useAreas();

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<RestaurantArea | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [statusModalData, setStatusModalData] = useState<RestaurantArea | null>(
    null,
  );

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  useEffect(() => {
    if (hookError) {
      if (hookError?.status === 403) setIsPermissionDenied(true);
      else setErrorMsg(hookError?.message || "Có lỗi xảy ra khi tải dữ liệu");
    }
  }, [hookError]);

  const fetchAreasRef = useRef(fetchAreas);

  useEffect(() => {
    fetchAreasRef.current = fetchAreas;
  }, [fetchAreas]);

  useEffect(() => {
    let isActive = true;

    console.log("Connecting to SSE (Areas)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (Areas)!");
    };

    eventSource.addEventListener("RESTAURANT_AREA_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: RESTAURANT_AREA_UPDATE", event.data);
        if (fetchAreasRef.current) {
          fetchAreasRef.current();
        }
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) {
        eventSource.close();
      }
    };

    return () => {
      console.log("Closing SSE connection (Areas)...");
      isActive = false;
      eventSource.close();
    };
  }, []);

  const handleFormSubmit = async (data: RestaurantAreaRequest) => {
    try {
      if (editingArea) {
        await updateArea(editingArea.areaId, data);
        setSuccessMsg("Cập nhật khu vực thành công!");
      } else {
        await createArea(data);
        setSuccessMsg("Tạo khu vực mới thành công!");
      }
      setModalFormOpen(false);
    } catch (e: any) {
      setErrorMsg(e.message || "Lỗi khi lưu dữ liệu");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteArea(deleteId);
      setSuccessMsg("Đã xóa khu vực!");
    } catch (e: any) {
      setErrorMsg(
        e.message || "Không thể xóa khu vực này (có thể đang chứa bàn ăn)",
      );
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusModalData) return;

    const newStatus: AreaStatus =
      statusModalData.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

    try {
      await updateStatus(statusModalData.areaId, newStatus);
      setSuccessMsg("Cập nhật trạng thái thành công!");
    } catch (e: any) {
      setErrorMsg(e.message || "Lỗi cập nhật trạng thái");
    } finally {
      setStatusModalData(null);
    }
  };

  const renderStatusBadge = (status: AreaStatus) => {
    const isAvailable = status === "AVAILABLE";
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
          isAvailable
            ? "border-green-100 bg-green-50 text-green-700"
            : "border-red-100 bg-red-50 text-red-700"
        }`}
      >
        {isAvailable ? "Hoạt động" : "Ngưng hoạt động"}
      </span>
    );
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
              : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
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
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="whitespace-nowrap text-2xl font-bold text-gray-800">
            Quản lý Khu vực
          </h1>
          <p className="text-sm text-gray-500">
            Thiết lập các khu vực bàn ăn (Tầng 1, Sân thượng...)
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 0 }));
              }}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="AVAILABLE">Hoạt động</option>
              <option value="UNAVAILABLE">Ngưng hoạt động</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Search Bar */}
          <div className="relative flex-grow sm:w-64 sm:flex-grow-0">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Add Button */}
          <button
            onClick={() => {
              setEditingArea(null);
              setModalFormOpen(true);
            }}
            className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={18} /> Thêm mới
          </button>
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Tên khu vực</th>
                    <th className="w-44 px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {areas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    areas.map((area, idx) => (
                      <tr
                        key={area.areaId}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">
                            {area.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatusBadge(area.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setStatusModalData(area)}
                              className={`rounded-lg p-2 transition-colors ${area.status === "AVAILABLE" ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                              title="Đổi trạng thái"
                            >
                              {area.status === "AVAILABLE" ? (
                                <Eye size={18} />
                              ) : (
                                <EyeOff size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingArea(area);
                                setModalFormOpen(true);
                              }}
                              className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteId(area.areaId)}
                              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
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

            {/* UPDATED FOOTER PAGINATION */}
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
                khu vực
              </span>

              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  disabled={meta.page === 0}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Numbers */}
                {renderPaginationButtons()}

                {/* Next Button */}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Form Thêm/Sửa */}
      <AreaFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingArea}
      />

      {/* 2. Confirm Xóa */}
      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa khu vực?"
        message="Hành động này sẽ xóa khu vực khỏi hệ thống. Lưu ý: Nếu khu vực đang có bàn, bạn cần xóa bàn trước."
      />

      {/* 3. Modal Đổi Trạng Thái (Inline Logic) */}
      {statusModalData && (
        <Modal
          isOpen={!!statusModalData}
          onClose={() => setStatusModalData(null)}
          title="Đổi trạng thái"
          size="md"
        >
          <div className="p-6 text-center">
            {/* Icon trạng thái to tròn */}
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                statusModalData.status === "AVAILABLE"
                  ? "bg-orange-100 text-orange-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {statusModalData.status === "AVAILABLE" ? (
                <EyeOff size={28} />
              ) : (
                <Eye size={28} />
              )}
            </div>

            {/* Tiêu đề & Nội dung */}
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              {statusModalData.status === "AVAILABLE"
                ? "Ngưng hoạt động khu vực này?"
                : "Kích hoạt khu vực này?"}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc muốn{" "}
              {statusModalData.status === "AVAILABLE"
                ? "ngưng hoạt động"
                : "kích hoạt"}{" "}
              khu vực <strong>{statusModalData.name}</strong>?
            </p>

            {/* Nút bấm căn giữa */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setStatusModalData(null)}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStatusChangeConfirm}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors ${
                  statusModalData.status === "AVAILABLE"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Thông báo */}
      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />
    </div>
  );
};

export default RestaurantAreas;
