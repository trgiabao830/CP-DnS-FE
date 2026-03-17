import { useState, useCallback, useEffect } from "react";
import type {
  HomestayAmenity,
  AmenityRequest,
  HomestayCommonStatus,
} from "../../types/admin/amenity";
import { amenityService } from "../../services/admin/amenity.service";

export const useAmenities = (initUnpaged = false) => {
  const [amenities, setAmenities] = useState<HomestayAmenity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

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
      if (search !== debouncedSearch) {
        setMeta((prev) => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setMeta((prev) => ({ ...prev, page: 0 }));
  };

  const fetchAmenities = useCallback(
    async (isUnpagedMode = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const shouldFetchUnpaged = isUnpagedMode || initUnpaged;

        const res = await amenityService.getAll(
          meta.page,
          meta.size, 
          debouncedSearch,
          statusFilter,
          shouldFetchUnpaged,
        );

        if (shouldFetchUnpaged) {
          setAmenities(res.content || []);
          setMeta((prev) => ({ ...prev, totalElements: res.totalElements }));
        } else {
          setAmenities(res.content || []);
          setMeta((prev) => ({
            ...prev,
            totalPages: res.totalPages,
            totalElements: res.totalElements,
          }));
        }
      } catch (err: any) {
        console.error("Failed to fetch amenities", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [meta.page, meta.size, debouncedSearch, statusFilter, initUnpaged],
  );

  useEffect(() => {
    fetchAmenities(initUnpaged);
  }, [fetchAmenities, initUnpaged]);

  const createAmenity = async (data: AmenityRequest) => {
    setError(null);
    try {
      await amenityService.create(data);
      if (!initUnpaged && meta.page !== 0) {
        setMeta((prev) => ({ ...prev, page: 0 }));
      } else {
        fetchAmenities(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err; 
    }
  };

  const updateAmenity = async (id: number, data: AmenityRequest) => {
    setError(null);
    try {
      await amenityService.update(id, data);
      fetchAmenities(initUnpaged);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteAmenity = async (id: number) => {
    setError(null);
    try {
      await amenityService.delete(id);

      if (!initUnpaged && meta.page > 0 && amenities.length === 1) {
        setMeta((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchAmenities(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateStatus = async (id: number, status: HomestayCommonStatus) => {
    setError(null);
    try {
      setAmenities((prev) =>
        prev.map((item) =>
          item.amenityId === id ? { ...item, status } : item,
        ),
      );

      await amenityService.updateStatus(id, status);
    } catch (err) {
      fetchAmenities(initUnpaged);
      setError(err);
      throw err;
    }
  };

  return {
    amenities,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    fetchAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    updateStatus,
    setAmenities,
  };
};
