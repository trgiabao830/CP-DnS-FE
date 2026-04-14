import {
  type Coupon,
  type CouponRequest,
  type PageResponse,
  CouponStatus,
} from "../../types/admin/coupon";

const BASE_URL = "/api/admin/coupons";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
      throw {
        status: response.status,
        message: errorMessage,
        error: errorBody.error,
      };
    } catch (e: any) {
      if (e.status) throw e;
      const textError = await response.text().catch(() => null);
      if (textError) errorMessage = textError;
      throw { status: response.status, message: errorMessage };
    }
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json")
    ? await response.json()
    : await response.text();
};

export const couponService = {
  getAll: async (
    page: number,
    size: number,
    keyword: string = "",
    serviceType: string = "",
    status: string = "",
    onlyActive: boolean = false, 
  ): Promise<PageResponse<Coupon>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (keyword) params.append("keyword", keyword);
    if (serviceType) params.append("serviceType", serviceType);
    if (status) params.append("status", status);

    if (onlyActive) params.append("onlyActive", "true");

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    return handleResponse(response);
  },

  create: async (data: CouponRequest): Promise<Coupon> => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: number, data: CouponRequest): Promise<Coupon> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateStatus: async (id: number, status: CouponStatus) => {
    const response = await fetch(`${BASE_URL}/${id}/status?status=${status}`, {
      method: "PATCH",
    });
    return handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    return handleResponse(response);
  },
};
