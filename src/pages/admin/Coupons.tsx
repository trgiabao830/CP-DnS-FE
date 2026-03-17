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
  Clock,
} from "lucide-react";

import { useCoupons } from "../../hooks/admin/useCoupons";
import {
  CouponStatus,
  ServiceType,
  type Coupon,
  type CouponRequest,
} from "../../types/admin/coupon";

import CouponFormModal from "../../components/admin/coupons/CouponFormModal";
import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
  DeleteConfirmModal,
} from "../../components/admin/common/ActionModals";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

const API_BASE_URL = "/api/admin/coupons";

const Coupons: React.FC = () => {
  const {
    coupons,
    isLoading,
    error: hookError,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    serviceTypeFilter,
    setServiceTypeFilter,
    statusFilter,
    setStatusFilter,
    onlyActive,
    setOnlyActive,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    updateStatus,
    deleteCoupon,
  } = useCoupons();

  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModalData, setStatusModalData] = useState<Coupon | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const fetchCouponsRef = useRef(fetchCoupons);

  useEffect(() => {
    fetchCouponsRef.current = fetchCoupons;
  }, [fetchCoupons]);

  useEffect(() => {
    let isActive = true;
    console.log("Connecting to SSE (Coupons)...");
    const eventSource = new EventSource(`${API_BASE_URL}/sse/subscribe`);

    eventSource.onopen = () => console.log("SSE Connected (Coupons)!");

    eventSource.addEventListener("COUPON_UPDATE", (event) => {
      if (isActive) {
        console.log("Received SSE Event: COUPON_UPDATE", event.data);
        if (fetchCouponsRef.current) fetchCouponsRef.current();
      }
    });

    eventSource.onerror = (err) => {
      if (isActive) eventSource.close();
    };

    return () => {
      console.log("Closing SSE connection (Coupons)...");
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

  const handleActionError = (err: any) => {
    console.error("Action Failed:", err);
    if (err?.status === 403) {
      setIsPermissionDenied(true);
    } else {
      setErrorMsg(err?.message || "Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  const handleFormSubmit = async (data: CouponRequest) => {
    try {
      if (editingItem) {
        await updateCoupon(editingItem.couponId, data);
        setSuccessMsg("Cập nhật mã giảm giá thành công!");
      } else {
        await createCoupon(data);
        setSuccessMsg("Tạo mã giảm giá mới thành công!");
      }
      setModalFormOpen(false);
    } catch (e: any) {
      handleActionError(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteCoupon(deleteId);
      setSuccessMsg("Đã xóa mã giảm giá!");
    } catch (e: any) {
      handleActionError(e);
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusModalData) return;
    try {
      const newStatus: CouponStatus =
        statusModalData.status === CouponStatus.AVAILABLE
          ? CouponStatus.UNAVAILABLE
          : CouponStatus.AVAILABLE;
      await updateStatus(statusModalData.couponId, newStatus);
      setSuccessMsg("Cập nhật trạng thái thành công!");
    } catch (e: any) {
      handleActionError(e);
    } finally {
      setStatusModalData(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("vi-VN");

  const renderStatusBadge = (status: CouponStatus) => {
    const isAvailable = status === CouponStatus.AVAILABLE;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
          isAvailable
            ? "border-green-100 bg-green-50 text-green-700"
            : "border-red-100 bg-red-50 text-red-700"
        }`}
      >
        {isAvailable ? "Hoạt động" : "Ngưng"}
      </span>
    );
  };

  const renderServiceBadge = (type: ServiceType) => {
    const isHomestay = type === ServiceType.HOMESTAY;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${isHomestay ? "border-indigo-100 bg-indigo-50 text-indigo-700" : "border-orange-100 bg-orange-50 text-orange-700"}`}
      >
        {isHomestay ? "Homestay" : "Nhà hàng"}
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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-fit">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            Quản lý Mã giảm giá
          </h1>
          <p className="text-sm text-gray-500">
            Danh sách khuyến mãi cho nhà hàng và homestay
          </p>
        </div>

        <div className="flex flex-grow flex-wrap items-center gap-3 sm:flex-grow-0">
          <div className="relative">
            <select
              value={onlyActive ? "true" : ""}
              onChange={(e) => {
                setOnlyActive(e.target.value === "true");
                setMeta((p) => ({ ...p, page: 0 }));
              }}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả thời hạn</option>
              <option value="true">Còn hiệu lực</option>
            </select>
            {/* Icon Clock */}
            <Clock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          {/* Service Filter */}
          <div className="relative">
            <select
              value={serviceTypeFilter}
              onChange={(e) => {
                setServiceTypeFilter(e.target.value);
                setMeta((p) => ({ ...p, page: 0 }));
              }}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm outline-none hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả dịch vụ</option>
              <option value={ServiceType.HOMESTAY}>Homestay</option>
              <option value={ServiceType.RESTAURANT}>Nhà hàng</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Status Filter */}
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
              <option value={CouponStatus.AVAILABLE}>Hoạt động</option>
              <option value={CouponStatus.UNAVAILABLE}>Ngưng hoạt động</option>
            </select>
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Search */}
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
                    <th className="px-6 py-4">Mã giảm giá</th>
                    <th className="px-6 py-4">Mức giảm</th>
                    <th className="px-6 py-4 text-center">Dịch vụ</th>
                    <th className="px-6 py-4">Thời hạn</th>
                    <th className="px-6 py-4 text-center">Lượt dùng</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="w-48 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-12 text-center italic text-gray-500"
                      >
                        Không tìm thấy dữ liệu nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    coupons.map((item, index) => (
                      <tr
                        key={item.couponId}
                        className="group transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-center font-medium text-gray-500">
                          {meta.page * meta.size + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.discountPercent ? (
                            <div>
                              <span className="font-bold text-orange-600">
                                {item.discountPercent}%
                              </span>
                              {item.maxDiscountAmount && (
                                <div className="text-xs text-gray-500">
                                  Tối đa:{" "}
                                  {item.maxDiscountAmount.toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  đ
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="font-bold text-green-600">
                              {item.discountAmount?.toLocaleString("vi-VN")} đ
                            </span>
                          )}
                          <div className="mt-1 text-xs text-gray-500">
                            Tối thiểu:{" "}
                            {item.minOrderValue?.toLocaleString("vi-VN")} đ
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderServiceBadge(item.serviceType)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-xs text-gray-500">
                            Từ: {formatDate(item.validFrom)}
                          </div>
                          <div className="text-xs font-medium text-gray-700">
                            Đến: {formatDate(item.validUntil)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="mb-1 text-sm font-medium">
                              {item.usedCount} / {item.quantity}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {renderStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setStatusModalData(item)}
                              className={`rounded-lg p-2 transition-colors ${item.status === CouponStatus.AVAILABLE ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                              title={
                                item.status === CouponStatus.AVAILABLE
                                  ? "Ngưng hoạt động"
                                  : "Kích hoạt"
                              }
                            >
                              {item.status === CouponStatus.AVAILABLE ? (
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
                              title="Chỉnh sửa"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteId(item.couponId)}
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
                mã giảm giá
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

      {/* MODALS */}
      <CouponFormModal
        isOpen={modalFormOpen}
        onClose={() => setModalFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa mã giảm giá?"
        message="Hành động này sẽ xóa mã khỏi hệ thống."
      />

      {statusModalData && (
        <Modal
          isOpen={!!statusModalData}
          onClose={() => setStatusModalData(null)}
          title="Đổi trạng thái"
          size="md"
        >
          <div className="p-6 text-center">
            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${statusModalData.status === CouponStatus.AVAILABLE ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}
            >
              {statusModalData.status === CouponStatus.AVAILABLE ? (
                <EyeOff size={28} />
              ) : (
                <Eye size={28} />
              )}
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              {statusModalData.status === CouponStatus.AVAILABLE
                ? "Ngưng hoạt động?"
                : "Kích hoạt lại?"}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc muốn đổi trạng thái mã{" "}
              <strong>{statusModalData.code}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setStatusModalData(null)}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStatusChangeConfirm}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white ${statusModalData.status === CouponStatus.AVAILABLE ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
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

export default Coupons;
