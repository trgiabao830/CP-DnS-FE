import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  FileText,
  Loader2,
  MapPin,
} from "lucide-react";
import { homestayBookingService } from "../../services/client/homestay-booking.service";
import type {
  HomestayBookingSummaryResponse,
  HomestayBookingStatus,
} from "../../types/client/homestay-booking";
import { format } from "date-fns";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

const StatusBadge = ({ status }: { status: HomestayBookingStatus }) => {
  const styles: Record<HomestayBookingStatus, string> = {
    PENDING: "text-orange-700",
    CONFIRMED: "text-green-700",
    CHECKED_IN: "text-blue-700",
    COMPLETED: "text-gray-700",
    CANCELLED: "text-red-700",
    NO_SHOW: "text-gray-700",
  };

  const labels: Record<HomestayBookingStatus, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    CHECKED_IN: "Đã nhận phòng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Vắng mặt",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-bold ${styles[status]}`}
    >
      {labels[status] || status}
    </span>
  );
};

const HomestayHistoryPage = () => {
  const [bookings, setBookings] = useState<HomestayBookingSummaryResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HomestayBookingStatus | "">("");

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
      const data = await homestayBookingService.getMyBookings(
        activeTab,
        meta.page,
        meta.size,
      );
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

  const tabs: { label: string; value: HomestayBookingStatus | "" }[] = [
    { label: "Tất cả", value: "" },
    { label: "Chờ xác nhận", value: "PENDING" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đã nhận phòng", value: "CHECKED_IN" },
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
          <span
            key={`ellipsis-${index}`}
            className="mb-1 self-end px-2 text-gray-400"
          >
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
              ? "border border-blue-600 bg-blue-600 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {pageNum + 1}
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 pb-24">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Lịch sử đặt phòng
            </h1>
            <p className="text-sm text-slate-500">
              Quản lý và theo dõi các đơn đặt phòng của bạn
            </p>
          </div>
          <Link
            to="/homestay/booking"
            className="hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 sm:block"
          >
            + Đặt phòng mới
          </Link>
        </div>

        {/* Tabs */}
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
                    ? "bg-slate-800 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16">
            <FileText size={48} className="mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-800">
              Chưa có đơn đặt phòng nào
            </h3>
            <Link
              to="/homestay/booking"
              className="mt-4 font-bold text-blue-600 hover:underline"
            >
              Đặt phòng ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md sm:flex-row"
              >
                {/* Image */}
                <div className="h-40 w-full shrink-0 bg-slate-100 sm:w-48">
                  <img
                    src={
                      booking.roomImage ||
                      "https://via.placeholder.com/300?text=Homestay"
                    }
                    alt={booking.roomName}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-800">
                        {booking.roomName}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  <div className="my-3 grid grid-cols-2 gap-4 border-y border-slate-50 py-3 text-sm">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                        Nhận phòng
                      </p>
                      <p className="flex items-center gap-2 font-medium text-slate-700">
                        {format(new Date(booking.checkInDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-slate-400">
                        Trả phòng
                      </p>
                      <p className="flex items-center gap-2 font-medium text-slate-700">
                        {format(new Date(booking.checkOutDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-slate-400">Tổng thanh toán</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                    <Link
                      to={`/homestay/booking/tracking?code=${booking.accessToken}`}
                      className="flex items-center gap-1 rounded-lg bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Chi tiết <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Footer Pagination Mới (Card Style - Đồng bộ Restaurant) */}
        {!loading && meta.totalElements > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm sm:flex-row">
            {/* Thông tin số lượng bản ghi */}
            <span className="text-center text-sm text-slate-500 sm:text-left">
              Hiển thị{" "}
              <span className="font-semibold text-slate-900">
                {startRecord} - {endRecord}
              </span>{" "}
              dữ liệu trên tổng{" "}
              <span className="font-bold text-slate-900">
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>

              {renderPaginationButtons()}

              <button
                disabled={meta.page >= meta.totalPages - 1}
                onClick={() =>
                  setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
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

export default HomestayHistoryPage;
