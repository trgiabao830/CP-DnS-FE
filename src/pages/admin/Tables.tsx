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
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";

import { useTables } from "../../hooks/admin/useTables";
import { useAreas } from "../../hooks/admin/useArea";
import type {
  RestaurantTable,
  RestaurantTableRequest,
  TableStatus,
} from "../../types/admin/table";

import TableFormModal from "../../components/admin/tables/TableFormModal";
import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
  DeleteConfirmModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

const API_BASE_URL = "/api/admin/restaurant";

const TableManager: React.FC = () => {
  const {
    tables,
    isLoading,
    error: hookError,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    areaIdFilter,
    setAreaIdFilter,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    updateStatus,
  } = useTables();

  const { areas } = useAreas(true);

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [statusModalData, setStatusModalData] =
    useState<RestaurantTable | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [areaSearchText, setAreaSearchText] = useState("");
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  const handleError = (err: any) => {
    console.error("Lỗi hệ thống:", err);
    const status = err?.status || err?.response?.status;
    const message =
      err?.response?.data?.message || err?.message || "Có lỗi xảy ra";

    if (status === 403 || message === "FORBIDDEN") {
      setIsPermissionDenied(true);
    } else {
      setErrorMsg(message);
    }
  };

  useEffect(() => {
    if (areaIdFilter) {
      const selectedArea = areas.find((a) => a.areaId === areaIdFilter);
      if (selectedArea) setAreaSearchText(selectedArea.name);
    } else {
      setAreaSearchText("");
    }
  }, [areaIdFilter, areas]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        areaDropdownRef.current &&
        !areaDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAreaDropdownOpen(false);
        if (areaIdFilter) {
          const selected = areas.find((a) => a.areaId === areaIdFilter);
          setAreaSearchText(selected ? selected.name : "");
        } else {
          setAreaSearchText("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [areaIdFilter, areas]);

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(areaSearchText.toLowerCase()),
  );

  useEffect(() => {
    if (hookError) {
      handleError(hookError);
    }
  }, [hookError]);

  const fetchTablesRef = useRef(fetchTables);

  useEffect(() => {
    fetchTablesRef.current = fetchTables;
  }, [fetchTables]);

  useEffect(() => {
    let isActive = true;

    console.log("Connecting to SSE (Tables)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => {
      console.log("SSE Connected (Tables)!");
    };

    eventSource.addEventListener("RESTAURANT_TABLE_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: RESTAURANT_TABLE_UPDATE", event.data);
        if (fetchTablesRef.current) {
          fetchTablesRef.current();
        }
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) {
        eventSource.close();
      }
    };

    return () => {
      console.log("Closing SSE connection (Tables)...");
      isActive = false;
      eventSource.close();
    };
  }, []);

  const handleFormSubmit = async (data: RestaurantTableRequest) => {
    try {
      if (editingTable) {
        await updateTable(editingTable.tableId, data);
        setSuccessMsg("Cập nhật bàn thành công!");
      } else {
        await createTable(data);
        setSuccessMsg("Thêm bàn mới thành công!");
      }
      setModalFormOpen(false);
    } catch (e: any) {
      handleError(e);
      throw e;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteTable(deleteId);
      setSuccessMsg("Đã xóa bàn ăn!");
    } catch (e: any) {
      handleError(e);
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusModalData) return;
    const newStatus: TableStatus =
      statusModalData.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

    try {
      await updateStatus(statusModalData.tableId, newStatus);
      setSuccessMsg("Cập nhật trạng thái thành công!");
    } catch (e: any) {
      handleError(e);
    } finally {
      setStatusModalData(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
            Trống
          </span>
        );
      case "SERVING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
            Có khách
          </span>
        );
      case "RESERVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
            Đã đặt
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
            Ngưng dùng
          </span>
        );
    }
  };

  const renderPaginationButtons = () => {
    const { totalPages, page } = meta;
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 3) pages.push("...");
      let start = Math.max(1, page - 1);
      let end = Math.min(totalPages - 2, page + 1);
      if (page <= 3) end = 4;
      if (page >= totalPages - 4) start = totalPages - 5;
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 4) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages.map((p, idx) =>
      p === "..." ? (
        <span key={`dots-${idx}`} className="px-2 text-gray-400">
          ...
        </span>
      ) : (
        <button
          key={p}
          onClick={() => setMeta((prev) => ({ ...prev, page: Number(p) }))}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-blue-600 text-white shadow-sm" : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          {Number(p) + 1}
        </button>
      ),
    );
  };

  const startRecord = meta.totalElements === 0 ? 0 : meta.page * meta.size + 1;
  const endRecord = Math.min((meta.page + 1) * meta.size, meta.totalElements);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="whitespace-nowrap text-2xl font-bold text-gray-800">
            Quản lý Bàn ăn
          </h1>
          <p className="text-sm text-gray-500">Danh sách bàn ăn theo khu vực</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 👇 1. DROPDOWN LỌC KHU VỰC (MỚI) */}
          <div className="relative" ref={areaDropdownRef}>
            <div className="relative">
              <Filter
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tất cả khu vực"
                value={areaSearchText}
                onChange={(e) => {
                  setAreaSearchText(e.target.value);
                  setIsAreaDropdownOpen(true);
                }}
                onFocus={() => setIsAreaDropdownOpen(true)}
                className="h-10 w-48 rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              {areaIdFilter || areaSearchText ? (
                <button
                  onClick={() => {
                    setAreaIdFilter(""); 
                    setAreaSearchText(""); 
                    setMeta((prev) => ({ ...prev, page: 0 }));
                    setIsAreaDropdownOpen(false);
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

            {isAreaDropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full min-w-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredAreas.length > 0 ? (
                  <ul>
                    <li
                      onClick={() => {
                        setAreaIdFilter("");
                        setAreaSearchText("");
                        setMeta((prev) => ({ ...prev, page: 0 }));
                        setIsAreaDropdownOpen(false);
                      }}
                      className="cursor-pointer border-b border-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Tất cả khu vực
                    </li>
                    {filteredAreas.map((area) => (
                      <li
                        key={area.areaId}
                        onClick={() => {
                          setAreaIdFilter(area.areaId);
                          setAreaSearchText(area.name);
                          setMeta((prev) => ({ ...prev, page: 0 }));
                          setIsAreaDropdownOpen(false);
                        }}
                        className={`cursor-pointer px-4 py-2 text-sm hover:bg-blue-50 ${areaIdFilter === area.areaId ? "bg-blue-50 font-medium text-blue-600" : "text-gray-700"}`}
                      >
                        {area.name}
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

          {/* 2. Dropdown Lọc Trạng Thái (Cũ) */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 0 }));
              }}
              className="h-10 cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="AVAILABLE">Trống</option>
              <option value="SERVING">Có khách</option>
              <option value="RESERVED">Đã đặt</option>
              <option value="UNAVAILABLE">Ngưng sử dụng</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
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
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setEditingTable(null);
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
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-500">
            <Loader2 className="animate-spin text-blue-500" size={32} /> Đang
            tải dữ liệu...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="w-20 px-6 py-4 text-center">STT</th>
                    <th className="px-6 py-4">Số Bàn</th>
                    <th className="px-6 py-4">Khu vực</th>
                    <th className="px-6 py-4 text-center">Sức chứa</th>
                    <th className="w-36 px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tables.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu phù hợp
                      </td>
                    </tr>
                  ) : (
                    tables.map((table, idx) => (
                      <tr
                        key={table.tableId}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + idx + 1}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {table.tableNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            {table.area?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            {table.capacity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatusBadge(table.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {(table.status === "AVAILABLE" ||
                              table.status === "UNAVAILABLE") && (
                              <button
                                onClick={() => setStatusModalData(table)}
                                className={`rounded-lg p-2 transition-colors ${table.status === "AVAILABLE" ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                                title={
                                  table.status === "AVAILABLE"
                                    ? "Ngưng sử dụng"
                                    : "Kích hoạt"
                                }
                              >
                                {table.status === "AVAILABLE" ? (
                                  <Eye size={18} />
                                ) : (
                                  <EyeOff size={18} />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingTable(table);
                                setModalFormOpen(true);
                              }}
                              className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteId(table.tableId)}
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

            {/* FOOTER PAGINATION */}
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
                bàn
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 0}
                  onClick={() => setMeta((p) => ({ ...p, page: p.page - 1 }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPaginationButtons()}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() => setMeta((p) => ({ ...p, page: p.page + 1 }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      <TableFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTable}
        areas={areas}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa bàn ăn?"
        message="Hành động này sẽ xóa bàn khỏi hệ thống. Lưu ý: Chỉ xóa được khi bàn không có đơn đang phục vụ."
      />

      {/* Modal Đổi Trạng Thái (Inline Logic) */}
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
                ? "Ngưng sử dụng bàn này?"
                : "Kích hoạt bàn này?"}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc muốn{" "}
              {statusModalData.status === "AVAILABLE"
                ? "ngưng sử dụng"
                : "kích hoạt"}{" "}
              bàn số <strong>{statusModalData.tableNumber}</strong>?
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

      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
      <PermissionDeniedModal
        isOpen={isPermissionDenied}
        onClose={() => setIsPermissionDenied(false)}
      />
    </div>
  );
};

export default TableManager;
