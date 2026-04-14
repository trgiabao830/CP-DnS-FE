import React, { useState, useEffect, useRef } from "react";
import { Loader2, X, Check } from "lucide-react"; 
import Modal from "../../Modal";
import type {
  RestaurantTable,
  RestaurantTableRequest,
} from "../../../types/admin/table";
import type { RestaurantArea } from "../../../types/admin/area";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RestaurantTableRequest) => Promise<void>;
  initialData?: RestaurantTable | null;
  areas: RestaurantArea[];
}

interface FormErrors {
  tableNumber?: string;
  capacity?: string;
  areaId?: string;
}

const TableFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  areas,
}) => {
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  
  const [areaId, setAreaId] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTableNumber(initialData.tableNumber);
        setCapacity(initialData.capacity);
        setAreaId(initialData.area.areaId);
        
        const foundArea = areas.find(a => a.areaId === initialData.area.areaId);
        setSearchTerm(foundArea ? foundArea.name : "");
      } else {
        setTableNumber("");
        setCapacity("");
        setAreaId("");
        setSearchTerm("");
      }
      setErrors({});
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialData, areas]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    if (!tableNumber.trim()) newErrors.tableNumber = "Tên/Số bàn không được để trống";
    if (!capacity || Number(capacity) <= 0) newErrors.capacity = "Sức chứa phải lớn hơn 0";
    if (!areaId) newErrors.areaId = "Vui lòng chọn khu vực"; 

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        tableNumber,
        capacity: Number(capacity),
        areaId: Number(areaId),
      });
      onClose();
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectArea = (area: RestaurantArea) => {
    setAreaId(area.areaId);
    setSearchTerm(area.name);
    setIsDropdownOpen(false);
    clearError("areaId");
  };

  const handleClearArea = () => {
    setAreaId("");
    setSearchTerm("");
    setErrors((prev) => ({ ...prev, areaId: "Vui lòng chọn khu vực" }));
    setIsDropdownOpen(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Cập nhật Bàn" : "Thêm Bàn mới"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5" > {/* Tăng minHeight để dropdown không bị che nếu cần */}
        
        
        <div ref={dropdownRef}>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Khu vực <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onClick={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setAreaId("");
                setIsDropdownOpen(true);
              }}
              placeholder="-- Chọn khu vực --"
              className={`w-full rounded-lg border py-2 pl-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.areaId ? "border-red-500" : "border-gray-300"
              }`}
            />
            
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearArea}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 max-h-32 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {filteredAreas.length > 0 ? (
                  <ul className="py-1">
                    {filteredAreas.map((area) => (
                      <li
                        key={area.areaId}
                        onClick={() => handleSelectArea(area)}
                        className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-blue-50 ${
                          areaId === area.areaId ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                        }`}
                      >
                        {area.name}
                        {areaId === area.areaId && <Check size={16} />}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Không tìm thấy kết quả "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
          {errors.areaId && (
            <p className="mt-1 text-xs font-medium text-red-500">
              {errors.areaId}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Số bàn / Tên bàn <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => {
                  setTableNumber(e.target.value);
                  clearError("tableNumber");
                }}
                className={`w-full rounded-lg border py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tableNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="VD: Bàn 01..."
              />
            </div>
            {errors.tableNumber && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {errors.tableNumber}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sức chứa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => {
                  setCapacity(Number(e.target.value));
                  clearError("capacity");
                }}
                className={`w-full rounded-lg border py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.capacity ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="VD: 2"
              />
            </div>
            {errors.capacity && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {errors.capacity}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
            Lưu thông tin
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TableFormModal;