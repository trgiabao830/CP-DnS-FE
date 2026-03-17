import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { homestayBookingService } from "../../services/client/homestay-booking.service";
import type {
  RoomTypeDetailResponse,
  HomestaySearchRequest,
} from "../../types/client/homestay-booking";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

const RoomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [urlSearchParams] = useSearchParams();

  const searchParams = useMemo<HomestaySearchRequest | undefined>(() => {
    if (location.state?.searchParams) {
        return location.state.searchParams;
    }

    const checkIn = urlSearchParams.get("checkIn");
    const checkOut = urlSearchParams.get("checkOut");
    
    if (checkIn && checkOut) {
        return {
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfAdults: Number(urlSearchParams.get("adults") || 1),
            numberOfChildren: Number(urlSearchParams.get("children") || 0)
        };
    }
    return undefined;
  }, [location.state, urlSearchParams]);

  const tempCustomerInfo = useMemo(() => {
      const name = urlSearchParams.get("name");
      const phone = urlSearchParams.get("phone");
      const email = urlSearchParams.get("email");
      
      if(name || phone || email) {
          return { name: name || "", phone: phone || "", email: email || "" };
      }
      return undefined;
  }, [urlSearchParams]);


  const [room, setRoom] = useState<RoomTypeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await homestayBookingService.getRoomTypeDetail(
          id,
          searchParams?.checkInDate,
          searchParams?.checkOutDate
        );
        setRoom(data);
        setCurrentImageIndex(0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, searchParams]);

  const handleGoBack = () => {
    if (!location.state) {
        navigate("/homestay/booking");
    } else {
        navigate("/homestay/booking", { state: { searchParams: searchParams } });
    }
  };

  const handleBooking = () => {
    if (!room) return;
    navigate("/homestay/checkout", {
      state: {
        selectedRoom: room,
        searchParams: searchParams,
        tempCustomerInfo: tempCustomerInfo 
      },
    });
  };

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!room || room.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!room || room.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? room.images.length - 1 : prev - 1));
  };

  const nights = searchParams 
    ? differenceInDays(new Date(searchParams.checkOutDate), new Date(searchParams.checkInDate))
    : 0;
  
  const totalPrice = (room?.basePrice || 0) * (nights > 0 ? nights : 1);

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"/></div>;
  if (error || !room) return <div className="p-10 text-center text-red-500">{error || "Không tìm thấy phòng"}</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Nút Quay lại */}
        <button
          onClick={handleGoBack}
          className="mb-6 flex items-center gap-2 font-medium text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft size={20} /> Quay lại tìm kiếm
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* --- CỘT TRÁI (7 phần): ẢNH + QUY ĐỊNH --- */}
          <div className="flex flex-col gap-8 lg:col-span-7">
            
            {/* 1. THƯ VIỆN ẢNH */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              
              {/* ẢNH LỚN */}
              <div className="group relative mb-4 h-[400px] overflow-hidden rounded-xl bg-slate-200">
                <img
                  src={room.images[currentImageIndex]}
                  alt="Main View"
                  className="h-full w-full object-cover transition-all duration-500"
                />
                
                {/* Nút Prev */}
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Nút Next */}
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Index Indicator */}
                <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {currentImageIndex + 1} / {room.images.length}
                </div>
              </div>
              
              {/* DANH SÁCH ẢNH NHỎ */}
              <div className="grid grid-cols-5 gap-2">
                {room.images.slice(0, 5).map((img, idx) => {
                  const isLastItem = idx === 4;
                  const remainingCount = room.images.length - 5;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative h-20 cursor-pointer overflow-hidden rounded-lg bg-slate-100 transition-all ${
                        currentImageIndex === idx
                          ? "ring-2 ring-blue-600 ring-offset-1"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                      {isLastItem && remainingCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white backdrop-blur-[1px]">
                          +{remainingCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* THÔNG TIN CHI TIẾT */}
            <div className="rounded-2xl bg-white p-6 shadow-sm h-fit">
               <div className="mb-4">
                 <div className="flex items-center justify-between mb-2">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {room.className}
                    </span>
                 </div>
                 <h1 className="text-2xl font-bold text-slate-900 leading-tight">{room.typeName}</h1>
              </div>

              <div className="mb-6 text-slate-600 text-sm leading-relaxed border-b border-slate-100 pb-6">
                 {room.description || "Phòng nghỉ được thiết kế hiện đại, mang lại cảm giác ấm cúng và thoải mái cho kỳ nghỉ của bạn."}
              </div>

              <div>
                <h3 className="mb-3 font-bold text-slate-800 text-sm uppercase text-opacity-70">Tiện ích nổi bật</h3>
                <div className="grid grid-cols-2 gap-3">
                   {room.amenities.map((am, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 p-2 ">
                        <span>{am}</span>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: GIÁ & BOOKING --- */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            <div className="rounded-2xl border-2 border-blue-50 bg-white p-6 shadow-lg shadow-blue-50 sticky top-20">
              <div className="flex items-end justify-between border-b border-slate-100 pb-4 mb-4">
                 <div>
                    <p className="text-sm text-slate-500">Giá phòng mỗi đêm</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-bold text-blue-600">{formatCurrency(room.basePrice)}</span>
                       <span className="text-slate-400">/đêm</span>
                    </div>
                 </div>
                 {room.availableRoomsCount !== null && room.availableRoomsCount <= 3 && (
                   <div className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                     Chỉ còn {room.availableRoomsCount} phòng!
                   </div>
                 )}
              </div>

              {searchParams ? (
                 <div className="mb-6 space-y-2 text-sm">
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                       <span className="text-slate-500">Nhận phòng</span>
                       <span className="font-bold text-slate-700">{format(new Date(searchParams.checkInDate), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                       <span className="text-slate-500">Trả phòng</span>
                       <span className="font-bold text-slate-700">{format(new Date(searchParams.checkOutDate), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 pt-2">
                       <span className="font-bold text-slate-700">Tổng cộng ({nights} đêm):</span>
                       <span className="font-bold text-xl text-blue-600">{formatCurrency(totalPrice)}</span>
                    </div>
                 </div>
              ) : (
                 <div className="mb-6 p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg text-center">
                    Vui lòng chọn ngày để xem giá chính xác
                 </div>
              )}

              {room.availableRoomsCount !== null && room.availableRoomsCount > 0 ? (
                <button
                  onClick={handleBooking}
                  className="w-full group flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg"
                >
                  Đặt phòng ngay <ChevronRight className="transition-transform group-hover:translate-x-1" size={18}/>
                </button>
              ) : (
                <button disabled className="w-full rounded-xl bg-slate-200 py-4 font-bold text-slate-400 cursor-not-allowed">
                  Tạm hết phòng
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;