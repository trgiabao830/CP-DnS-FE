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
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";

import { useRoomTypes } from "../../hooks/admin/useRoomTypes";
import { useRoomClasses } from "../../hooks/admin/useRoomClasses";
import type { HomestayRoomType } from "../../types/admin/room-type";

import RoomTypeFormModal from "../../components/admin/room-types/RoomTypeFormModal";
import Modal from "../../components/Modal";
import {
  DeleteConfirmModal,
  SuccessModal,
  ErrorModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

const API_BASE_URL = "/api/admin/homestay";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

const RoomType: React.FC = () => {
  const {
    roomTypes,
    isLoading,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
    createRoomType,
    updateRoomType,
    updateStatus,
    deleteRoomType,
    fetchRoomTypes,
    error: hookError,
  } = useRoomTypes();

  const { roomClasses } = useRoomClasses(true);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomestayRoomType | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusItem, setStatusItem] = useState<HomestayRoomType | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const fetchRoomTypesRef = useRef(fetchRoomTypes);

  useEffect(() => {
    fetchRoomTypesRef.current = fetchRoomTypes;
  }, [fetchRoomTypes]);

  useEffect(() => {
    let isActive = true;

    console.log("Connecting to SSE (RoomType)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (RoomType)!");
    };

    eventSource.addEventListener("ROOM_TYPE_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: ROOM_TYPE_UPDATE", event.data);
        if (fetchRoomTypesRef.current) {
          fetchRoomTypesRef.current();
        }
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) {
        eventSource.close();
      }
    };

    return () => {
      console.log("Closing SSE connection (RoomType)...");
      isActive = false;
      eventSource.close();
    };
  }, []);

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classSearchText, setClassSearchText] = useState("");
  const classDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (classFilter) {
      const selectedClass = roomClasses.find(
        (c) => c.classId === Number(classFilter),
      );
      if (selectedClass) setClassSearchText(selectedClass.name);
    } else {
      setClassSearchText("");
    }
  }, [classFilter, roomClasses]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClassDropdownOpen(false);
        if (classFilter) {
          const selected = roomClasses.find(
            (c) => c.classId === Number(classFilter),
          );
          setClassSearchText(selected ? selected.name : "");
        } else {
          setClassSearchText("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [classFilter, roomClasses]);

  const filteredClasses = roomClasses.filter((c) =>
    c.name.toLowerCase().includes(classSearchText.toLowerCase()),
  );

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

  const handleFormSubmit = async (data: any, images: File[]) => {
    try {
      if (editingItem) {
        await updateRoomType(editingItem.typeId, data, images);
        setSuccessMsg("Cập nhật loại phòng thành công!");
      } else {
        await createRoomType(data, images);
        setSuccessMsg("Thêm loại phòng mới thành công!");
      }
      setModalFormOpen(false);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteRoomType(deleteId);
      setSuccessMsg("Đã xóa loại phòng!");
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
      await updateStatus(statusItem.typeId, newStatus);
      setSuccessMsg(`Đã cập nhật trạng thái`);
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
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-fit">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            Quản lý Loại phòng
          </h1>
          <p className="text-sm text-gray-500">
            Danh sách các loại phòng (Standard Double, Deluxe King...)
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          {/* 1. FILTER CLASS (SEARCHABLE DROPDOWN - MỚI) */}
          <div className="relative" ref={classDropdownRef}>
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tất cả hạng phòng"
                value={classSearchText}
                onChange={(e) => {
                  setClassSearchText(e.target.value);
                  setIsClassDropdownOpen(true);
                }}
                onFocus={() => setIsClassDropdownOpen(true)}
                className="h-10 w-48 rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />

              {/* Clear Button or Chevron */}
              {classFilter || classSearchText ? (
                <button
                  onClick={() => {
                    setClassFilter("");
                    setClassSearchText("");
                    setMeta((p) => ({ ...p, page: 0 }));
                    setIsClassDropdownOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              ) : (
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
              )}
            </div>

            {/* Dropdown List */}
            {isClassDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full min-w-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredClasses.length > 0 ? (
                  <ul>
                    <li
                      onClick={() => {
                        setClassFilter("");
                        setClassSearchText("");
                        setMeta((p) => ({ ...p, page: 0 }));
                        setIsClassDropdownOpen(false);
                      }}
                      className="cursor-pointer border-b border-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Tất cả hạng phòng
                    </li>
                    {filteredClasses.map((cls) => (
                      <li
                        key={cls.classId}
                        onClick={() => {
                          setClassFilter(String(cls.classId));
                          setClassSearchText(cls.name);
                          setMeta((p) => ({ ...p, page: 0 }));
                          setIsClassDropdownOpen(false);
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 ${classFilter === String(cls.classId) ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700"}`}
                      >
                        {cls.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    Không tìm thấy
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. FILTER STATUS (Select cũ) */}
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
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* 3. SEARCH */}
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
              className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
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
                    {/* 👇 THÊM CỘT STT */}
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Tên loại phòng</th>
                    <th className="px-6 py-4 text-center">Hạng phòng</th>
                    <th className="px-6 py-4 text-right">Giá cơ bản</th>
                    <th className="px-6 py-4 text-center">Sức chứa</th>
                    <th className="w-36 px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roomTypes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    roomTypes.map((item, index) => {
                      const thumb =
                        item.images && item.images.length > 0
                          ? item.images[0].imageUrl
                          : null;
                      return (
                        <tr
                          key={item.typeId}
                          className="group transition-colors hover:bg-gray-50"
                        >
                          {/* 👇 HIỂN THỊ STT */}
                          <td className="px-6 py-4 text-center font-medium text-gray-500">
                            {meta.page * meta.size + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="h-full w-full p-2 text-gray-400" />
                                )}
                              </div>
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            <span className="inline-flex items-center rounded-full border border-yellow-100 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800">
                              {item.roomClass?.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-700">
                            {formatCurrency(item.basePrice)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                              {item.maxAdults} NL + {item.maxChildren} TE
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {renderStatus(item.status)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => setStatusItem(item)}
                                className={`rounded-lg p-2 transition-colors ${item.status === "ACTIVE" ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
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
                                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                title="Sửa"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => setDeleteId(item.typeId)}
                                className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                                title="Xóa"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
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
                loại phòng
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 0}
                  onClick={() => setMeta((p) => ({ ...p, page: p.page - 1 }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPaginationButtons()}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() => setMeta((p) => ({ ...p, page: p.page + 1 }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODALS --- */}
      <RoomTypeFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa loại phòng?"
        message="Hành động này sẽ xóa loại phòng khỏi hệ thống. Không thể xóa nếu có phòng đang hoạt động bên trong."
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
                ? "Ngưng hoạt động?"
                : "Kích hoạt?"}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc muốn{" "}
              {statusItem.status === "ACTIVE" ? "ngưng hoạt động" : "kích hoạt"}{" "}
              loại phòng <strong>{statusItem.name}</strong>?
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

export default RoomType;
