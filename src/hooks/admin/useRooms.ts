import { useState, useCallback, useEffect } from "react";
import type { HomestayRoom, RoomRequest, RoomStatus } from "../../types/admin/room";
import { roomService } from "../../services/admin/room.service";

export const useRooms = () => {
  const [rooms, setRooms] = useState<HomestayRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
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

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await roomService.getAll(
        meta.page,
        meta.size,
        debouncedSearch,
        statusFilter,
        typeFilter,
        classFilter
      );
      setRooms(res.content || []);
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
  }, [meta.page, meta.size, debouncedSearch, statusFilter, typeFilter, classFilter]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = async (data: RoomRequest) => {
    await roomService.create(data);
    fetchRooms();
  };

  const updateRoom = async (id: number, data: RoomRequest) => {
    await roomService.update(id, data);
    fetchRooms();
  };

  const updateStatus = async (id: number, status: RoomStatus) => {
    setRooms((prev) =>
      prev.map((item) => (item.roomId === id ? { ...item, status } : item)),
    );
    try {
      await roomService.updateStatus(id, status);
    } catch (err) {
      fetchRooms();
      throw err;
    }
  };

  const deleteRoom = async (id: number) => {
    await roomService.delete(id);
    fetchRooms();
  };

  return {
    rooms,
    isLoading,
    error,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    classFilter,
    setClassFilter,
    fetchRooms,
    createRoom,
    updateRoom,
    updateStatus,
    deleteRoom,
  };
};
