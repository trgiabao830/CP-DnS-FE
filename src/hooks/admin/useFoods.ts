import { useState, useCallback, useEffect } from 'react';
import type { Food, FoodRequest, FoodReorderItem, FoodStatus } from '../../types/admin/food';
import { foodService } from '../../services/admin/food.service';

export const useFoods = (initialCategoryId?: number) => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [meta, setMeta] = useState({
    page: 0, size: 10, totalPages: 0, totalElements: 0,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) setMeta(prev => ({ ...prev, page: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFoods = useCallback(async (isReorderMode = false) => {
    setIsLoading(true);
    setError(null);
    try {
      let res;

      if (initialCategoryId) {
        res = await foodService.getByCategory(
          initialCategoryId,
          meta.page,
          meta.size,
          debouncedSearch,
          statusFilter,
          isReorderMode
        );
      } 
      else {
        res = await foodService.getAll(
            meta.page,
            meta.size,
            debouncedSearch,
            statusFilter,
            categoryFilter 
        );
      }

      if (isReorderMode) {
        setFoods(res.content || []);
      } else {
        setFoods(res.content || []);
        setMeta(prev => ({
          ...prev,
          totalPages: res.totalPages,
          totalElements: res.totalElements
        }));
      }
    } catch (err: any) {
      console.error("Failed to fetch foods", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [initialCategoryId, meta.page, meta.size, debouncedSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchFoods(false);
  }, [fetchFoods]);

  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setMeta(prev => ({ ...prev, page: 0 }));
  };


  const createFood = async (data: FoodRequest, file?: File) => {
    setError(null);
    try {
      await foodService.create(data, file);
      if (meta.page !== 0) setMeta(prev => ({ ...prev, page: 0 }));
      else fetchFoods();
    } catch (err) { setError(err); throw err; }
  };

  const updateFood = async (id: number, data: FoodRequest, file?: File) => {
    setError(null);
    try {
      await foodService.update(id, data, file);
      fetchFoods();
    } catch (err) { setError(err); throw err; }
  };

  const deleteFood = async (id: number) => {
    setError(null);
    try {
      await foodService.delete(id);
      if (meta.page > 0 && foods.length === 1) {
        setMeta(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchFoods();
      }
    } catch (err) { setError(err); throw err; }
  };

  const updateStatus = async (id: number, status: FoodStatus) => {
    setError(null);
    try {
      await foodService.updateStatus(id, status);
      fetchFoods();
    } catch (err) { setError(err); throw err; }
  };

  const reorderFoods = async (items: FoodReorderItem[]) => {
    if (!initialCategoryId) {
        console.warn("Cannot reorder in All Foods view");
        return;
    }
    setError(null);
    try {
      await foodService.reorder(items);
      fetchFoods(false);
    } catch (err) { setError(err); throw err; }
  };

  return {
    foods,
    isLoading,
    error,
    meta, setMeta,
    search, setSearch, clearSearch,
    statusFilter, setStatusFilter,
    
    categoryFilter, setCategoryFilter,

    fetchFoods,
    createFood,
    updateFood,
    deleteFood,
    updateStatus,
    reorderFoods,
    setFoods
  };
};