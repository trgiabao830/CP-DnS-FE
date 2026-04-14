import React, { useEffect, useState } from "react";
import {
  RefreshCcw,
  Users,
  Clock,
  Search,
  AlertCircle,
  Ban,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
} from "lucide-react";
import { posService } from "../../services/admin/pos.service";
import type {
  AreaSnapshot,
  TableSnapshot,
  ShortBooking,
} from "../../types/admin/restaurant-pos";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../components/Modal";

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã đặt trước",
    SERVING: "Đang phục vụ",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Khách vắng",
  };
  return labels[status] || status;
};

interface BookingWithTable extends ShortBooking {
  tableNumber: string;
}

const TableCard = ({
  table,
  onClick,
  currentTime,
}: {
  table: TableSnapshot;
  onClick: (t: TableSnapshot) => void;
  currentTime: Date;
}) => {
  const isUnavailable = table.currentStatus === "UNAVAILABLE";

  const upcomingBooking =
    table.currentStatus === "AVAILABLE"
      ? table.todayBookings.find((b) => {
          if (b.status !== "CONFIRMED") return false;
          const bookingTime = new Date(b.bookingTime).getTime();
          const now = currentTime.getTime();
          const diffMinutes = (bookingTime - now) / 60000;
          return diffMinutes > 0 && diffMinutes <= 30;
        })
      : null;

  const styles = (() => {
    if (isUnavailable) {
      return {
        displayStatus: "UNAVAILABLE",
        bgColor: "bg-gray-100 opacity-70",
        borderColor: "border-gray-300",
        textColor: "text-gray-400",
        cursorClass: "cursor-not-allowed",
      };
    }
    if (table.currentStatus === "SERVING") {
      return {
        displayStatus: "SERVING",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        cursorClass: "cursor-pointer hover:shadow-md",
      };
    }
    if (upcomingBooking) {
      return {
        displayStatus: "UPCOMING",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-300 ring-1 ring-orange-200",
        textColor: "text-orange-800",
        cursorClass: "cursor-pointer hover:shadow-md",
      };
    }
    if (table.currentStatus === "RESERVED") {
      return {
        displayStatus: "RESERVED",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
        cursorClass: "cursor-pointer hover:shadow-md",
      };
    }
    return {
      displayStatus: table.currentStatus,
      bgColor: "bg-white hover:border-blue-400",
      borderColor: "border-gray-200",
      textColor: "text-gray-700",
      cursorClass: "cursor-pointer hover:shadow-md",
    };
  })();

  return (
    <div
      onClick={() => {
        if (!isUnavailable) onClick(table);
      }}
      className={`relative rounded-xl border-2 p-4 shadow-sm transition-all duration-200 ${styles.bgColor} ${styles.borderColor} ${styles.textColor} ${styles.cursorClass}`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 className="break-words text-lg font-bold">{table.tableNumber}</h3>
        <span className="flex shrink-0 items-center whitespace-nowrap rounded-full bg-black/5 px-2 py-1 text-xs font-medium">
          <Users size={12} className="mr-1" /> {table.capacity}
        </span>
      </div>

      <div className="min-h-[45px]">
        {isUnavailable ? (
          <div className="flex flex-col items-center justify-center pt-1 text-xs font-medium text-gray-400">
            <Ban size={20} className="mb-1 opacity-50" />
            <span>Tạm ngưng</span>
          </div>
        ) : styles.displayStatus === "SERVING" && table.currentBooking ? (
          <div className="text-sm">
            <div className="truncate font-semibold">
              {table.currentBooking.customerName}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs opacity-80">
              <Clock size={12} />
              {new Date(table.currentBooking.bookingTime).toLocaleTimeString(
                "vi-VN",
                { hour: "2-digit", minute: "2-digit" },
              )}
            </div>
            <div className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
              Đang ăn
            </div>
          </div>
        ) : styles.displayStatus === "UPCOMING" && upcomingBooking ? (
          <div className="text-sm">
            <div className="flex items-center gap-1 truncate font-bold">
              <AlertCircle size={14} /> {upcomingBooking.customerName}
            </div>
            <div className="mt-1 text-xs font-medium">
              Đến lúc:{" "}
              {new Date(upcomingBooking.bookingTime).toLocaleTimeString(
                "vi-VN",
                { hour: "2-digit", minute: "2-digit" },
              )}
            </div>
            <div className="mt-1 inline-block rounded bg-orange-200 px-1.5 py-0.5 text-[10px] font-bold text-orange-800">
              Sắp đến
            </div>
          </div>
        ) : styles.displayStatus === "RESERVED" ? (
          <div className="text-xs italic opacity-80">
            {table.todayBookings.length} đơn đặt hôm nay
          </div>
        ) : (
          <div className="mt-2 text-center text-xs text-gray-400">Trống</div>
        )}
      </div>
    </div>
  );
};

const BookingItem = ({
  booking,
  onClick,
}: {
  booking: BookingWithTable;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="group cursor-pointer border-b border-gray-100 p-3 transition-colors last:border-0 hover:bg-blue-50"
  >
    <div className="mb-1 flex items-start justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-800 transition-colors group-hover:text-blue-700">
          {booking.customerName}
        </span>
        <span className="mt-0.5 text-xs font-bold text-blue-600">
          Bàn: {booking.tableNumber}
        </span>
      </div>

      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
          booking.status === "CONFIRMED"
            ? "border-blue-100 bg-blue-50 text-blue-600"
            : booking.status === "SERVING"
              ? "border-red-100 bg-red-50 text-red-600"
              : booking.status === "COMPLETED"
                ? "border-green-100 bg-green-50 text-green-600"
                : "border-gray-200 bg-gray-100 text-gray-500"
        }`}
      >
        {getStatusLabel(booking.status)}
      </span>
    </div>
    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <Clock size={12} />{" "}
        {new Date(booking.bookingTime).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <span className="flex items-center gap-1">
        <Users size={12} /> {booking.numberOfGuests} khách
      </span>
    </div>
  </div>
);

const RestaurantOverview = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<number | "ALL">("ALL");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [walkInConfirmTable, setWalkInConfirmTable] = useState<{
    id: number;
    number: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await posService.getOverview();
      setAreas(res.areas);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu nhà hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const eventSource = new EventSource("/api/admin/restaurant/sse/subscribe");
    eventSource.addEventListener("RESTAURANT_TABLE_UPDATE", () => fetchData());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      eventSource.close();
      clearInterval(timer);
    };
  }, []);

  const filteredAreas =
    selectedAreaId === "ALL"
      ? areas
      : areas.filter((a) => a.areaId === selectedAreaId);

  const allTodayBookings: BookingWithTable[] = areas
    .flatMap((area) =>
      area.tables.flatMap((t) =>
        t.todayBookings.map((b) => ({
          ...b,
          tableNumber: t.tableNumber,
        })),
      ),
    )
    .sort(
      (a, b) =>
        new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime(),
    );

  const filteredBookings = allTodayBookings.filter((booking) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const matchName = booking.customerName?.toLowerCase().includes(term);
    const matchTable = booking.tableNumber?.toLowerCase().includes(term);
    return matchName || matchTable;
  });

  const handleTableClick = (table: TableSnapshot) => {
    if (table.currentStatus === "UNAVAILABLE") return;

    if (table.currentStatus === "SERVING" && table.currentBooking) {
      navigate(`/admin/booking/${table.currentBooking.bookingId}`);
      return;
    }

    if (table.currentStatus === "AVAILABLE") {
      setWalkInConfirmTable({
        id: table.tableId,
        number: table.tableNumber,
      });
    } else if (table.currentStatus === "RESERVED") {
      const firstBooking = table.todayBookings.find(
        (b) => b.status === "CONFIRMED",
      );
      if (firstBooking) {
        navigate(`/admin/booking/${firstBooking.bookingId}`);
      }
    }
  };

  const handleCreateWalkIn = async () => {
    if (!walkInConfirmTable) return;
    try {
      const res = await posService.createWalkInBooking({
        tableId: walkInConfirmTable.id,
        customerName: "Khách vãng lai",
      });
      toast.success("Đã mở bàn thành công!");
      setWalkInConfirmTable(null);
      navigate(`/admin/booking/${res.bookingId}`);
    } catch (error: any) {
      toast.error(error.message || "Lỗi mở bàn");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
      {/* --- LEFT COLUMN: MAP --- */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-gray-200">
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedAreaId("ALL")}
              className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${selectedAreaId === "ALL" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Tất cả khu vực
            </button>
            {areas.map((area) => (
              <button
                key={area.areaId}
                onClick={() => setSelectedAreaId(area.areaId)}
                className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${selectedAreaId === area.areaId ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {area.areaName}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            title="Làm mới"
          >
            <RefreshCcw size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <span>Đang tải sơ đồ...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredAreas.map((area) => (
                <div key={area.areaId}>
                  <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-700">
                    {area.areaName}
                  </h2>
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                    }}
                  >
                    {area.tables.map((table) => (
                      <TableCard
                        key={table.tableId}
                        table={table}
                        onClick={handleTableClick}
                        currentTime={currentTime}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex h-10 items-center gap-4 border-t border-gray-200 bg-white px-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm border border-gray-300 bg-white"></div> Trống
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm border border-red-300 bg-red-50"></div> Đang phục vụ
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm border border-orange-300 bg-orange-100"></div> Sắp có khách (30p)
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm border border-gray-300 bg-gray-200"></div> Tạm ngưng
          </div>
        </div>
      </div>

      {/* --- RIGHT COLUMN --- */}
      <div className="relative flex h-full">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-3 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md hover:bg-gray-50 hover:text-blue-600 focus:outline-none"
          title={isSidebarOpen ? "Thu gọn danh sách" : "Mở rộng danh sách"}
        >
          {isSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div
          className={`flex flex-col border-l border-gray-200 bg-white shadow-xl transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-80 translate-x-0" : "w-0 translate-x-full"
          } overflow-hidden`}
        >
          <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4">
            <h3 className="flex items-center gap-2 whitespace-nowrap font-bold text-gray-800">
              Đơn hôm nay
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              {allTodayBookings.length}
            </span>
          </div>

          <div className="flex-shrink-0 border-b border-gray-100 p-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm tên hoặc số bàn..."
                className="w-full rounded-lg bg-gray-100 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto">
            {filteredBookings.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-sm text-gray-400">
                <Clock size={24} className="mb-2 opacity-50" />
                <span className="whitespace-nowrap">
                  {searchTerm ? "Không tìm thấy đơn nào" : "Chưa có đơn đặt nào"}
                </span>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <BookingItem
                  key={booking.bookingId}
                  booking={booking}
                  onClick={() => navigate(`/admin/booking/${booking.bookingId}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 👇 THÊM MODAL XÁC NHẬN WALKIN VÀO ĐÂY */}
      {walkInConfirmTable && (
        <Modal
          isOpen={!!walkInConfirmTable}
          onClose={() => setWalkInConfirmTable(null)}
          title="Xác nhận mở bàn"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <HelpCircle size={28} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              Mở bàn {walkInConfirmTable.number}?
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Hệ thống sẽ tạo một đơn hàng mới (Khách vãng lai) cho bàn này. 
              Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setWalkInConfirmTable(null)}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreateWalkIn}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default RestaurantOverview;