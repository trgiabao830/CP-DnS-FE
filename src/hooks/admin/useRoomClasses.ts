import { useState, useCallback, useEffect } from 'react';
import type { HomestayRoomClass, RoomClassRequest, HomestayCommonStatus } from '../../types/admin/room-class';
import { roomClassService } from '../../services/admin/room-class.service';

export const useRoomClasses = (initUnpaged = false) => {
  const [roomClasses, setRoomClasses] = useState<HomestayRoomClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [meta, setMeta] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) {
        setMeta(prev => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setMeta(prev => ({ ...prev, page: 0 }));
  };

  const fetchRoomClasses = useCallback(async (isUnpagedMode = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const shouldFetchUnpaged = isUnpagedMode || initUnpaged;

      const res = await roomClassService.getAll(
        meta.page,
        meta.size,
        debouncedSearch,
        statusFilter,
        shouldFetchUnpaged
      );
      
      if (shouldFetchUnpaged) {
         setRoomClasses(res.content || []); 
         setMeta(prev => ({ ...prev, totalElements: res.totalElements }));
      } else {
         setRoomClasses(res.content || []);
         setMeta(prev => ({
           ...prev,
           totalPages: res.totalPages,
           totalElements: res.totalElements,
           page: res.number
         }));
      }
    } catch (err: any) {
      console.error("Failed to fetch room classes", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.size, debouncedSearch, statusFilter, initUnpaged]);

  useEffect(() => {
    fetchRoomClasses(initUnpaged); 
  }, [fetchRoomClasses, initUnpaged]);

  const createRoomClass = async (data: RoomClassRequest) => {
    setError(null);
    try {
      await roomClassService.create(data);
      if (!initUnpaged && meta.page !== 0) {
          setMeta(prev => ({ ...prev, page: 0 }));
      } else {
          fetchRoomClasses(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateRoomClass = async (id: number, data: RoomClassRequest) => {
    setError(null);
    try {
      await roomClassService.update(id, data);
      fetchRoomClasses(initUnpaged);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteRoomClass = async (id: number) => {
    setError(null);
    try {
      await roomClassService.delete(id);
      
      if (!initUnpaged && meta.page > 0 && roomClasses.length === 1) {
        setMeta(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchRoomClasses(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateStatus = async (id: number, status: HomestayCommonStatus) => {
    setError(null);
    try {
      setRoomClasses(prev => prev.map(item => 
        item.classId === id ? { ...item, status } : item
      ));

      await roomClassService.updateStatus(id, status);
    } catch (err) {
      fetchRoomClasses(initUnpaged);
      setError(err);
      throw err;
    }
  };

  return {
    roomClasses,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    fetchRoomClasses,
    createRoomClass,
    updateRoomClass,
    deleteRoomClass,
    updateStatus
  };
};