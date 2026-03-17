import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Plus,
  X,
  Check,
  Search,
  ChevronDown,
} from "lucide-react";
import Modal from "../../Modal";
import AmenityFormModal from "../amenities/AmenityFormModal";
import { useAmenities } from "../../../hooks/admin/useAmenities";
import { useRoomClasses } from "../../../hooks/admin/useRoomClasses";
import type {
  RoomTypeRequest,
  HomestayRoomType,
} from "../../../types/admin/room-type";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GalleryItem {
  id: string;
  url: string;
  type: "EXISTING" | "NEW";
  originalId?: number;
  file?: File;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomTypeRequest, images: File[]) => Promise<void>;
  initialData?: HomestayRoomType | null;
}

const SortableImageItem = ({
  item,
  index,
  onRemove,
}: {
  item: GalleryItem;
  index: number;
  onRemove: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative h-24 w-24 shrink-0 cursor-grab overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-blue-400 active:cursor-grabbing"
    >
      <img
        src={item.url}
        alt="preview"
        className="pointer-events-none h-full w-full object-cover"
      />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(item.id)}
        className="absolute right-1 top-1 z-20 rounded-full bg-black/50 p-1 text-white opacity-0 transition-all hover:bg-red-500 group-hover:opacity-100"
      >
        <X size={12} />
      </button>

      {index === 0 && (
        <span className="absolute bottom-0 left-0 w-full bg-blue-600/90 py-0.5 text-center text-[10px] font-medium text-white">
          Ảnh bìa
        </span>
      )}

      {item.type === "NEW" && index !== 0 && (
        <span className="absolute bottom-0 left-0 w-full bg-green-500/80 py-0.5 text-center text-[10px] text-white">
          Mới
        </span>
      )}
    </div>
  );
};

const RoomTypeFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number | string>(0);
  const [maxAdults, setMaxAdults] = useState<number | string>(2);
  const [maxChildren, setMaxChildren] = useState<number | string>(1);
  const [classId, setClassId] = useState<number | "">("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [classSearch, setClassSearch] = useState("");
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<number>>(
    new Set(),
  );
  const [amenitySearch, setAmenitySearch] = useState("");
  const [debouncedAmenitySearch, setDebouncedAmenitySearch] = useState("");

  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { roomClasses, isLoading: loadingClasses } = useRoomClasses(true);
  const {
    amenities,
    fetchAmenities,
    isLoading: loadingAmenities,
  } = useAmenities(true);

  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedAmenitySearch(amenitySearch),
      300,
    );
    return () => clearTimeout(timer);
  }, [amenitySearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        classDropdownRef.current &&
        !classDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClassDropdownOpen(false);
        if (classId) {
          const selected = roomClasses.find((c) => c.classId === classId);
          setClassSearch(selected ? selected.name : "");
        } else {
          setClassSearch("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [classId, roomClasses]);

  useEffect(() => {
    if (classId && roomClasses.length > 0) {
      const selected = roomClasses.find((c) => c.classId === classId);
      if (selected) setClassSearch(selected.name);
    }
  }, [classId, roomClasses]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || "");
        setBasePrice(initialData.basePrice);
        setMaxAdults(initialData.maxAdults);
        setMaxChildren(initialData.maxChildren);
        setClassId(initialData.roomClass?.classId || "");
        setStatus(initialData.status);
        setSelectedAmenityIds(
          new Set(initialData.amenities.map((a) => a.amenityId)),
        );

        const existingItems: GalleryItem[] = (initialData.images || []).map(
          (img) => ({
            id: `old-${img.imageId}`,
            url: img.imageUrl,
            type: "EXISTING",
            originalId: img.imageId,
          }),
        );
        setGallery(existingItems);

        setClassSearch(initialData.roomClass?.name || "");
      } else {
        setName("");
        setDescription("");
        setBasePrice(500000);
        setMaxAdults(2);
        setMaxChildren(1);
        setClassId("");
        setStatus("ACTIVE");
        setSelectedAmenityIds(new Set());
        setGallery([]);
        setClassSearch("");
      }
      setAmenitySearch("");
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Tên loại phòng không được để trống";
    if (!classId) newErrors.classId = "Vui lòng chọn hạng phòng";
    if (basePrice === "" || basePrice === null || Number(basePrice) < 0)
      newErrors.basePrice = "Giá cơ bản không hợp lệ";
    if (maxAdults === "" || Number(maxAdults) < 1)
      newErrors.maxAdults = "Tối thiểu 1 người lớn";
    if (maxChildren === "" || Number(maxChildren) < 0)
      newErrors.maxChildren = "Số trẻ em không được âm";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const mixedOrderIds: number[] = [];
    const newImagesFiles: File[] = [];

    gallery.forEach((item) => {
      if (item.type === "EXISTING") {
        mixedOrderIds.push(item.originalId!);
      } else {
        newImagesFiles.push(item.file!);
        mixedOrderIds.push(-newImagesFiles.length);
      }
    });

    const requestData: RoomTypeRequest = {
      name,
      description,
      basePrice: Number(basePrice),
      maxAdults: Number(maxAdults),
      maxChildren: Number(maxChildren),
      classId: Number(classId),
      amenityIds: Array.from(selectedAmenityIds),
      status,
      keptImageIds: mixedOrderIds,
    };

    try {
      await onSubmit(requestData, newImagesFiles);
      onClose();
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newItems: GalleryItem[] = files.map((file) => ({
        id: `new-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        type: "NEW",
        file: file,
      }));

      setGallery((prev) => [...prev, ...newItems]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveGalleryItem = (id: string) => {
    setGallery((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove && itemToRemove.type === "NEW") {
        URL.revokeObjectURL(itemToRemove.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setGallery((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleAmenity = (id: number) => {
    const newSet = new Set(selectedAmenityIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAmenityIds(newSet);
  };

  const clearError = (field: string) => {
    if (errors[field])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
  };

  const blockInvalidChar = (e: React.KeyboardEvent) =>
    ["e", "E", "+", "-"].includes(e.key) && e.preventDefault();
  const filteredAmenities = amenities.filter((am) =>
    am.name.toLowerCase().includes(debouncedAmenitySearch.toLowerCase()),
  );
  const filteredClasses = roomClasses.filter((c) =>
    c.name.toLowerCase().includes(classSearch.toLowerCase()),
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? "Cập nhật loại phòng" : "Thêm loại phòng mới"}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="relative mb-6 flex flex-col md:block">
            {/* CỘT TRÁI */}
            <div className="w-full space-y-5 md:w-1/2 md:pr-6">
              <h4 className="border-b pb-2 text-sm font-bold uppercase tracking-wide text-gray-800">
                Thông tin chung
              </h4>

              {/* Tên loại phòng */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Tên loại phòng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError("name");
                  }}
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${errors.name ? "border-red-500" : "border-gray-300"}`}
                  placeholder="VD: Deluxe King Ocean View"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Hạng phòng */}
              <div ref={classDropdownRef} className="relative">
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Hạng phòng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={classSearch}
                    onChange={(e) => {
                      setClassSearch(e.target.value);
                      setIsClassDropdownOpen(true);
                      if (e.target.value === "") setClassId("");
                    }}
                    onFocus={() => setIsClassDropdownOpen(true)}
                    placeholder="-- Tìm hoặc chọn hạng phòng --"
                    className={`w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2 ${errors.classId ? "border-red-500" : "border-gray-300"}`}
                  />
                  {classSearch ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClassSearch("");
                        setClassId("");
                        setIsClassDropdownOpen(true);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
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
                {isClassDropdownOpen && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredClasses.length > 0 ? (
                      <ul className="py-1">
                        {filteredClasses.map((cls) => (
                          <li
                            key={cls.classId}
                            onClick={() => {
                              setClassId(cls.classId);
                              setClassSearch(cls.name);
                              setIsClassDropdownOpen(false);
                              clearError("classId");
                            }}
                            className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm hover:bg-blue-50 ${classId === cls.classId ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"}`}
                          >
                            <span>{cls.name}</span>
                            {classId === cls.classId && (
                              <Check size={16} className="text-blue-600" />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-center text-sm text-gray-500">
                        Không tìm thấy
                      </div>
                    )}
                  </div>
                )}
                {errors.classId && (
                  <p className="mt-1 text-xs text-red-500">{errors.classId}</p>
                )}
              </div>

              {/* Giá & Sức chứa */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Giá cơ bản (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={basePrice}
                    onKeyDown={blockInvalidChar}
                    onChange={(e) => {
                      setBasePrice(e.target.value);
                      clearError("basePrice");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 font-medium outline-none focus:ring-2 ${errors.basePrice ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>
                {errors.basePrice && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.basePrice}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                    Người lớn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxAdults}
                    onChange={(e) => {
                      setMaxAdults(e.target.value);
                      clearError("maxAdults");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${errors.maxAdults ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.maxAdults && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.maxAdults}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                    Trẻ em <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxChildren}
                    onChange={(e) => {
                      setMaxChildren(e.target.value);
                      clearError("maxChildren");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${errors.maxChildren ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.maxChildren && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.maxChildren}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2"
                  placeholder="Mô tả chi tiết..."
                />
              </div>

              {/* 👇 4. Phần Upload & Kéo thả ảnh */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Hình ảnh ({gallery.length})
                </label>

                {/* Khu vực Dropzone */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="custom-scrollbar mb-3 flex gap-2 overflow-x-auto rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2">
                    {gallery.length === 0 ? (
                      <div className="flex h-24 w-full flex-col items-center justify-center text-gray-400">
                        <span className="text-xs">Chưa có ảnh</span>
                      </div>
                    ) : (
                      <SortableContext
                        items={gallery.map((i) => i.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {gallery.map((item, index) => (
                          <SortableImageItem
                            key={item.id}
                            item={item}
                            index={index}
                            onRemove={handleRemoveGalleryItem}
                          />
                        ))}
                      </SortableContext>
                    )}

                    {/* Nút Thêm ảnh (Mini) */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50"
                    >
                      <Plus size={20} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500">
                        Thêm ảnh
                      </span>
                    </div>
                  </div>
                </DndContext>

                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* CỘT PHẢI (Giữ nguyên) */}
            <div className="mt-6 flex w-full flex-col border-l border-gray-100 md:absolute md:bottom-0 md:right-0 md:top-0 md:mt-0 md:w-1/2 md:pl-6">
              {/* ... (Phần tiện ích giữ nguyên code cũ) ... */}
              <div className="mb-4 flex items-center justify-between border-b pb-2">
                <h4 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                  Tiện ích{" "}
                  <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    {selectedAmenityIds.size}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAmenityModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  <Plus size={14} /> Thêm nhanh
                </button>
              </div>

              <div className="relative mb-3 flex-shrink-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  value={amenitySearch}
                  onChange={(e) => setAmenitySearch(e.target.value)}
                  placeholder="Tìm tiện ích..."
                  className="w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                {amenitySearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmenitySearch("");
                      setDebouncedAmenitySearch("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="custom-scrollbar flex-1 overflow-y-auto rounded-lg border bg-gray-50 p-2">
                {loadingAmenities ? (
                  <div className="p-4 text-center">
                    <Loader2 className="mx-auto animate-spin text-blue-500" />
                  </div>
                ) : filteredAmenities.length === 0 ? (
                  <div className="flex h-full min-h-[150px] flex-col items-center justify-center p-4 text-gray-400">
                    <p className="text-center text-sm">
                      Không tìm thấy "{debouncedAmenitySearch}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAmenities.map((am) => (
                      <div
                        key={am.amenityId}
                        onClick={() => toggleAmenity(am.amenityId)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-all ${selectedAmenityIds.has(am.amenityId) ? "border-blue-500 bg-white shadow-sm ring-1 ring-blue-500" : "border-gray-200 bg-white hover:border-blue-300"}`}
                      >
                        <div
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${selectedAmenityIds.has(am.amenityId) ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-gray-50"}`}
                        >
                          {selectedAmenityIds.has(am.amenityId) && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700">{am.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}{" "}
              {initialData ? "Lưu thay đổi" : "Tạo mới"}
            </button>
          </div>
        </form>
      </Modal>

      <AmenityFormModal
        isOpen={isAmenityModalOpen}
        onClose={() => setIsAmenityModalOpen(false)}
        onSubmit={async (data) => {
          const { amenityService } =
            await import("../../../services/admin/amenity.service");
          await amenityService.create(data);
          await fetchAmenities(true);
          setIsAmenityModalOpen(false);
        }}
      />
    </>
  );
};

export default RoomTypeFormModal;
