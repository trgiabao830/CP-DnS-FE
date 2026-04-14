import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  X,
} from "lucide-react";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { format, addDays, parse, isValid } from "date-fns";

import { homestayService } from "../../services/admin/homestay.service";
import type {
  AdminHomestayBookingResponse,
  HomestayBookingStatus,
} from "../../types/admin/homestay-booking";
import { PermissionDeniedModal } from "../../components/admin/common/PermissionDeniedModal";

registerLocale("vi", vi);

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  try {
    const parsedDate = parse(dateString, "yyyy-MM-dd", new Date());
    if (!isValid(parsedDate)) {
        return format(new Date(dateString), "dd/MM/yyyy");
    }
    return format(parsedDate, "dd/MM/yyyy");
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "HH:mm dd/MM/yyyy");
  } catch {
    return dateString;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PENDING: "bg-orange-50 text-orange-700 border-orange-200",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
    CHECKED_IN: "bg-purple-50 text-purple-700 border-purple-200",
    COMPLETED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    NO_SHOW: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    CHECKED_IN: "Đã nhận phòng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Vắng mặt",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || "bg-gray-100"
      }`}
    >
      {labels[status] || status}
    </span>
  );
};

const HomestayBookingList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialDate = (key: string, defaultDate: Date | null): Date | null => {
    const param = searchParams.get(key);
    if (!param) return defaultDate;
    const parsed = parse(param, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : defaultDate;
  };

  const [bookings, setBookings] = useState<AdminHomestayBookingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const initialKeyword = searchParams.get("keyword") || "";
  const [keyword, setKeyword] = useState(initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialKeyword);

  const [status, setStatus] = useState<HomestayBookingStatus | "">(
    (searchParams.get("status") as HomestayBookingStatus) || ""
  );

  const [fromDate, setFromDate] = useState<Date | null>(() => getInitialDate("fromDate", null));
  const [toDate, setToDate] = useState<Date | null>(() => getInitialDate("toDate", null));

  const [meta, setMeta] = useState({
    page: parseInt(searchParams.get("page") || "0"),
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });

  const fetchDataRef = useRef<() => void>(() => {});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
      if (keyword !== debouncedKeyword) {
        setMeta((prev) => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [keyword]);

  useEffect(() => {
    const params: any = {};
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (status) params.status = status;
    if (meta.page > 0) params.page = meta.page.toString();
    if (fromDate) params.fromDate = format(fromDate, "yyyy-MM-dd");
    if (toDate) params.toDate = format(toDate, "yyyy-MM-dd");
    setSearchParams(params, { replace: true });
  }, [debouncedKeyword, status, meta.page, fromDate, toDate, setSearchParams]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const formattedFromDate = fromDate ? format(fromDate, "yyyy-MM-dd") : undefined;
      const formattedToDate = toDate ? format(toDate, "yyyy-MM-dd") : undefined;

      const res = await homestayService.getBookings({
        page: meta.page,
        size: meta.size,
        keyword: debouncedKeyword,
        status,
        fromDate: formattedFromDate,
        toDate: formattedToDate,
      });
      setBookings(res.content);
      setMeta((prev) => ({
        ...prev,
        totalElements: res.totalElements,
        totalPages: res.totalPages,
        page: res.number,
      }));
    } catch (error: any) {
      if (error?.message === "FORBIDDEN" || error?.status === 403) {
          setIsPermissionDenied(true);
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [debouncedKeyword, status, fromDate, toDate, meta.page, meta.size]);

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.size, status, fromDate, toDate, debouncedKeyword]);

  const handleClearFilters = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setStatus("");
    setFromDate(null);
    setToDate(null);
    setMeta((prev) => ({ ...prev, page: 0 }));
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
          <span key={`ellipsis-${index}`} className="mb-1 self-end px-2 text-gray-400">...</span>
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt phòng</h1>
            <p className="text-sm text-gray-500">Theo dõi và xử lý các đơn đặt phòng Homestay</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-600 hover:bg-gray-50"
          >
            <RefreshCcw size={16} /> Làm mới
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-12">
          {/* Keyword */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm tên, số điện thoại, email..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {keyword && (
              <button
                onClick={() => { setKeyword(""); setDebouncedKeyword(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status */}
          <div className="relative md:col-span-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as HomestayBookingStatus); setMeta((p) => ({ ...p, page: 0 })); }}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CHECKED_IN">Đã nhận phòng</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="NO_SHOW">Vắng mặt</option>
            </select>
            <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Date Range */}
          <div className="relative z-10 md:col-span-2">
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400">
                <span className="text-xs font-semibold">Từ:</span>
            </div>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              dateFormat="dd/MM/yyyy"
              locale="vi"
              placeholderText="Chọn ngày"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              wrapperClassName="w-full"
            />
          </div>
          <div className="relative z-10 md:col-span-2">
            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400">
                <span className="text-xs font-semibold">Đến:</span>
            </div>
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              dateFormat="dd/MM/yyyy"
              locale="vi"
              placeholderText="Chọn ngày"
              minDate={fromDate || undefined}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 pl-11 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              wrapperClassName="w-full"
            />
          </div>

          {/* Clear Filter */}
          <div className="md:col-span-2">
            <button
              onClick={handleClearFilters}
              className="h-10 w-full rounded-lg border border-gray-300 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Xóa bộ lọc
            </button>
          </div>
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
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="w-20 px-6 py-4 text-center">Mã</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4">Phòng</th>
                    <th className="px-6 py-4">Thời gian lưu trú</th>
                    <th className="w-40 px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Tổng tiền</th>
                    <th className="w-36 px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center italic text-gray-500">Không tìm thấy đơn đặt phòng nào</td>
                    </tr>
                  ) : (
                    bookings.map((item) => (
                      <tr key={item.bookingId} className="group transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 text-center font-medium text-gray-600">#{item.bookingId}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{item.customerName}</div>
                          <div className="text-xs text-gray-500">{item.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-blue-600">{item.roomNumber || "Chưa xếp"}</div>
                          <div className="mt-1 w-fit rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{item.roomClassName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-medium text-gray-800">
                            {formatDate(item.checkInDate)} - {formatDate(item.checkOutDate)}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-400">Tạo: {formatDateTime(item.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(item.totalAmount)}</td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            to={`/admin/homestay-booking/${item.bookingId}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </Link>
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
                Hiển thị <span className="font-semibold text-gray-900">{startRecord} - {endRecord}</span> dữ liệu trên tổng <span className="font-bold text-gray-900">{meta.totalElements}</span> đơn
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={meta.page === 0}
                  onClick={() => setMeta((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPaginationButtons()}
                <button
                  disabled={meta.page >= meta.totalPages - 1}
                  onClick={() => setMeta((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <PermissionDeniedModal isOpen={isPermissionDenied} onClose={() => setIsPermissionDenied(false)} />
    </div>
  );
};

export default HomestayBookingList;