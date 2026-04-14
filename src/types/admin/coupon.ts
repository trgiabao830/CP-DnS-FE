export type ServiceType = "RESTAURANT" | "HOMESTAY";

export const ServiceType = {
  RESTAURANT: "RESTAURANT",
  HOMESTAY: "HOMESTAY",
} as const;

export type CouponStatus = "AVAILABLE" | "UNAVAILABLE";

export const CouponStatus = {
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export interface Coupon {
  couponId: number;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  maxDiscountAmount?: number;
  minOrderValue: number;
  quantity: number;
  usedCount: number;
  serviceType: ServiceType;
  validFrom: string;
  validUntil: string;
  requireAccount: boolean;
  status: CouponStatus;
  deleted: boolean;
}

export interface CouponRequest {
  code: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
  maxDiscountAmount?: number | null;
  minOrderValue: number;
  quantity: number;
  serviceType: ServiceType;
  validFrom: string;
  validUntil: string;
  requireAccount: boolean;
  status: CouponStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
