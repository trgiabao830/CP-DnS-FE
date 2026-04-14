import React, { useEffect, useState } from "react";
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock
} from "lucide-react";
import Modal from "../../Modal";
import type { Coupon, CouponRequest } from "../../../types/admin/coupon";
import { ServiceType, CouponStatus } from "../../../types/admin/coupon";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";

registerLocale("vi", vi);


const generateOptions = (max: number) => {
  return Array.from({ length: max }, (_, i) => {
    const val = i.toString().padStart(2, "0");
    return (
      <option key={val} value={val}>
        {val}
      </option>
    );
  });
};

const TimeSelector = ({ value, onChange }: any) => {
  const [hours, minutes, seconds] = value
    ? value.split(":")
    : ["00", "00", "00"];
  const handleChange = (type: "h" | "m" | "s", newVal: string) => {
    const h = type === "h" ? newVal : hours;
    const m = type === "m" ? newVal : minutes;
    const s = type === "s" ? newVal : seconds;
    onChange(`${h}:${m}:${s}`);
  };
  return (
    <div className="flex items-center justify-center gap-1 rounded border border-gray-300 bg-gray-50 px-2 py-1">
      <Clock size={14} className="mr-1 text-gray-500" /> Thời gian:
      <select
        value={hours}
        onChange={(e) => handleChange("h", e.target.value)}
        className="cursor-pointer bg-transparent font-mono text-sm font-medium hover:text-blue-600 focus:outline-none"
      >
        {generateOptions(24)}
      </select>
      <span className="font-bold text-gray-400">:</span>
      <select
        value={minutes}
        onChange={(e) => handleChange("m", e.target.value)}
        className="cursor-pointer bg-transparent font-mono text-sm font-medium hover:text-blue-600 focus:outline-none"
      >
        {generateOptions(60)}
      </select>
    </div>
  );
};

const CustomDateInput = React.forwardRef(
  ({ value, onClick, placeholder, hasError }: any, ref: any) => (
    <div
      className="group relative w-full cursor-pointer"
      onClick={onClick}
      ref={ref}
    >
      <input
        value={value}
        readOnly
        placeholder={placeholder}
        className={`w-full cursor-pointer rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-gray-700 outline-none transition-all placeholder:text-gray-400 ${
          hasError
            ? "border-red-500 focus:ring-1 focus:ring-red-200"
            : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 group-hover:border-blue-400"
        }`}
      />
      <CalendarIcon
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${hasError ? "text-red-400" : "text-gray-400 group-hover:text-blue-500"}`}
        size={18}
      />
    </div>
  ),
);
CustomDateInput.displayName = "CustomDateInput";


interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CouponRequest) => Promise<void>;
  initialData?: Coupon | null;
}

const CouponFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">(
    "PERCENT",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState<CouponRequest>({
    code: "",
    discountPercent: null,
    discountAmount: null,
    maxDiscountAmount: null,
    minOrderValue: 0,
    quantity: 100,
    serviceType: ServiceType.HOMESTAY,
    validFrom: "",
    validUntil: "",
    requireAccount: false,
    status: CouponStatus.AVAILABLE,
  });

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setFormData({ ...initialData });
        setStartDate(
          initialData.validFrom ? new Date(initialData.validFrom) : null,
        );
        setEndDate(
          initialData.validUntil ? new Date(initialData.validUntil) : null,
        );
        setDiscountType(
          initialData.discountAmount && initialData.discountAmount > 0
            ? "AMOUNT"
            : "PERCENT",
        );
      } else {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 7);
        now.setHours(0, 0, 0, 0);
        tomorrow.setHours(23, 59, 59, 999);

        setStartDate(now);
        setEndDate(tomorrow);
        setFormData({
          code: "",
          discountPercent: null,
          discountAmount: null,
          maxDiscountAmount: null,
          minOrderValue: 0,
          quantity: 100,
          serviceType: ServiceType.HOMESTAY,
          validFrom: "",
          validUntil: "",
          requireAccount: false,
          status: CouponStatus.AVAILABLE,
        });
        setDiscountType("PERCENT");
      }
    }
  }, [isOpen, initialData]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const formatLocalISO = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
  };

  const validateFrontend = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code || !formData.code.trim()) {
      newErrors.code = "Mã giảm giá không được để trống";
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = "Mã chỉ được chứa chữ hoa và số, không dấu cách";
    }

    if (!startDate) newErrors.validFrom = "Ngày bắt đầu không được để trống";
    if (!endDate) newErrors.validUntil = "Ngày kết thúc không được để trống";
    if (startDate && endDate && endDate <= startDate) {
      newErrors.validUntil = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    if (discountType === "PERCENT") {
      if (
        formData.discountPercent === undefined ||
        formData.discountPercent === null
      ) {
        newErrors.discountPercent = "Phần trăm giảm giá không được để trống";
      } else if (
        formData.discountPercent < 0 ||
        formData.discountPercent > 100
      ) {
        newErrors.discountPercent = "Phần trăm giảm giá phải từ 0 đến 100";
      }

      if (
        formData.maxDiscountAmount !== undefined &&
        formData.maxDiscountAmount < 0
      ) {
        newErrors.maxDiscountAmount = "Giảm tối đa không hợp lệ (phải >= 0)";
      }
    } else {
      if (
        formData.discountAmount === undefined ||
        formData.discountAmount === null
      ) {
        newErrors.discountAmount = "Số tiền giảm giá không được để trống";
      } else if (formData.discountAmount < 0) {
        newErrors.discountAmount = "Số tiền giảm giá không hợp lệ";
      }
    }

    if (formData.quantity === undefined || formData.quantity === null) {
      newErrors.quantity = "Số lượng không được để trống";
    } else if (formData.quantity < 1) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (formData.minOrderValue !== undefined && formData.minOrderValue < 0) {
      newErrors.minOrderValue = "Giá trị đơn tối thiểu không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFrontend()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        validFrom: formatLocalISO(startDate!),
        validUntil: formatLocalISO(endDate!),
        discountAmount:
          discountType === "PERCENT" ? null : formData.discountAmount,
        discountPercent:
          discountType === "PERCENT" ? formData.discountPercent : null,
        maxDiscountAmount:
          discountType === "PERCENT" ? formData.maxDiscountAmount : null,
      });
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const backendErrors: Record<string, string> = {};
        errorData.errors.forEach((e: any) => {
          if (e.field) backendErrors[e.field] = e.defaultMessage;
        });
        setErrors(backendErrors);
      } else if (errorData?.message) {
        alert(errorData.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá mới"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
            Mã giảm giá <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            disabled={!!initialData}
            value={formData.code}
            onChange={(e) => {
              setFormData({
                ...formData,
                code: e.target.value.toUpperCase().replace(/\s/g, ""),
              });
              clearError("code");
            }}
            className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
              errors.code
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }`}
            placeholder="VD: TET2026"
          />
          {errors.code && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
              {errors.code}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
            Dịch vụ áp dụng
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                formData.serviceType === ServiceType.HOMESTAY
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                checked={formData.serviceType === ServiceType.HOMESTAY}
                onChange={() =>
                  setFormData({
                    ...formData,
                    serviceType: ServiceType.HOMESTAY,
                  })
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Homestay
              </span>
            </label>

            {/* Restaurant */}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                formData.serviceType === ServiceType.RESTAURANT
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                checked={formData.serviceType === ServiceType.RESTAURANT}
                onChange={() =>
                  setFormData({
                    ...formData,
                    serviceType: ServiceType.RESTAURANT,
                  })
                }
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Nhà hàng
              </span>
            </label>
          </div>
        </div>

        {/* === DATES === */}
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Hiệu lực từ
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => {
                setStartDate(date);
                clearError("validFrom");
              }}
              showTimeInput
              customTimeInput={<TimeSelector />}
              timeInputLabel=""
              dateFormat="dd/MM/yyyy HH:mm:ss"
              locale="vi"
              placeholderText="Chọn ngày giờ bắt đầu"
              portalContainer={document.body}
              popperClassName="!z-[99999]"
              customInput={
                <CustomDateInput
                  placeholder="Chọn ngày bắt đầu"
                  hasError={!!errors.validFrom}
                />
              }
              minDate={new Date()}
            />
            {errors.validFrom && (
              <p className="mt-1 text-xs text-red-500">{errors.validFrom}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Đến ngày
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => {
                setEndDate(date);
                clearError("validUntil");
              }}
              showTimeInput
              customTimeInput={<TimeSelector />}
              timeInputLabel=""
              dateFormat="dd/MM/yyyy HH:mm:ss"
              locale="vi"
              placeholderText="Chọn ngày giờ kết thúc"
              portalContainer={document.body}
              popperClassName="!z-[99999]"
              customInput={
                <CustomDateInput
                  placeholder="Chọn ngày kết thúc"
                  hasError={!!errors.validUntil}
                />
              }
              minDate={startDate || new Date()}
            />
            {errors.validUntil && (
              <p className="mt-1 text-xs text-red-500">{errors.validUntil}</p>
            )}
          </div>
        </div>

        {/* === DISCOUNT === */}
        <div className="flex flex-col gap-2">
          <label className="block text-xs font-bold uppercase text-gray-500">
            Mức giảm giá <span className="text-red-500">*</span>
          </label>

          <div className="flex rounded-lg bg-gray-200 p-1">
            <button
              type="button"
              onClick={() => {
                setDiscountType("PERCENT");
                setErrors({});
              }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                discountType === "PERCENT"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Theo %
            </button>
            <button
              type="button"
              onClick={() => {
                setDiscountType("AMOUNT");
                setErrors({});
              }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                discountType === "AMOUNT"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Theo tiền
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {discountType === "PERCENT" ? (
              <>
                {/* Phần trăm */}
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercent ?? ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        discountPercent: Number(e.target.value),
                      });
                      clearError("discountPercent");
                    }}
                    className={`w-full rounded-md border px-3 py-2 pr-8 outline-none focus:ring-2 ${
                      errors.discountPercent
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                    placeholder="Phần trăm giảm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    %
                  </span>
                  {/* 👇 HIỂN THỊ LỖI PHẦN TRĂM */}
                  {errors.discountPercent && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.discountPercent}
                    </p>
                  )}
                </div>

                {/* Max amount */}
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={formData.maxDiscountAmount ?? ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        maxDiscountAmount: Number(e.target.value),
                      });
                      clearError("maxDiscountAmount");
                    }}
                    className={`w-full rounded-md border px-3 py-2 pr-10 outline-none focus:ring-2 ${
                      errors.maxDiscountAmount
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                    }`}
                    placeholder="Giảm tối đa"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    VNĐ
                  </span>
                  {/* 👇 HIỂN THỊ LỖI GIẢM TỐI ĐA */}
                  {errors.maxDiscountAmount && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.maxDiscountAmount}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="relative col-span-2">
                <input
                  type="number"
                  min="0"
                  value={formData.discountAmount ?? ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      discountAmount: Number(e.target.value),
                    });
                    clearError("discountAmount");
                  }}
                  className={`w-full rounded-md border px-3 py-2 pr-10 outline-none focus:ring-2 ${
                    errors.discountAmount
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                  placeholder="Số tiền giảm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  VNĐ
                </span>
                {/* 👇 HIỂN THỊ LỖI SỐ TIỀN GIẢM */}
                {errors.discountAmount && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.discountAmount}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === QUANTITY & MIN ORDER === */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Số lượng <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              placeholder="VD: 100"
              value={formData.quantity}
              onChange={(e) => {
                setFormData({ ...formData, quantity: Number(e.target.value) });
                clearError("quantity");
              }}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 ${errors.quantity ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Đơn tối thiểu
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                placeholder="VD: 200000"
                value={formData.minOrderValue}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    minOrderValue: Number(e.target.value),
                  });
                  clearError("minOrderValue");
                }}
                className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none placeholder:text-gray-400 ${errors.minOrderValue ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                VNĐ
              </span>
            </div>
            {errors.minOrderValue && (
              <p className="mt-1 text-xs text-red-500">
                {errors.minOrderValue}
              </p>
            )}
          </div>
        </div>

        <label className="flex w-fit cursor-pointer select-none items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={formData.requireAccount}
            onChange={(e) =>
              setFormData({ ...formData, requireAccount: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Yêu cầu khách hàng phải đăng nhập mới được sử dụng
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-70"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {initialData ? "Lưu thay đổi" : "Tạo mã mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CouponFormModal;
