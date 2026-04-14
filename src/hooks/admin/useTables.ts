import { useState, useEffect, useCallback } from "react";
import { tableService } from "../../services/admin/table.service";
import type {
  RestaurantTable,
  RestaurantTableRequest,
  TableStatus,
} from "../../types/admin/table";

export const useTables = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const [meta, setMeta] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaIdFilter, setAreaIdFilter] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) {
        setMeta((prev) => ({ ...prev, page: 0 }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tableService.getAll(
        meta.page,
        meta.size,
        debouncedSearch,
        statusFilter,
        areaIdFilter
      );
      setTables(data.content || []);
      setMeta((prev) => ({
        ...prev,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
      }));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.size, debouncedSearch, statusFilter, areaIdFilter]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = async (data: RestaurantTableRequest) => {
    await tableService.create(data);
    fetchTables();
  };

  const updateTable = async (id: number, data: RestaurantTableRequest) => {
    await tableService.update(id, data);
    fetchTables();
  };

  const deleteTable = async (id: number) => {
    await tableService.delete(id);
    fetchTables();
  };

  const updateStatus = async (id: number, status: TableStatus) => {
    await tableService.updateStatus(id, status);
    fetchTables();
  };

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setMeta((prev) => ({ ...prev, page: 0 }));
  };

  return {
    tables,
    isLoading,
    error,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    statusFilter,
    setStatusFilter,
    areaIdFilter,
    setAreaIdFilter,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    updateStatus,
  };
};