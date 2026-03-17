import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCcw,
  Users,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  Phone,
  User,
  ArrowRight,
  Check,
} from "lucide-react";
import { homestayPosService } from "../../services/admin/homestay-pos.service";
import type {
  HomestayOverviewResponse,
  RoomSnapshot,
  CreateHomestayWalkInRequest,
} from "../../types/admin/homestay-pos";
import type { AdminAvailableRoomGroupResponse } from "../../types/admin/homestay-booking";
import { format, addDays, parseISO, differenceInCalendarDays } from "date-fns";
import { vi } from "date-fns/locale";
import Modal from "../../components/Modal";
import { toast } from "react-toastify";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("vi", vi);

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val,
  );

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã đặt",
    CHECKED_IN: "Đã nhận",
    OCCUPIED: "Đang ở",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Vắng mặt",
  };
  return labels[status] || status;
};

const RoomCard = ({
  room,
  price,
  onClick,
}: {
  room: RoomSnapshot;
  price: number;
  onClick: (r: RoomSnapshot) => void;
}) => {
  const getStyle = () => {
    switch (room.status) {
      case "OCCUPIED":
        return {
          bg: "bg-red-50 hover:bg-red-100 cursor-pointer",
          border: "border-red-200",
          text: "text-red-700",
          label: "Đang ở",
          badgeColor: "bg-red-100 text-red-700",
          subText: "text-red-600",
        };
      case "BOOKED":
        return {
          bg: "bg-blue-50 hover:bg-blue-100 cursor-pointer",
          border: "border-blue-200",
          text: "text-blue-700",
          label: "Đã đặt",
          badgeColor: "bg-blue-100 text-blue-700",
          subText: "text-blue-600",
        };
      case "UNAVAILABLE":
        return {
          bg: "bg-gray-100 opacity-80 cursor-not-allowed",
          border: "border-gray-300",
          text: "text-gray-500",
          label: "Tạm ngưng",
          badgeColor: "bg-gray-200 text-gray-500",
          subText: "text-gray-400",
        };
      default:
        return {
          bg: "bg-white",
          border: "border-gray-200",
          text: "text-gray-700",
          label: "Trống",
          badgeColor: "bg-green-50 text-green-700 border border-green-100",
          subText: "text-gray-500",
        };
    }
  };

  const style = getStyle();

  const customerName = (room as any).currentCustomerName;
  const customerPhone = (room as any).currentCustomerPhone;
  const checkInDate = (room as any).checkInDate;
  const checkOutDate = (room as any).checkOutDate;

  return (
    <div
      onClick={() => {
        if (room.status !== "AVAILABLE" && room.status !== "UNAVAILABLE") {
          onClick(room);
        }
      }}
      className={`relative flex h-full min-h-[120px] w-full flex-col justify-between rounded-xl border-2 p-4 transition-all duration-200 ${style.bg} ${style.border}`}
    >
      {/* Header: Số phòng + Badge */}
      <div className="flex items-start justify-between gap-2">
        <h4 className={`text-xl font-bold ${style.text}`}>{room.roomNumber}</h4>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badgeColor}`}
        >
          {style.label}
        </span>
      </div>

      {/* Body: Thông tin khách & Ngày tháng */}
      <div className="flex-1 pt-3">
        {room.status === "OCCUPIED" || room.status === "BOOKED" ? (
          <div className="flex flex-col space-y-1.5">
            {/* 1. Tên khách */}
            <div className="flex items-start gap-2">
              <User size={14} className={`mt-0.5 shrink-0 ${style.subText}`} />
              <span
                className={`line-clamp-2 break-words text-sm font-semibold leading-tight ${style.subText}`}
                title={customerName}
              >
                {customerName}
              </span>
            </div>

            {/* 2. Ngày Check-in - Check-out (MỚI THÊM) */}
            {checkInDate && checkOutDate && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className={`shrink-0 ${style.subText}`} />
                <span className={`text-xs font-medium ${style.subText}`}>
                  {format(parseISO(checkInDate), "dd/MM")} -{" "}
                  {format(parseISO(checkOutDate), "dd/MM")}
                </span>
              </div>
            )}

            {/* 3. Số điện thoại */}
            {customerPhone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className={`shrink-0 ${style.subText}`} />
                <span className={`text-[10px] ${style.subText}`}>
                  {customerPhone}
                </span>
              </div>
            )}
          </div>
        ) : room.status === "AVAILABLE" ? (
          <div className="flex h-full items-center justify-center text-[10px] font-medium italic text-gray-400">
            Sẵn sàng đón khách
          </div>
        ) : null}
      </div>
    </div>
  );
};

const WalkInWizardModal = ({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHomestayWalkInRequest) => void;
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<
    AdminAvailableRoomGroupResponse[]
  >([]);

  const [searchParams, setSearchParams] = useState<{
    checkInDate: Date | null;
    checkOutDate: Date | null;
  }>({
    checkInDate: new Date(),
    checkOutDate: addDays(new Date(), 1),
  });

  const [selectedRoom, setSelectedRoom] = useState<{
    id: number;
    number: string;
    typeName: string;
    price: number;
  } | null>(null);

  const [customerInfo, setCustomerInfo] = useState({
    name: "Khách vãng lai",
    phone: "",
    adults: 2,
    children: 0,
  });

  const bookingSummary = useMemo(() => {
    if (
      !searchParams.checkInDate ||
      !searchParams.checkOutDate ||
      !selectedRoom
    ) {
      return { nights: 0, total: 0 };
    }
    const nights = differenceInCalendarDays(
      searchParams.checkOutDate,
      searchParams.checkInDate,
    );
    const actualNights = nights > 0 ? nights : 1;
    return {
      nights: actualNights,
      total: selectedRoom.price * actualNights,
    };
  }, [searchParams, selectedRoom]);

  const handleSearch = async () => {
    if (!searchParams.checkInDate || !searchParams.checkOutDate) {
      toast.warn("Vui lòng chọn ngày nhận và trả phòng");
      return;
    }
    setLoadingRooms(true);
    try {
      const res = await homestayPosService.searchAvailableRooms(
        format(searchParams.checkInDate, "yyyy-MM-dd"),
        format(searchParams.checkOutDate, "yyyy-MM-dd"),
      );
      setAvailableGroups(res);
      setSelectedRoom(null);
    } catch (e) {
      toast.error("Lỗi tải danh sách phòng");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen && step === 1) {
      handleSearch();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (
      !selectedRoom ||
      !searchParams.checkInDate ||
      !searchParams.checkOutDate
    )
      return;
    onSubmit({
      roomId: selectedRoom.id,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      checkInDate: format(searchParams.checkInDate, "yyyy-MM-dd"),
      checkOutDate: format(searchParams.checkOutDate, "yyyy-MM-dd"),
      numberOfAdults: customerInfo.adults,
      numberOfChildren: customerInfo.children,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Chọn phòng trống" : "Thông tin khách hàng"}
      size="4xl"
    >
      <div className="flex h-[70vh] flex-col">
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 gap-4 border-b border-gray-200 bg-gray-50 p-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Ngày nhận
                </label>
                <DatePicker
                  selected={searchParams.checkInDate}
                  onChange={(date) => {
                    const newCheckIn = date || new Date();
                    setSearchParams({
                      checkInDate: newCheckIn,
                      checkOutDate: addDays(newCheckIn, 1),
                    });
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="vi"
                  minDate={new Date()}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Ngày trả
                </label>
                <DatePicker
                  selected={searchParams.checkOutDate}
                  onChange={(date) =>
                    setSearchParams({ ...searchParams, checkOutDate: date })
                  }
                  dateFormat="dd/MM/yyyy"
                  locale="vi"
                  minDate={
                    searchParams.checkInDate
                      ? addDays(searchParams.checkInDate, 1)
                      : new Date()
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  wrapperClassName="w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                  <Search size={16} /> Tìm phòng
                </button>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto bg-white p-6">
              {loadingRooms ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-400">
                  <p>
                    Không tìm thấy phòng trống nào trong khoảng thời gian này.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {availableGroups.map((group) => (
                    <div key={group.classId}>
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                        <span className="h-6 w-1 rounded-full bg-blue-600"></span>
                        {group.className}
                      </h3>
                      <div className="grid gap-4">
                        {group.roomTypes.map((type) => (
                          <div
                            key={type.typeId}
                            className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
                          >
                            <div className="mb-3 flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                              {/* 👇 Thêm min-w-0 flex-1 để text tự xuống dòng trong giới hạn */}
                              <div className="min-w-0 flex-1">
                                <h4 className="break-words text-lg font-bold text-gray-800">
                                  {type.typeName}
                                </h4>
                                <span className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                  <Users size={14} /> {type.maxAdults} người
                                  lớn, {type.maxChildren} trẻ em
                                </span>
                              </div>

                              {/* 👇 Thêm shrink-0 để giá tiền luôn giữ nguyên kích thước, không bị ép */}
                              <div className="shrink-0 text-right">
                                <span className="block text-lg font-bold text-blue-600">
                                  {formatCurrency(type.pricePerNight)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  / đêm
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                              {type.rooms.map((room) => (
                                <button
                                  key={room.roomId}
                                  onClick={() =>
                                    setSelectedRoom({
                                      id: room.roomId,
                                      number: room.roomNumber,
                                      typeName: type.typeName,
                                      price: type.pricePerNight,
                                    })
                                  }
                                  className={`relative rounded-lg border px-1 py-2 text-sm font-medium transition-all ${
                                    selectedRoom?.id === room.roomId
                                      ? "border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-200"
                                      : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600"
                                  }`}
                                >
                                  <span className="block w-full truncate px-1">
                                    {room.roomNumber}
                                  </span>
                                  {selectedRoom?.id === room.roomId && (
                                    <div className="absolute -right-2 -top-2 rounded-full border border-blue-100 bg-white p-0.5 text-blue-600 shadow-sm">
                                      <Check size={12} />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white p-4">
              <div className="text-sm">
                {selectedRoom ? (
                  <span className="font-medium text-blue-700">
                    Đang chọn:{" "}
                    <b className="ml-1 mr-1 text-lg">{selectedRoom.number}</b> (
                    {selectedRoom.typeName})
                  </span>
                ) : (
                  <span className="italic text-gray-500">
                    Vui lòng chọn 1 phòng để tiếp tục
                  </span>
                )}
              </div>
              <button
                disabled={!selectedRoom}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tiếp tục <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
              <div className="mx-auto max-w-xl space-y-6">
                <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                    Thông tin đặt phòng
                  </h3>
                  <div className="mb-4 grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
                        Phòng
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {selectedRoom?.number}
                      </span>
                      <span className="mt-1 block text-gray-600">
                        {selectedRoom?.typeName}
                      </span>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
                        Thời gian
                      </span>
                      <div className="font-medium text-gray-800">
                        Check-in:{" "}
                        {searchParams.checkInDate &&
                          format(searchParams.checkInDate, "dd/MM/yyyy", {
                            locale: vi,
                          })}
                      </div>
                      <div className="font-medium text-gray-800">
                        Check-out:{" "}
                        {searchParams.checkOutDate &&
                          format(searchParams.checkOutDate, "dd/MM/yyyy", {
                            locale: vi,
                          })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between rounded-lg border-t border-blue-100 bg-blue-50/50 p-3 pt-3">
                    <div>
                      <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
                        Tạm tính
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(selectedRoom?.price || 0)} x{" "}
                        {bookingSummary.nights} đêm
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold leading-none text-blue-700">
                        {formatCurrency(bookingSummary.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="border-b border-gray-100 pb-3 text-lg font-bold text-gray-800">
                    Thông tin khách hàng
                  </h3>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Họ tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-blue-500"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nhập tên khách"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-blue-500"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Để trống nếu không có"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Người lớn
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-blue-500"
                        value={customerInfo.adults}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            adults: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Trẻ em
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-blue-500"
                        value={customerInfo.children}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            children: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white p-4">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-green-600 px-8 py-2.5 font-bold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
              >
                Xác nhận & Tạo đơn
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const HomestayPosPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<HomestayOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | "ALL">("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await homestayPosService.getOverview();
      setData(res);
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải dữ liệu homestay");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const eventSource = new EventSource("/api/admin/homestay/sse/subscribe");
    eventSource.addEventListener("HOMESTAY_ROOM_UPDATE", () => fetchData());
    eventSource.addEventListener("HOMESTAY_BOOKING_UPDATE", () => fetchData());

    return () => {
      eventSource.close();
    };
  }, []);

  const handleRoomClick = (room: RoomSnapshot) => {
    if (room.status === "OCCUPIED" && room.currentBookingId) {
      navigate(`/admin/homestay-booking/${room.currentBookingId}`);
    } else if (room.status === "BOOKED" && room.currentBookingId) {
      navigate(`/admin/homestay-booking/${room.currentBookingId}`);
    } else if (room.status === "AVAILABLE") {
    } else {
      toast.warning("Phòng đang bảo trì hoặc chưa dọn dẹp.");
    }
  };

  const handleWalkInSubmit = async (req: CreateHomestayWalkInRequest) => {
    try {
      const res = await homestayPosService.createWalkIn(req);
      toast.success(res.message);
      setWalkInModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredClasses = useMemo(() => {
    if (!data) return [];
    if (selectedClassId === "ALL") return data.roomMap;
    return data.roomMap.filter((c) => c.classId === selectedClassId);
  }, [data, selectedClassId]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  if (!data) return <div className="p-10 text-center">Không có dữ liệu</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
      {/* LEFT: ROOM PLAN */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-gray-200">
        {/* Header Filters & Actions */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="no-scrollbar mr-4 flex flex-1 gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedClassId("ALL")}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${selectedClassId === "ALL" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Tất cả
            </button>
            {data.roomMap.map((cls) => (
              <button
                key={cls.classId}
                onClick={() => setSelectedClassId(cls.classId)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${selectedClassId === cls.classId ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {cls.className}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="rounded-lg border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50"
              title="Làm mới"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={() => setWalkInModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
            >
              <Plus size={20} />
              <span>Tạo đơn vãng lai</span>
            </button>
          </div>
        </div>

        {/* Room Grid */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <div className="space-y-10">
            {filteredClasses.map((cls) => (
              <div key={cls.classId}>
                <h2 className="mb-4 flex items-center gap-3 pl-1 text-xl font-bold text-gray-800">
                  <span className="h-6 w-1.5 rounded-full bg-blue-600"></span>
                  {cls.className}
                </h2>

                <div className="space-y-6">
                  {cls.roomTypes.map((type) => (
                    <div
                      key={type.typeId}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="text-lg font-bold text-gray-700">
                          {type.typeName}
                        </h3>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
                          {formatCurrency(type.pricePerNight)}
                        </span>
                      </div>

                      {/* 👇 GRID OPTIMIZATION: minmax(160px, 1fr) */}
                      <div
                        className="grid gap-5"
                        style={{
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(160px, 1fr))",
                        }}
                      >
                        {type.rooms.map((room) => (
                          <RoomCard
                            key={room.roomId}
                            room={room}
                            price={type.pricePerNight}
                            onClick={handleRoomClick}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex h-10 items-center gap-6 border-t border-gray-200 bg-white px-6 text-xs font-medium text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm border border-gray-200 bg-white shadow-sm"></div>{" "}
            Trống
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm border border-blue-200 bg-blue-50 shadow-sm"></div>{" "}
            Đã đặt
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm border border-red-200 bg-red-50 shadow-sm"></div>{" "}
            Đang ở
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm border border-gray-300 bg-gray-100 shadow-sm"></div>{" "}
            Tạm ngưng
          </div>
        </div>
      </div>

      {/* RIGHT: SIDEBAR */}
      <div className="relative flex h-full">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-all duration-300 hover:bg-gray-50 hover:text-blue-600 focus:outline-none ${
            isSidebarOpen ? "-left-3" : "-left-3"
          }`}
        >
          {isSidebarOpen ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>

        <div
          className={`relative h-full border-l border-gray-200 bg-white shadow-xl transition-all duration-300 ${
            isSidebarOpen ? "w-80" : "w-0"
          }`}
        >
          <div className="flex h-full w-80 flex-col overflow-hidden">
            <div className="flex h-16 items-center border-b border-gray-200 bg-gray-50 px-5 font-bold text-gray-800">
              Hoạt động hôm nay ({format(new Date(), "dd/MM", { locale: vi })})
            </div>

            <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-4">
              {/* ARRIVALS */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                  Khách đến ({data.arrivingToday.length})
                </h4>
                {data.arrivingToday.length === 0 ? (
                  <p className="py-2 text-center text-sm italic text-gray-400">
                    Không có khách đến
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.arrivingToday.map((b) => (
                      <div
                        key={b.bookingId}
                        onClick={() =>
                          navigate(`/admin/homestay-booking/${b.bookingId}`)
                        }
                        className="cursor-pointer rounded-xl border border-blue-100 bg-blue-50/40 p-3 transition-all hover:bg-blue-50 hover:shadow-sm"
                      >
                        <div className="mb-1 flex items-start justify-between">
                          <span
                            className="line-clamp-1 text-sm font-bold text-gray-800"
                            title={(b as any).customerName}
                          >
                            {(b as any).customerName}
                          </span>
                          <span className="shrink-0 rounded border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 shadow-sm">
                            {getStatusLabel(b.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed border-blue-200 pt-2 text-xs">
                          <div className="flex items-center gap-1 font-medium text-gray-700">
                            <span>Phòng {b.roomNumber}</span>
                          </div>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(b.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DEPARTURES */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
                  Khách đi ({data.departingToday.length})
                </h4>
                {data.departingToday.length === 0 ? (
                  <p className="py-2 text-center text-sm italic text-gray-400">
                    Không có khách đi
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.departingToday.map((b) => (
                      <div
                        key={b.bookingId}
                        onClick={() =>
                          navigate(`/admin/homestay-booking/${b.bookingId}`)
                        }
                        className="cursor-pointer rounded-xl border border-orange-100 bg-orange-50/40 p-3 transition-all hover:bg-orange-50 hover:shadow-sm"
                      >
                        <div className="mb-1 flex items-start justify-between">
                          <span
                            className="line-clamp-1 text-sm font-bold text-gray-800"
                            title={(b as any).customerName}
                          >
                            {(b as any).customerName || "Khách hàng"}
                          </span>
                          <span className="shrink-0 rounded border border-orange-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700 shadow-sm">
                            {getStatusLabel(b.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-dashed border-orange-200 pt-2 text-xs">
                          <div className="flex items-center gap-1 font-medium text-gray-700">
                            <span>Phòng {b.roomNumber}</span>
                          </div>
                          <span className="font-medium text-gray-500">
                            Trả phòng
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WalkInWizardModal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        onSubmit={handleWalkInSubmit}
      />
    </div>
  );
};

export default HomestayPosPage;
