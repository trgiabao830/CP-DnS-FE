import React, { useState, useEffect } from "react";
import {
  Utensils,
  Home,
  RotateCcw,
  Loader2,
  AlertCircle,
  HelpCircle,
  Save,
} from "lucide-react";
import { settingsService } from "../../services/admin/settings.service";
import Modal from "../../components/Modal";
import {
  SuccessModal,
  ErrorModal,
} from "../../components/admin/common/ActionModals";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";
import { parse, format } from "date-fns";

registerLocale("vi", vi);

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"RESTAURANT" | "HOMESTAY">(
    "RESTAURANT",
  );

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const [isDepositRequired, setIsDepositRequired] = useState(false);
  const [isLoadingDepositConfig, setIsLoadingDepositConfig] = useState(true);
  const [isUpdatingDeposit, setIsUpdatingDeposit] = useState(false);
  const [isResettingFoods, setIsResettingFoods] = useState(false);

  const [deadlines, setDeadlines] = useState({
    homestayHours: 0,
    restaurantDepositHours: 0,
    restaurantNoDepositHours: 0,
  });
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true);
  const [isSavingDeadlines, setIsSavingDeadlines] = useState(false);

  const [operatingHours, setOperatingHours] = useState({
    openingTime: "08:00",
    closingTime: "22:00",
  });
  const [isLoadingOperatingHours, setIsLoadingOperatingHours] = useState(true);
  const [isSavingOperatingHours, setIsSavingOperatingHours] = useState(false);

  useEffect(() => {
    const loadAllConfigs = async () => {
      try {
        const depositStatus = await settingsService.getDepositRequirement();
        setIsDepositRequired(depositStatus);
        setIsLoadingDepositConfig(false);

        const deadlineData = await settingsService.getCancellationDeadlines();
        setDeadlines({
          homestayHours: deadlineData.homestayHours || 0,
          restaurantDepositHours: deadlineData.restaurantDepositHours || 0,
          restaurantNoDepositHours: deadlineData.restaurantNoDepositHours || 0,
        });
        setIsLoadingDeadlines(false);

        const opsData = await settingsService.getOperatingHours();
        setOperatingHours({
          openingTime: opsData.openingTime?.substring(0, 5) || "08:00",
          closingTime: opsData.closingTime?.substring(0, 5) || "22:00",
        });
        setIsLoadingOperatingHours(false);
      } catch (error) {
        console.error("Lỗi lấy cấu hình:", error);
      }
    };
    loadAllConfigs();
  }, []);

  const handleToggleDeposit = async () => {
    const newValue = !isDepositRequired;
    setIsUpdatingDeposit(true);
    try {
      const res = await settingsService.updateDepositRequirement(newValue);
      setIsDepositRequired(newValue);
      setSuccessMsg(res.message || "Đã cập nhật cấu hình đặt cọc.");
    } catch (error: any) {
      setErrorMsg(error.message || "Lỗi khi cập nhật cấu hình.");
    } finally {
      setIsUpdatingDeposit(false);
    }
  };

  const executeResetFoods = async () => {
    setIsResettingFoods(true);
    setIsConfirmResetOpen(false);
    try {
      const res = await settingsService.resetAllOutOfStockFoods();
      setSuccessMsg(res.message || `Đã khôi phục ${res.updatedCount} món ăn.`);
    } catch (error: any) {
      setErrorMsg(error.message || "Lỗi khi khôi phục món ăn.");
    } finally {
      setIsResettingFoods(false);
    }
  };

  const handleSaveDeadlines = async () => {
    setIsSavingDeadlines(true);
    try {
      const res = await settingsService.updateCancellationDeadlines(deadlines);
      setSuccessMsg(res.message || "Đã cập nhật thời gian hủy đơn.");
    } catch (error: any) {
      setErrorMsg(error.message || "Lỗi khi cập nhật thời gian hủy đơn.");
    } finally {
      setIsSavingDeadlines(false);
    }
  };

  const handleSaveOperatingHours = async () => {
    setIsSavingOperatingHours(true);
    try {
      const res = await settingsService.updateOperatingHours(
        operatingHours.openingTime,
        operatingHours.closingTime
      );
      setSuccessMsg(res.message || "Đã cập nhật khung giờ hoạt động.");
    } catch (error: any) {
      setErrorMsg(error.message || "Lỗi khi cập nhật khung giờ hoạt động.");
    } finally {
      setIsSavingOperatingHours(false);
    }
  };

  const parseTime = (timeString: string) => {
    return parse(timeString, "HH:mm", new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h1>
        <p className="text-sm text-gray-500">
          Quản lý các cấu hình và quy định chung của hệ thống
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("RESTAURANT")}
            className={`flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${
              activeTab === "RESTAURANT"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <Utensils size={18} /> Cấu hình Nhà hàng
          </button>
          <button
            onClick={() => setActiveTab("HOMESTAY")}
            className={`flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${
              activeTab === "HOMESTAY"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <Home size={18} /> Cấu hình Homestay
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {/* --- TAB NHÀ HÀNG --- */}
        {activeTab === "RESTAURANT" && (
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* 1. Cấu hình Giờ hoạt động (24H Format) */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:col-span-2 lg:col-span-1">
              <div className="border-b border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center gap-2 text-gray-800">
                  <h3 className="text-lg font-bold">Khung giờ hoạt động</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Quy định thời gian cho phép khách hàng đặt bàn trong ngày.
                </p>
              </div>
              <div className="space-y-4 p-5">
                {isLoadingOperatingHours ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-gray-800">Giờ mở cửa</span>
                      <div className="w-24">
                        <DatePicker
                          selected={parseTime(operatingHours.openingTime)}
                          onChange={(date: Date | null) => {
                            if (date) setOperatingHours(p => ({ ...p, openingTime: format(date, "HH:mm") }));
                          }}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={30}
                          timeCaption="Giờ"
                          dateFormat="HH:mm"
                          timeFormat="HH:mm"
                          className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium outline-none transition-colors hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-gray-800">Giờ đóng cửa</span>
                      <div className="w-24">
                        <DatePicker
                          selected={parseTime(operatingHours.closingTime)}
                          onChange={(date: Date | null) => {
                            if (date) setOperatingHours(p => ({ ...p, closingTime: format(date, "HH:mm") }));
                          }}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={30}
                          timeCaption="Giờ"
                          dateFormat="HH:mm"
                          timeFormat="HH:mm"
                          className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium outline-none transition-colors hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                      <button
                        onClick={handleSaveOperatingHours}
                        disabled={isSavingOperatingHours}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingOperatingHours ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}{" "}
                        Lưu thay đổi
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Cấu hình quy định đặt cọc */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:col-span-2 lg:col-span-1">
              <div className="border-b border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center gap-2 text-gray-800">
                  <h3 className="text-lg font-bold">Quy định đặt cọc</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Thiết lập yêu cầu thu tiền cọc đối với khách hàng đặt bàn
                  nhưng không gọi món trước.
                </p>
              </div>
              <div className="flex items-center justify-between p-5 h-[calc(100%-104px)]">
                <div>
                  <div className="font-medium text-gray-800">
                    Bắt buộc đặt cọc
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {isDepositRequired
                      ? "Hệ thống sẽ yêu cầu thanh toán cọc để giữ bàn."
                      : "Khách hàng có thể đặt bàn miễn phí."}
                  </div>
                </div>
                {isLoadingDepositConfig ? (
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                ) : (
                  <button
                    onClick={handleToggleDeposit}
                    disabled={isUpdatingDeposit}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                      isDepositRequired ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span className="sr-only">Toggle Deposit</span>
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isDepositRequired ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Cấu hình thời gian hủy (Nhà hàng) */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center gap-2 text-gray-800">
                  <h3 className="text-lg font-bold">
                    Thời gian cho phép hủy bàn
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Quy định số giờ tối thiểu khách phải báo hủy trước giờ đến.
                </p>
              </div>
              <div className="space-y-4 p-5">
                {isLoadingDeadlines ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          Đơn CÓ đặt cọc / đặt món
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={deadlines.restaurantDepositHours}
                          onChange={(e) =>
                            setDeadlines((p) => ({
                              ...p,
                              restaurantDepositHours: Number(e.target.value),
                            }))
                          }
                          className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">giờ</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          Đơn KHÔNG đặt cọc
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={deadlines.restaurantNoDepositHours}
                          onChange={(e) =>
                            setDeadlines((p) => ({
                              ...p,
                              restaurantNoDepositHours: Number(e.target.value),
                            }))
                          }
                          className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">giờ</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                      <button
                        onClick={handleSaveDeadlines}
                        disabled={isSavingDeadlines}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingDeadlines ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}{" "}
                        Lưu thay đổi
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 4. Tiện ích quản lý món ăn */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center gap-2 text-gray-800">
                  <h3 className="text-lg font-bold">Làm mới Menu</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Sử dụng vào cuối ngày hoặc đầu ca để đặt lại trạng thái các
                  món ăn đã hết.
                </p>
              </div>
              <div className="flex flex-col items-center justify-between gap-4 p-5 h-[calc(100%-104px)]">
                <div className="flex w-full items-start gap-3 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-600"
                  />
                  <span>
                    Chuyển toàn bộ các món đang bị đánh dấu{" "}
                    <strong>"Hết món"</strong> trở về trạng thái{" "}
                    <strong>"Đang bán"</strong>.
                  </span>
                </div>
                <button
                  onClick={() => setIsConfirmResetOpen(true)}
                  disabled={isResettingFoods}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-100 px-5 py-2.5 font-bold text-orange-700 transition-colors hover:bg-orange-200 disabled:opacity-50"
                >
                  {isResettingFoods ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <RotateCcw size={18} />
                  )}{" "}
                  Khôi phục món
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB HOMESTAY --- */}
        {activeTab === "HOMESTAY" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cấu hình thời gian hủy (Homestay) */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center gap-2 text-gray-800">
                  <h3 className="text-lg font-bold">
                    Thời gian cho phép hủy phòng
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Quy định số giờ tối thiểu khách phải báo hủy trước giờ
                  check-in.
                </p>
              </div>
              <div className="space-y-4 p-5">
                {isLoadingDeadlines ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          Hủy trước giờ nhận phòng
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={deadlines.homestayHours}
                          onChange={(e) =>
                            setDeadlines((p) => ({
                              ...p,
                              homestayHours: Number(e.target.value),
                            }))
                          }
                          className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">giờ</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                      <button
                        onClick={handleSaveDeadlines}
                        disabled={isSavingDeadlines}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isSavingDeadlines ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}{" "}
                        Lưu thay đổi
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL XÁC NHẬN KHÔI PHỤC MÓN --- */}
      {isConfirmResetOpen && (
        <Modal
          isOpen={isConfirmResetOpen}
          onClose={() => setIsConfirmResetOpen(false)}
          title="Xác nhận khôi phục"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <HelpCircle size={28} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              Khôi phục menu món ăn?
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Bạn có chắc chắn muốn chuyển toàn bộ món ăn đang{" "}
              <strong className="text-gray-700">"Hết món"</strong> thành{" "}
              <strong className="text-green-600">"Đang bán"</strong> không?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsConfirmResetOpen(false)}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeResetFoods}
                className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-orange-700"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Thông báo kết quả */}
      <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg("")} />
    </div>
  );
};

export default Settings;