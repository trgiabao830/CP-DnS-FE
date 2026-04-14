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
  ChevronDown,
  EyeOff,
  Lock,
} from "lucide-react";

import { useRooms } from "../../hooks/admin/useRooms";
import { useRoomTypes } from "../../hooks/admin/useRoomTypes";
import { useRoomClasses } from "../../hooks/admin/useRoomClasses";
import type { HomestayRoom, RoomRequest, RoomStatus } from "../../types/admin/room";

import RoomFormModal from "../../components/admin/rooms/RoomFormModal";
import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
  DeleteConfirmModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

const API_BASE_URL = "/api/admin/homestay";

const Room: React.FC = () => {
  const {
    rooms,
    isLoading,
    error: hookError,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    classFilter,
    setClassFilter,
    fetchRooms,
    createRoom,
    updateRoom,
    updateStatus,
    deleteRoom,
  } = useRooms();

  const { roomTypes } = useRoomTypes(true);
  const { roomClasses } = useRoomClasses(true);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomestayRoom | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [statusModalData, setStatusModalData] = useState<HomestayRoom | null>(
    null,
  );

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [classSearchText, setClassSearchText] = useState("");
  const classDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (classFilter) {
      const selectedClass = roomClasses.find(
        (c) => String(c.classId) === classFilter,
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
            (c) => String(c.classId) === classFilter,
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

  const filteredClassesDisplay = roomClasses.filter((c) =>
    c.name.toLowerCase().includes(classSearchText.toLowerCase()),
  );

  const availableRoomTypes = classFilter
    ? roomTypes.filter((t) => t.roomClass?.classId === Number(classFilter))
    : roomTypes;

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [typeSearchText, setTypeSearchText] = useState("");
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeFilter) {
      const selectedType = roomTypes.find(
        (t) => String(t.typeId) === typeFilter,
      );
      if (selectedType) setTypeSearchText(selectedType.name);
    } else {
      setTypeSearchText("");
    }
  }, [typeFilter, roomTypes]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTypeDropdownOpen(false);
        if (typeFilter) {
          const selected = roomTypes.find(
            (t) => String(t.typeId) === typeFilter,
          );
          setTypeSearchText(selected ? selected.name : "");
        } else {
          setTypeSearchText("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [typeFilter, roomTypes]);

  const filteredTypesDisplay = availableRoomTypes.filter((t) =>
    t.name.toLowerCase().includes(typeSearchText.toLowerCase()),
  );

  const fetchRoomsRef = useRef(fetchRooms);

  useEffect(() => {
    fetchRoomsRef.current = fetchRooms;
  }, [fetchRooms]);

  useEffect(() => {
    let isActive = true;

    console.log("Connecting to SSE (Rooms)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (Rooms)!");
    };

    eventSource.addEventListener("ROOM_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: ROOM_UPDATE", event.data);
        if (fetchRoomsRef.current) {
          fetchRoomsRef.current();
        }
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) {
        eventSource.close();
      }
    };

    return () => {
      console.log("Closing SSE connection (Rooms)...");
      isActive = false;
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (hookError) {
      if (hookError?.status === 403) setIsPermissionDenied(true);
      else setErrorMsg(hookError?.message || "Có lỗi xảy ra");
    }
  }, [hookError]);

  const handleFormSubmit = async (data: RoomRequest) => {
    try {
      if (editingItem) {
        await updateRoom(editingItem.roomId, data);
        setSuccessMsg("Cập nhật phòng thành công!");
      } else {
        await createRoom(data);
        setSuccessMsg("Tạo phòng mới thành công!");
      }
      setModalFormOpen(false);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteRoom(deleteId);
      setSuccessMsg("Đã xóa phòng!");
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusModalData) return;
    try {
      const newStatus: RoomStatus =
        statusModalData.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      await updateStatus(statusModalData.roomId, newStatus);
      setSuccessMsg("Cập nhật trạng thái thành công!");
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setStatusModalData(null);
    }
  };

  const renderStatusBadge = (status: RoomStatus) => {
    const configs: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-700 border-green-200",
      BOOKED: "bg-blue-100 text-blue-700 border-blue-200",
      OCCUPIED: "bg-purple-100 text-purple-700 border-purple-200",
      UNAVAILABLE: "bg-gray-100 text-gray-600 border-gray-200",
    };
    const labels: Record<string, string> = {
      AVAILABLE: "Sẵn sàng",
      BOOKED: "Đã đặt",
      OCCUPIED: "Đang ở",
      UNAVAILABLE: "Ngưng",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${configs[status] || "border-gray-200 bg-gray-100 text-gray-700"}`}
      >
        {labels[status] || status}
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
            Quản lý Phòng
          </h1>
          <p className="text-sm text-gray-500">
            Danh sách phòng, trạng thái và giá hiện tại
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          {/* 1. FILTER CLASS (Searchable Dropdown) - MỚI */}
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
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {classFilter || classSearchText ? (
                <button
                  onClick={() => {
                    setClassFilter("");
                    setClassSearchText("");
                    setTypeFilter("");
                    setTypeSearchText("");
                    setMeta((p) => ({ ...p, page: 0 }));
                    setIsClassDropdownOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
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

            {/* Class Dropdown Options */}
            {isClassDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full min-w-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredClassesDisplay.length > 0 ? (
                  <ul>
                    <li
                      onClick={() => {
                        setClassFilter("");
                        setClassSearchText("");
                        setTypeFilter("");
                        setTypeSearchText("");
                        setMeta((p) => ({ ...p, page: 0 }));
                        setIsClassDropdownOpen(false);
                      }}
                      className="cursor-pointer border-b border-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Tất cả hạng phòng
                    </li>
                    {filteredClassesDisplay.map((c) => (
                      <li
                        key={c.classId}
                        onClick={() => {
                          setClassFilter(String(c.classId));
                          setClassSearchText(c.name);
                          setTypeFilter("");
                          setTypeSearchText("");
                          setMeta((p) => ({ ...p, page: 0 }));
                          setIsClassDropdownOpen(false);
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 ${classFilter === String(c.classId) ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700"}`}
                      >
                        {c.name}
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

          {/* 2. FILTER ROOM TYPE (Searchable Dropdown) */}
          <div className="relative" ref={typeDropdownRef}>
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={
                  classFilter ? "Lọc loại theo hạng..." : "Tất cả loại phòng"
                }
                value={typeSearchText}
                onChange={(e) => {
                  setTypeSearchText(e.target.value);
                  setIsTypeDropdownOpen(true);
                }}
                onFocus={() => setIsTypeDropdownOpen(true)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {typeFilter || typeSearchText ? (
                <button
                  onClick={() => {
                    setTypeFilter("");
                    setTypeSearchText("");
                    setMeta((p) => ({ ...p, page: 0 }));
                    setIsTypeDropdownOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
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

            {/* Type Dropdown Options */}
            {isTypeDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full min-w-[220px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredTypesDisplay.length > 0 ? (
                  <ul>
                    <li
                      onClick={() => {
                        setTypeFilter("");
                        setTypeSearchText("");
                        setMeta((p) => ({ ...p, page: 0 }));
                        setIsTypeDropdownOpen(false);
                      }}
                      className="cursor-pointer border-b border-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      {classFilter
                        ? "Tất cả loại của hạng này"
                        : "Tất cả loại phòng"}
                    </li>
                    {filteredTypesDisplay.map((t) => (
                      <li
                        key={t.typeId}
                        onClick={() => {
                          setTypeFilter(String(t.typeId));
                          setTypeSearchText(t.name);
                          setMeta((p) => ({ ...p, page: 0 }));
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 ${typeFilter === String(t.typeId) ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700"}`}
                      >
                        {t.name}
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

          {/* 3. FILTER STATUS */}
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
              <option value="AVAILABLE">Sẵn sàng</option>
              <option value="BOOKED">Đã đặt</option>
              <option value="OCCUPIED">Đang ở</option>
              <option value="UNAVAILABLE">Ngưng/Bảo trì</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* 4. SEARCH INPUT */}
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
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Số phòng</th>
                    <th className="px-6 py-4">Hạng phòng</th>
                    <th className="px-6 py-4">Loại phòng</th>
                    <th className="px-6 py-4 text-right">Giá niêm yết</th>
                    <th className="w-32 px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    rooms.map((item, index) => (
                      <tr
                        key={item.roomId}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + index + 1}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {item.roomNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex py-1 text-sm text-yellow-800">
                            {item.roomType.roomClass?.name || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex py-1 text-sm text-blue-700">
                            {item.roomType.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-700">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.roomType.basePrice)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {item.status === "AVAILABLE" ||
                            item.status === "UNAVAILABLE" ? (
                              <button
                                onClick={() => setStatusModalData(item)}
                                className={`rounded-lg p-2 transition-colors ${item.status === "AVAILABLE" ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                title={
                                  item.status === "AVAILABLE"
                                    ? "Ngưng hoạt động"
                                    : "Kích hoạt lại"
                                }
                              >
                                {item.status === "AVAILABLE" ? (
                                  <Eye size={18} />
                                ) : (
                                  <EyeOff size={18} />
                                )}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="cursor-not-allowed p-2 text-yellow-600"
                                title="Đang có khách/đặt"
                              >
                                <Lock size={18} />
                              </button>
                            )}
                            {item.status === "AVAILABLE" ||
                            item.status === "UNAVAILABLE" ? (
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setModalFormOpen(true);
                                }}
                                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                                title="Chỉnh sửa thông tin"
                              >
                                <Pencil size={18} />
                              </button>
                            ) : (
                              <div></div>
                            )}
                            <button
                              onClick={() => setDeleteId(item.roomId)}
                              disabled={
                                item.status === "OCCUPIED" ||
                                item.status === "BOOKED"
                              }
                              className={`rounded-lg p-2 transition-colors ${item.status === "OCCUPIED" || item.status === "BOOKED" ? "cursor-not-allowed text-gray-300" : "text-red-600 hover:bg-red-50"}`}
                              title={
                                item.status === "OCCUPIED" ||
                                item.status === "BOOKED"
                                  ? "Không thể xóa khi đang có khách"
                                  : "Xóa"
                              }
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

            {/* Pagination Footer */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row">
              <span className="text-sm text-gray-500">
                Hiển thị{" "}
                <span className="font-semibold text-gray-900">
                  {startRecord} - {endRecord}
                </span>{" "}
                trên tổng{" "}
                <span className="font-bold text-gray-900">
                  {meta.totalElements}
                </span>{" "}
                phòng
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
      <RoomFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />
      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa phòng?"
        message="Hành động này sẽ xóa phòng vĩnh viễn khỏi hệ thống."
      />

      {/* Modal Đổi trạng thái (Đã cập nhật giao diện) */}
      {statusModalData && (
        <Modal
          isOpen={!!statusModalData}
          onClose={() => setStatusModalData(null)}
          title="Đổi trạng thái"
          size="md"
        >
          <div className="p-6 text-center">
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
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              {statusModalData.status === "AVAILABLE"
                ? "Ngưng hoạt động?"
                : "Kích hoạt?"}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc muốn{" "}
              {statusModalData.status === "AVAILABLE"
                ? "ngưng hoạt động"
                : "kích hoạt"}{" "}
              phòng <strong>{statusModalData.roomNumber}</strong>?
            </p>
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

      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />
    </div>
  );
};

export default Room;
