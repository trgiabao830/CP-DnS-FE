import { useState, useCallback, useEffect } from "react";
import type {
  HomestayRoomType,
  RoomTypeRequest,
  HomestayCommonStatus,
} from "../../types/admin/room-type";
import { roomTypeService } from "../../services/admin/room-type.service";

export const useRoomTypes = () => {
  const [roomTypes, setRoomTypes] = useState<HomestayRoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");

  const [meta, setMeta] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) setMeta((p) => ({ ...p, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setMeta((prev) => ({ ...prev, page: 0 }));
  };

  const fetchRoomTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await roomTypeService.getAll(
        meta.page,
        meta.size,
        debouncedSearch,
        statusFilter,
        classFilter,
      );
      setRoomTypes(res.content || []);
      setMeta((p) => ({
        ...p,
        totalPages: res.totalPages,
        totalElements: res.totalElements,
      }));
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.size, debouncedSearch, statusFilter, classFilter]);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  const createRoomType = async (data: RoomTypeRequest, images: File[]) => {
    await roomTypeService.create(data, images);
    fetchRoomTypes();
  };

  const updateRoomType = async (
    id: number,
    data: RoomTypeRequest,
    newImages: File[],
  ) => {
    await roomTypeService.update(id, data, newImages);
    fetchRoomTypes();
  };

  const updateStatus = async (id: number, status: HomestayCommonStatus) => {
    setRoomTypes((prev) =>
      prev.map((item) => (item.typeId === id ? { ...item, status } : item)),
    );
    try {
      await roomTypeService.updateStatus(id, status);
    } catch (err) {
      fetchRoomTypes();
      throw err;
    }
  };

  const deleteRoomType = async (id: number) => {
    await roomTypeService.delete(id);
    fetchRoomTypes();
  };

  return {
    roomTypes,
    isLoading,
    error,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
    fetchRoomTypes,
    createRoomType,
    updateRoomType,
    updateStatus,
    deleteRoomType,
  };
};
