import React from "react";
import {
  useSearchParams,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";

const BookingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomestay = location.pathname.includes("homestay");

  const txnCode = searchParams.get("code");
  const accessToken =
    searchParams.get("accessToken") || searchParams.get("code"); 

  const handleViewDetail = () => {
    if (!accessToken) return;

    if (isHomestay) {
      navigate(`/homestay/booking/tracking?code=${accessToken}`);
    } else {
      navigate(`/restaurant/booking/tracking?code=${accessToken}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div
        className={`h-24 w-24 ${isHomestay ? "bg-blue-100" : "bg-green-100"} animate-in zoom-in mb-6 flex items-center justify-center rounded-full duration-300`}
      >
        <Check
          size={48}
          className={isHomestay ? "text-blue-600" : "text-green-600"}
          strokeWidth={3}
        />
      </div>

      <h1 className="mb-2 text-center text-2xl font-bold text-gray-800 md:text-3xl">
        Thanh toán thành công!
      </h1>
      <p className="mb-8 max-w-md text-center text-gray-500">
        Cảm ơn bạn đã tin dùng dịch vụ. Đơn đặt {isHomestay ? "phòng" : "bàn"}{" "}
        của bạn đã được xác nhận.
      </p>

      <div className="relative mb-8 w-full max-w-xs rounded-xl border border-gray-100 bg-gray-50 px-8 py-4 text-center">
        <span className="mb-1 block text-xs font-bold uppercase text-gray-400">
          Mã đặt {isHomestay ? "phòng" : "bàn"}
        </span>
        <span className="break-all font-mono text-xl font-bold tracking-widest text-gray-800">
          {accessToken || "UNKNOWN"}
        </span>

        {txnCode && txnCode !== accessToken && (
          <div className="mt-2 border-t border-gray-200 pt-2">
            <span className="block font-mono text-[10px] text-gray-400">
              Giao dịch: {txnCode}
            </span>
          </div>
        )}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={handleViewDetail}
          className={`flex w-full items-center justify-center gap-2 ${
            isHomestay
              ? "bg-blue-600 shadow-blue-100 hover:bg-blue-700"
              : "bg-cyan-500 shadow-cyan-100 hover:bg-cyan-600"
          } rounded-full py-3.5 font-bold text-white shadow-lg transition-all`}
        >
          Xem chi tiết đơn đặt {isHomestay ? "phòng" : "bàn"}
          <ArrowRight size={18} />
        </button>

        <Link
          to="/"
          className="w-full rounded-full py-3 text-center font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
