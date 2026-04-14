import { useState, useCallback, useEffect } from "react";
import { couponService } from "../../services/admin/coupon.service";
import type {
  Coupon,
  CouponRequest,
  CouponStatus,
  PageResponse,
} from "../../types/admin/coupon";

export const useCoupons = (initialSize = 10) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const [meta, setMeta] = useState({
    page: 0,
    size: initialSize,
    totalPages: 0,
    totalElements: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: PageResponse<Coupon> = await couponService.getAll(
        meta.page,
        meta.size,
        debouncedSearch,
        serviceTypeFilter,
        statusFilter,
        onlyActive,
      );
      setCoupons(data.content);
      setMeta((prev) => ({
        ...prev,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
      }));
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    meta.page,
    meta.size,
    debouncedSearch,
    serviceTypeFilter,
    statusFilter,
    onlyActive,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const createCoupon = async (data: CouponRequest) => {
    setIsLoading(true);
    try {
      const res = await couponService.create(data);
      await fetchCoupons();
      return res;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoupon = async (id: number, data: CouponRequest) => {
    setIsLoading(true);
    try {
      const res = await couponService.update(id, data);
      await fetchCoupons();
      return res;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: number, status: CouponStatus) => {
    const previousCoupons = [...coupons];
    setCoupons((prev) =>
      prev.map((c) => (c.couponId === id ? { ...c, status } : c)),
    );

    try {
      const res = await couponService.updateStatus(id, status);
      return res;
    } catch (err: any) {
      setCoupons(previousCoupons);
      throw err;
    }
  };

  const deleteCoupon = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await couponService.delete(id);
      await fetchCoupons();
      return res;
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setServiceTypeFilter("");
    setStatusFilter("");
    setOnlyActive(false);
    setMeta((prev) => ({ ...prev, page: 0 }));
  };

  return {
    coupons,
    isLoading,
    error,
    meta,
    setMeta,
    search,
    setSearch,
    serviceTypeFilter,
    setServiceTypeFilter,
    statusFilter,
    setStatusFilter,
    onlyActive,
    setOnlyActive,
    clearSearch,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    updateStatus,
    deleteCoupon,
  };
};
