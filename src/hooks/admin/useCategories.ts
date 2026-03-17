import { useState, useCallback, useEffect } from 'react';
import type { Category, CategoryRequest, ReorderItem } from '../../types/admin/categories';
import { categoryService } from '../../services/admin/category.service';

export const useCategories = (initUnpaged = false) => {
  const [categories, setCategories] = useState<Category[]>([]);
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

  const fetchCategories = useCallback(async (isUnpagedMode = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await categoryService.getAll(
        meta.page, 
        meta.size, 
        debouncedSearch,
        statusFilter,
        isUnpagedMode || initUnpaged 
      );
      
      if (isUnpagedMode || initUnpaged) {
         setCategories(res.content || []); 
      } else {
         setCategories(res.content || []);
         setMeta(prev => ({
           ...prev,
           totalPages: res.totalPages,
           totalElements: res.totalElements
         }));
      }
    } catch (err: any) {
      console.error("Failed to fetch categories", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.size, debouncedSearch, statusFilter, initUnpaged]);

  useEffect(() => {
    fetchCategories(initUnpaged); 
  }, [fetchCategories, initUnpaged]);

  const createCategory = async (data: CategoryRequest) => {
    setError(null);
    try {
      await categoryService.create(data);
      if (!initUnpaged && meta.page !== 0) {
          setMeta(prev => ({ ...prev, page: 0 }));
      } else {
          fetchCategories(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateCategory = async (id: number, data: CategoryRequest) => {
    setError(null);
    try {
      await categoryService.update(id, data);
      fetchCategories(initUnpaged);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteCategory = async (id: number) => {
    setError(null);
    try {
      await categoryService.delete(id);
      
      if (!initUnpaged && meta.page > 0 && categories.length === 1) {
        setMeta(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchCategories(initUnpaged);
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateStatus = async (id: number, status: 'AVAILABLE' | 'UNAVAILABLE') => {
    setError(null);
    try {
      await categoryService.updateStatus(id, status);
      fetchCategories(initUnpaged);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const reorderCategories = async (items: ReorderItem[]) => {
    setError(null);
    try {
      await categoryService.reorder(items);
      fetchCategories(initUnpaged); 
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    categories,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    meta,
    setMeta,
    search,
    setSearch,
    clearSearch,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateStatus,
    reorderCategories,
    setCategories 
  };
};