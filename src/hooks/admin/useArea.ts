import { useState, useCallback, useEffect } from 'react';
import type { RestaurantArea, RestaurantAreaRequest, AreaStatus } from '../../types/admin/area';
import { areaService } from '../../services/admin/area.service';

export const useAreas = (initUnpaged = false) => {
  const [areas, setAreas] = useState<RestaurantArea[]>([]);
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
  }, [search]);

  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setMeta(prev => ({ ...prev, page: 0 }));
  };

  const fetchAreas = useCallback(async (isUnpagedMode = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await areaService.getAll(
        meta.page, 
        meta.size, 
        debouncedSearch,
        statusFilter,
        isUnpagedMode || initUnpaged 
      );
      
      if (isUnpagedMode || initUnpaged) {
         setAreas(res.content || []); 
      } else {
         setAreas(res.content || []);
         setMeta(prev => ({
           ...prev,
           totalPages: res.totalPages,
           totalElements: res.totalElements
         }));
      }
    } catch (err: any) {
      console.error("Failed to fetch areas", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.size, debouncedSearch, statusFilter, initUnpaged]);

  useEffect(() => {
    fetchAreas(initUnpaged); 
  }, [fetchAreas, initUnpaged]);


  const createArea = async (data: RestaurantAreaRequest) => {
    setError(null);
    try {
      await areaService.create(data);
      if (!initUnpaged && meta.page !== 0) {
          setMeta(prev => ({ ...prev, page: 0 }));
      } else {
          fetchAreas(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateArea = async (id: number, data: RestaurantAreaRequest) => {
    setError(null);
    try {
      await areaService.update(id, data);
      fetchAreas(initUnpaged);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteArea = async (id: number) => {
    setError(null);
    try {
      await areaService.delete(id);
      
      if (!initUnpaged && meta.page > 0 && areas.length === 1) {
        setMeta(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchAreas(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateStatus = async (id: number, status: AreaStatus) => {
    setError(null);
    try {
      await areaService.updateStatus(id, status);
      fetchAreas(initUnpaged);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    areas,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
    updateStatus,
    setAreas
  };
};