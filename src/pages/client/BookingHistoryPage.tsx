import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft, 
  FileText,
  Loader2,
} from "lucide-react";
import { bookingService } from "../../services/client/booking.service";
import type { BookingSummary, BookingStatus } from "../../types/client/booking";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const styles: Record<BookingStatus, string> = {
    PENDING: "text-orange-700",
    CONFIRMED: "text-green-700",
    SERVING: "text-purple-700",
    COMPLETED: "text-blue-700",
    CANCELLED: "text-red-700",
    NO_SHOW: "text-gray-700",
  };

  const labels: Record<BookingStatus, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    SERVING: "Đang phục vụ",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Khách không đến",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold ${styles[status]}`}>
      {labels[status] || status}
    </span>
  );
};

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingStatus | "">("");

  const [meta, setMeta] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchBookings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab, meta.page]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookings(activeTab, meta.page, meta.size);
      setBookings(data.content);
      
      setMeta((prev) => ({
        ...prev,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        page: data.number, 
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { label: string; value: BookingStatus | "" }[] = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xác nhận", value: "PENDING" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đang phục vụ", value: "SERVING" },
    { label: "Hoàn thành", value: "COMPLETED" },
    { label: "Đã hủy", value: "CANCELLED" },
    { label: "Vắng", value: "NO_SHOW" },
  ];

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

    return pages.map((pageItem, index) => {
      if (pageItem === "...")
        return (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-400 self-end mb-1">
            ...
          </span>
        );
        
      const pageNum = pageItem as number;
      return (
        <button
          key={pageNum}
          onClick={() => setMeta((prev) => ({ ...prev, page: pageNum }))}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            currentPage === pageNum
              ? "border border-cyan-500 bg-cyan-500 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {pageNum + 1}
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 pb-24">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lịch sử đặt bàn</h1>
            <p className="text-sm text-gray-500">
              Quản lý và theo dõi các đơn đặt bàn của bạn
            </p>
          </div>
          <Link
            to="/restaurant/booking"
            className="hidden rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-200 transition-all hover:bg-cyan-600 sm:block"
          >
            + Đặt bàn mới
          </Link>
        </div>

        {/* Tabs Filter */}
        <div className="scrollbar-hide mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setActiveTab(tab.value);
                  setMeta((prev) => ({ ...prev, page: 0 }));
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.value
                    ? "bg-gray-800 text-white shadow-md"
                    : "border border-gray-100 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách Booking */}
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="animate-spin text-cyan-500" size={40} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-16 shadow-sm">
            <div className="mb-4 rounded-full bg-gray-50 p-6">
              <FileText size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Không tìm thấy đơn đặt bàn
            </h3>
            <p className="text-gray-500">
              Bạn chưa có đơn đặt bàn nào ở trạng thái này.
            </p>
            <Link
              to="/restaurant/booking"
              className="mt-6 font-bold text-cyan-600 hover:underline"
            >
              Đặt bàn ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                {/* ID & Status */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-gray-400">
                      Mã đơn: #{booking.bookingId}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-gray-800">
                      {booking.bookingTime}
                    </h3>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Thông tin chi tiết */}
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">
                      Số lượng khách
                    </label>
                    <div className="mt-1 flex items-center gap-2 font-medium text-gray-800">
                      {booking.numberOfGuests} khách
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">
                      Tạo đơn lúc
                    </label>
                    <div className="mt-1 flex items-center gap-2 font-medium text-gray-800">
                      {booking.createdAt}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">
                      Tổng tiền
                    </label>
                    <div className="mt-1 flex items-center gap-2 font-medium text-gray-800">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500">
                      Cọc trước
                    </label>
                    <div className="mt-1 flex items-center gap-2 font-medium text-gray-800">
                      {formatCurrency(booking.depositAmount)}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-gray-50 pt-4">
                  <Link
                    to={`/restaurant/booking/tracking?code=${booking.accessToken}`}
                    className="flex items-center justify-center gap-2 rounded-lg bg-gray-50 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Xem chi tiết <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 👇 4. Footer Pagination Mới (Card Style) */}
        {!loading && meta.totalElements > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm sm:flex-row">
            
            {/* Thông tin số lượng bản ghi */}
            <span className="text-sm text-gray-500 text-center sm:text-left">
              Hiển thị{" "}
              <span className="font-semibold text-gray-900">
                {startRecord} - {endRecord}
              </span>{" "}
              dữ liệu trên tổng{" "}
              <span className="font-bold text-gray-900">
                {meta.totalElements}
              </span>{" "}
              đơn
            </span>

            {/* Các nút điều hướng */}
            <div className="flex items-center gap-1">
              <button
                disabled={meta.page === 0}
                onClick={() =>
                  setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              {renderPaginationButtons()}
              
              <button
                disabled={meta.page >= meta.totalPages - 1}
                onClick={() =>
                  setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;