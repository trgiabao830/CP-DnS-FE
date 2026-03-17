import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { Calendar, Clock, Users, Search, Loader2 } from "lucide-react";
import { bookingService } from "../../services/client/booking.service";
import type {
  BookingSearchRequest,
  AvailableTableResponse,
  BookingFlowState,
} from "../../types/client/booking";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";
import { useNavigate } from "react-router-dom";
registerLocale("vi", vi);

const generateDynamicTimeSlots = (openingTime: string, closingTime: string) => {
  const slots = [];
  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);

  let current = new Date();
  current.setHours(openH, openM, 0, 0);

  const end = new Date();
  end.setHours(closeH, closeM, 0, 0);

  while (current <= end) {
    const hh = String(current.getHours()).padStart(2, "0");
    const mm = String(current.getMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
};

const formatDateToString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const parseDateStringToDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const BookingPage = () => {
  const navigate = useNavigate();

  const [tables, setTables] = useState<AvailableTableResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [baseTimeSlots, setBaseTimeSlots] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const formRef = useRef<HTMLDivElement>(null);
  const [rightColHeight, setRightColHeight] = useState<number | "auto">("auto");

  const todayStr = formatDateToString(new Date());

  const { control, register, handleSubmit, setValue, watch, getValues } =
    useForm<BookingSearchRequest>({
      defaultValues: {
        date: todayStr,
        numberOfGuests: 4,
        time: "",
      },
    });

  const selectedDateStr = watch("date");

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await bookingService.getOperatingHours();
        const slots = generateDynamicTimeSlots(
          res.openingTime,
          res.closingTime,
        );
        setBaseTimeSlots(slots);
      } catch (err) {
        console.error("Lỗi lấy cấu hình giờ:", err);
        const fallbackSlots = generateDynamicTimeSlots("10:00", "22:00");
        setBaseTimeSlots(fallbackSlots);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (baseTimeSlots.length === 0) return;

    const today = new Date();
    const todayFormatted = formatDateToString(today);

    let validSlots = [...baseTimeSlots];

    if (selectedDateStr === todayFormatted) {
      const currentH = today.getHours();
      const currentM = today.getMinutes();

      validSlots = baseTimeSlots.filter((slot) => {
        const [slotH, slotM] = slot.split(":").map(Number);
        if (slotH > currentH) return true;
        if (slotH === currentH && slotM > currentM) return true;
        return false;
      });

      if (validSlots.length === 0) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setValue("date", formatDateToString(tomorrow));
        return;
      }
    }

    setTimeSlots(validSlots);

    const currentSelectedTime = getValues("time");
    if (!validSlots.includes(currentSelectedTime)) {
      setValue("time", validSlots[0]);
    }
  }, [selectedDateStr, baseTimeSlots, setValue, getValues]);

  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth >= 1024 && formRef.current) {
        setRightColHeight(formRef.current.clientHeight);
      } else {
        setRightColHeight("auto");
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    const observer = new ResizeObserver(updateHeight);
    if (formRef.current) observer.observe(formRef.current);

    return () => {
      window.removeEventListener("resize", updateHeight);
      observer.disconnect();
    };
  }, []);

  const getMinDate = () => {
    if (baseTimeSlots.length === 0) return new Date();
    const today = new Date();
    const currentH = today.getHours();
    const currentM = today.getMinutes();

    const hasSlotsToday = baseTimeSlots.some((slot) => {
      const [slotH, slotM] = slot.split(":").map(Number);
      return slotH > currentH || (slotH === currentH && slotM > currentM);
    });

    if (!hasSlotsToday) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return today;
  };

  const onSearch = async (data: BookingSearchRequest) => {
    setLoading(true);
    setError("");
    setTables(null);

    try {
      if (!data.date) throw new Error("Vui lòng chọn ngày");

      const request: BookingSearchRequest = {
        date: data.date,
        time: data.time,
        numberOfGuests: Number(data.numberOfGuests),
      };

      const result = await bookingService.searchTables(request);
      setTables(result);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tìm bàn.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table: AvailableTableResponse) => {
    const searchData = control._formValues;

    const navigateState: BookingFlowState = {
      searchParams: {
        date: searchData.date,
        time: searchData.time,
        numberOfGuests: Number(searchData.numberOfGuests),
      },
      selectedTable: table,
    };

    navigate("/restaurant/booking/info", { state: navigateState });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 pt-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800 md:text-4xl">
            Tìm kiếm bàn khả dụng
          </h1>
          <p className="text-gray-500">
            Tìm kiếm bàn trống phù hợp với nhu cầu và thời gian của bạn.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN: SEARCH FORM */}
          <div className="lg:col-span-1">
            <div
              ref={formRef}
              className="sticky top-24 h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              {loadingConfig ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Loader2
                    className="mb-2 animate-spin text-cyan-500"
                    size={32}
                  />
                  <p className="text-sm">Đang tải cấu hình...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSearch)} className="space-y-5">
                  {/* Ngày */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Ngày
                    </label>
                    <Controller
                      control={control}
                      name="date"
                      rules={{ required: true }}
                      render={({ field }) => {
                        const selectedDate = field.value
                          ? parseDateStringToDate(field.value)
                          : new Date();

                        return (
                          <div className="relative">
                            <DatePicker
                              selected={selectedDate}
                              onChange={(date) => {
                                if (!date) return;
                                field.onChange(formatDateToString(date));
                              }}
                              dateFormat="dd 'tháng' MM, yyyy"
                              minDate={getMinDate()}
                              locale="vi"
                              wrapperClassName="w-full"
                              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-11 text-gray-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                            />
                            <Calendar
                              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        );
                      }}
                    />
                  </div>

                  {/* Giờ */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Giờ
                    </label>
                    <div className="relative">
                      <select
                        {...register("time", { required: true })}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pl-11 text-gray-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      >
                        {timeSlots.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <Clock
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                    </div>
                  </div>

                  {/* Số khách */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      Số lượng khách
                    </label>
                    <div className="relative">
                      <select
                        {...register("numberOfGuests", { required: true })}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pl-11 text-gray-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((num) => (
                          <option key={num} value={num}>
                            {num} người
                          </option>
                        ))}
                      </select>
                      <Users
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-cyan-400 py-3.5 font-bold text-white shadow-lg shadow-cyan-100 transition-transform hover:scale-[1.02] hover:bg-cyan-500 disabled:opacity-70"
                  >
                    {loading ? <>Đang tìm...</> : <>Tìm kiếm</>}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: RESULTS LIST */}
          <div className="lg:col-span-2">
            <div
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200"
              style={{ height: rightColHeight }}
            >
              <h3 className="mb-4 border-b pb-4 text-lg font-bold text-gray-700">
                Kết quả tìm kiếm
              </h3>

              <div className="custom-scrollbar flex-grow overflow-y-auto pr-2">
                {loading && (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
                    <p>Đang tìm bàn trống...</p>
                  </div>
                )}

                {!loading && error && (
                  <div className="flex h-full items-center justify-center">
                    <div className="w-full rounded-lg bg-red-50 p-4 text-center text-red-600">
                      {error}
                    </div>
                  </div>
                )}

                {!loading && !tables && !error && (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <Search size={48} className="mb-4 text-gray-300" />
                    <p>Vui lòng chọn thông tin và nhấn tìm kiếm</p>
                  </div>
                )}

                {!loading && tables && tables.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center text-gray-500">
                    <p>Rất tiếc, không còn bàn trống cho khung giờ này.</p>
                    <p>Vui lòng thử chọn giờ khác.</p>
                  </div>
                )}

                {!loading && tables && tables.length > 0 && (
                  <div className="space-y-4">
                    {tables.map((table) => (
                      <div
                        key={table.suggestedTableId}
                        className="group flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-cyan-200 hover:shadow-md md:flex-row"
                      >
                        <div className="flex w-full items-center gap-4 md:w-auto">
                          <div>
                            <h4 className="text-md font-bold text-gray-800 transition-colors group-hover:text-cyan-600">
                              {table.areaName} - Bàn {table.capacity} người
                            </h4>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectTable(table)}
                          className="w-full min-w-[140px] rounded-full bg-cyan-400 px-6 py-2.5 font-bold text-white shadow-md shadow-cyan-100 transition-colors hover:bg-cyan-500 md:w-auto"
                        >
                          Chọn bàn
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
