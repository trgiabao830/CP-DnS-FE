import React from "react";
import { Link, useLocation } from "react-router-dom";
import { XCircle } from "lucide-react";

const BookingFailedPage = () => {
  const location = useLocation();
  const isHomestay = location.pathname.includes("homestay");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl duration-300">
        <div className="flex flex-col items-center border-b border-red-100 bg-red-50 p-8">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm ring-4 ring-red-50">
            <XCircle size={48} strokeWidth={3} />
          </div>
          <h2 className="mb-2 text-3xl font-bold text-red-700">
            Thanh toán thất bại
          </h2>
          <p className="text-center text-red-600">
            Giao dịch bị hủy hoặc xảy ra lỗi trong quá trình xử lý.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-center text-sm text-red-800">
            <p>
              Đơn đặt {isHomestay ? "phòng" : "bàn"} của bạn chưa được hoàn tất
              thanh toán. Vui lòng thử lại hoặc chọn phương thức khác.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to={isHomestay ? "/homestay/booking" : "/restaurant/booking"}
              className={`flex w-full items-center justify-center gap-2 ${
                isHomestay
                  ? "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                  : "bg-cyan-500 shadow-cyan-200 hover:bg-cyan-600"
              } rounded-xl py-3.5 font-bold text-white shadow-lg transition-all hover:scale-[1.02]`}
            >
              Thử lại ngay
            </Link>

            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFailedPage;
