import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Search,
  MapPin,
  Baby,
  User,
  AlertCircle,
  Filter,
} from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";
import { addDays, format } from "date-fns";

import type {
  HomestaySearchRequest,
  AvailableRoomTypeResponse,
  HomestayBookingFlowState,
} from "../../types/client/homestay-booking";
import { homestayBookingService } from "../../services/client/homestay-booking.service";

registerLocale("vi", vi);

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    val,
  );

const HomestayBookingPage = () => {
  const [rooms, setRooms] = useState<AvailableRoomTypeResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const navigate = useNavigate();
  const location = useLocation();
  const savedParams = location.state?.searchParams as
    | HomestaySearchRequest
    | undefined;

  const today = new Date();
  const tomorrow = addDays(today, 1);

  const { control, handleSubmit, watch, setValue, register } =
    useForm<HomestaySearchRequest>({
      defaultValues: {
        checkInDate: savedParams?.checkInDate || format(today, "yyyy-MM-dd"),
        checkOutDate:
          savedParams?.checkOutDate || format(tomorrow, "yyyy-MM-dd"),
        numberOfAdults: savedParams?.numberOfAdults || 2,
        numberOfChildren: savedParams?.numberOfChildren || 0,
      },
    });

  const watchCheckIn = watch("checkInDate");

  const onSearch = async (data: HomestaySearchRequest) => {
    setLoading(true);
    setError("");
    setRooms(null);
    setSelectedCategory("ALL");

    try {
      if (new Date(data.checkInDate) >= new Date(data.checkOutDate)) {
        throw new Error("Ngày trả phòng phải sau ngày nhận phòng");
      }
      const result = await homestayBookingService.searchAvailableRooms(data);
      setRooms(result);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Lỗi tìm phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedParams) {
      onSearch(savedParams);
    }
  }, []); 

  const handleSelectRoom = (room: AvailableRoomTypeResponse) => {
    const searchData = watch();

    navigate(`/homestay/room/${room.typeId}`, {
      state: { searchParams: searchData },
    });
  };

  const categories = useMemo(() => {
    if (!rooms) return [];
    const uniqueClasses = new Set(rooms.map((r) => r.className));
    return ["ALL", ...Array.from(uniqueClasses)];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (!rooms) return null;
    if (selectedCategory === "ALL") return rooms;
    return rooms.filter((r) => r.className === selectedCategory);
  }, [rooms, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* --- HEADER IMAGE / BANNER (Optional) --- */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-indigo-700 md:h-64">
        <div className="absolute inset-0" />
        <div className="container mx-auto flex h-full flex-col justify-center px-4 text-center text-white md:px-8">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">
            Đặt phòng Homestay
          </h1>
          <p className="text-blue-100">Trải nghiệm kỳ nghỉ tuyệt vời nhất</p>
        </div>
      </div>

      {/* --- THANH TÌM KIẾM NGANG (Sticky) --- */}
      <div className="sticky top-0 z-30 -mt-8 px-4 md:px-8">
        <div className="container mx-auto">
          <form
            onSubmit={handleSubmit(onSearch)}
            className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl shadow-slate-200 lg:flex-row lg:items-center lg:gap-2 lg:p-2"
          >
            {/* 1. Ngày nhận phòng */}
            <div className="flex-1 border-b border-slate-100 lg:border-b-0 lg:border-r lg:px-4">
              <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                Nhận phòng
              </label>
              <Controller
                control={control}
                name="checkInDate"
                render={({ field }) => (
                  <div className="relative">
                    <DatePicker
                      selected={new Date(field.value)}
                      onChange={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                          const currentCheckout = new Date(
                            watch("checkOutDate"),
                          );
                          if (date >= currentCheckout) {
                            setValue(
                              "checkOutDate",
                              format(addDays(date, 1), "yyyy-MM-dd"),
                            );
                          }
                        }
                      }}
                      minDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      locale="vi"
                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    <Calendar
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                )}
              />
            </div>

            <div className="flex-1 border-b border-slate-100 lg:border-b-0 lg:border-r lg:px-4">
              <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                Trả phòng
              </label>
              <Controller
                control={control}
                name="checkOutDate"
                render={({ field }) => (
                  <div className="relative">
                    <DatePicker
                      selected={new Date(field.value)}
                      onChange={(date) =>
                        date && field.onChange(format(date, "yyyy-MM-dd"))
                      }
                      minDate={addDays(new Date(watchCheckIn), 1)}
                      dateFormat="dd/MM/yyyy"
                      locale="vi"
                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    <Calendar
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                )}
              />
            </div>

            <div className="flex-1 border-b border-slate-100 lg:border-b-0 lg:border-r lg:px-4">
              <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                Người lớn
              </label>
              <div className="relative flex items-center">
                <select
                  {...register("numberOfAdults")}
                  className="w-full appearance-none bg-transparent text-sm font-bold text-slate-700 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} Người
                    </option>
                  ))}
                </select>
                <User
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>
            </div>

            <div className="flex-1 lg:px-4">
              <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
                Trẻ em
              </label>
              <div className="relative flex items-center">
                <select
                  {...register("numberOfChildren")}
                  className="w-full appearance-none bg-transparent text-sm font-bold text-slate-700 outline-none"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} Trẻ em
                    </option>
                  ))}
                </select>
                <Baby
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
              </div>
            </div>

            <div className="lg:w-auto">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-70 lg:w-auto lg:rounded-xl"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Search size={20} />
                )}
                <span className="lg:hidden">Tìm phòng</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto mt-8 px-4 md:px-8">
        {loading && (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p>Đang tìm kiếm phòng phù hợp...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-lg rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-500">
            <AlertCircle size={40} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !rooms && !error && (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <p>Vui lòng chọn ngày và số lượng khách để bắt đầu tìm kiếm.</p>
          </div>
        )}

        {!loading && rooms && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Phòng còn trống
                </h2>
                <p className="text-sm text-slate-500">
                  Tìm thấy {filteredRooms?.length} kết quả
                </p>
              </div>

              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat === "ALL" ? "Tất cả" : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredRooms && filteredRooms.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredRooms.map((room) => (
                  <div
                    key={room.typeId}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-400 hover:shadow-lg"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                      {room.mainImage ? (
                        <img
                          src={room.mainImage}
                          alt={room.typeName}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <MapPin size={24} />
                        </div>
                      )}

                      <div className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 shadow-sm backdrop-blur-sm">
                        {room.className}
                      </div>

                      <div className="absolute bottom-2 right-2 rounded bg-slate-900/80 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                        Còn {room.availableRoomsCount}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="mb-2 line-clamp-1 text-base font-bold text-slate-800 group-hover:text-blue-600">
                        {room.typeName}
                      </h3>

                      <div className="mb-3 flex flex-wrap gap-1.5">
                        <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          <Users size={10} /> {room.maxAdults} người
                        </span>
                        {room.amenities.slice(0, 2).map((am, idx) => (
                          <span
                            key={idx}
                            className="line-clamp-1 rounded border border-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                          >
                            {am}
                          </span>
                        ))}
                        {room.amenities.length > 2 && (
                          <span className="text-[10px] text-slate-400">
                            +{room.amenities.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Footer: Giá và Nút bấm nhỏ gọn */}
                      <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-3">
                        <div>
                          <span className="block text-[10px] text-slate-400">
                            Giá / đêm
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(room.basePrice)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSelectRoom(room)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700"
                        >
                          Chọn
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-500">
                <Filter size={32} className="mb-2 opacity-20" />
                <p className="text-sm">
                  Không có phòng nào thuộc hạng mục này.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomestayBookingPage;
