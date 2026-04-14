import React, { useState, useEffect, useRef } from "react";
import { Loader2, ChevronDown, X, Check } from "lucide-react";
import Modal from "../../Modal";
import type { HomestayRoom, RoomRequest, RoomStatus } from "../../../types/admin/room";
import { useRoomTypes } from "../../../hooks/admin/useRoomTypes";
import { useRoomClasses } from "../../../hooks/admin/useRoomClasses";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomRequest) => Promise<void>;
  initialData?: HomestayRoom | null;
}

const RoomFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [roomNumber, setRoomNumber] = useState("");
  const [status, setStatus] = useState<RoomStatus>("AVAILABLE");

  const [classId, setClassId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number | "">("");

  const [classSearch, setClassSearch] = useState("");
  const [typeSearch, setTypeSearch] = useState("");

  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const classWrapperRef = useRef<HTMLDivElement>(null);
  const typeWrapperRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { roomTypes } = useRoomTypes(true);
  const { roomClasses } = useRoomClasses(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        classWrapperRef.current &&
        !classWrapperRef.current.contains(event.target as Node)
      ) {
        setIsClassOpen(false);
      }
      if (
        typeWrapperRef.current &&
        !typeWrapperRef.current.contains(event.target as Node)
      ) {
        setIsTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClasses = roomClasses.filter((c) =>
    c.name.toLowerCase().includes(classSearch.toLowerCase()),
  );

  const filteredRoomTypes = roomTypes.filter((type) => {
    if (!classId) return false;
    if (type.roomClass?.classId !== Number(classId)) return false;

    return type.name.toLowerCase().includes(typeSearch.toLowerCase());
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setRoomNumber(initialData.roomNumber);
        setStatus(initialData.status);

        let currentClassId: number | "" = "";
        if (initialData.roomType.roomClass) {
          currentClassId = initialData.roomType.roomClass.classId;
          setClassId(currentClassId);
          setClassSearch(initialData.roomType.roomClass.name);
        } else {
          const foundType = roomTypes.find(
            (t) => t.typeId === initialData.roomType.typeId,
          );
          if (foundType && foundType.roomClass) {
            currentClassId = foundType.roomClass.classId;
            setClassId(currentClassId);
            setClassSearch(foundType.roomClass.name);
          }
        }

        setTypeId(initialData.roomType.typeId);
        setTypeSearch(initialData.roomType.name);
      } else {
        setRoomNumber("");
        setClassId("");
        setClassSearch("");
        setTypeId("");
        setTypeSearch("");
        setStatus("AVAILABLE");
      }
      setErrors({});
      setIsClassOpen(false);
      setIsTypeOpen(false);
    }
  }, [isOpen, initialData, roomTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!roomNumber.trim())
      newErrors.roomNumber = "Số phòng không được để trống";
    if (!classId) newErrors.classId = "Vui lòng chọn hạng phòng";
    if (!typeId) newErrors.typeId = "Vui lòng chọn loại phòng";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        roomNumber,
        typeId: Number(typeId),
        status,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Cập nhật phòng" : "Thêm phòng mới"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. INPUT CHỌN HẠNG PHÒNG */}
        <div ref={classWrapperRef} className="relative">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Hạng phòng <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={classSearch}
              onChange={(e) => {
                setClassSearch(e.target.value);
                setIsClassOpen(true);
                if (e.target.value === "") setClassId("");
              }}
              onFocus={() => setIsClassOpen(true)}
              placeholder="-- Tìm hoặc chọn hạng phòng --"
              className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 outline-none focus:ring-2 ${errors.classId ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"}`}
            />
            {classSearch ? (
              <button
                type="button"
                onClick={() => {
                  setClassSearch("");
                  setClassId("");
                  setTypeSearch("");
                  setTypeId("");
                  setIsClassOpen(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            ) : (
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            )}
          </div>

          {isClassOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredClasses.length > 0 ? (
                <ul className="py-1">
                  {filteredClasses.map((cls) => (
                    <li
                      key={cls.classId}
                      onClick={() => {
                        setClassId(cls.classId);
                        setClassSearch(cls.name);

                        setTypeId("");
                        setTypeSearch("");

                        setIsClassOpen(false);
                        setErrors({ ...errors, classId: "" });
                      }}
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-blue-50 ${classId === cls.classId ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"}`}
                    >
                      {cls.name}
                      {classId === cls.classId && <Check size={16} />}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Không tìm thấy hạng phòng
                </div>
              )}
            </div>
          )}

          {errors.classId && (
            <p className="mt-1 text-xs text-red-500">{errors.classId}</p>
          )}
        </div>

        <div ref={typeWrapperRef} className="relative">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Loại phòng <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={typeSearch}
              onChange={(e) => {
                setTypeSearch(e.target.value);
                setIsTypeOpen(true);
                if (e.target.value === "") setTypeId("");
              }}
              onFocus={() => setIsTypeOpen(true)}
              disabled={!classId}
              placeholder={
                !classId
                  ? "-- Vui lòng chọn hạng phòng trước --"
                  : "-- Tìm hoặc chọn loại phòng --"
              }
              className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400 ${errors.typeId ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"}`}
            />
            {typeSearch && classId ? (
              <button
                type="button"
                onClick={() => {
                  setTypeSearch("");
                  setTypeId("");
                  setIsTypeOpen(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            ) : (
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            )}
          </div>

          {/* Dropdown Menu */}
          {isTypeOpen && classId && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredRoomTypes.length > 0 ? (
                <ul className="py-1">
                  {filteredRoomTypes.map((type) => (
                    <li
                      key={type.typeId}
                      onClick={() => {
                        setTypeId(type.typeId);
                        setTypeSearch(type.name);
                        setIsTypeOpen(false);
                        setErrors({ ...errors, typeId: "" });
                      }}
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-blue-50 ${typeId === type.typeId ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"}`}
                    >
                      <span>
                        {type.name} -{" "}
                        <span className="text-xs text-gray-500">
                          {new Intl.NumberFormat("vi-VN").format(
                            type.basePrice,
                          )}
                          đ
                        </span>
                      </span>
                      {typeId === type.typeId && <Check size={16} />}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {roomTypes.length === 0
                    ? "Chưa có dữ liệu loại phòng"
                    : "Không tìm thấy loại phòng phù hợp"}
                </div>
              )}
            </div>
          )}

          {errors.typeId && (
            <p className="mt-1 text-xs text-red-500">{errors.typeId}</p>
          )}
        </div>

        {/* Số phòng */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Số phòng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => {
              setRoomNumber(e.target.value);
              setErrors({ ...errors, roomNumber: "" });
            }}
            className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${errors.roomNumber ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-500"}`}
            placeholder="VD: 101, 202..."
          />
          {errors.roomNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.roomNumber}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />} Lưu
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RoomFormModal;
