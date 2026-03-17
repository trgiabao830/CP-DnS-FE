import type {
  AdminBookingSummary,
  AdminBookingDetail,
  BookingStatus,
  PageResponse,
} from "../../types/admin/booking";
import type {
  ChartDataResponse,
  RestaurantStatisticResponse,
} from "../../types/admin/statistic";

const BASE_URL = "/api/admin/restaurant";

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMessage = `Lỗi ${res.status}: ${res.statusText}`;
    try {
      const errorBody = await res.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;

      throw {
        status: res.status,
        message: errorMessage,
        error: errorBody.error,
      };
    } catch (e: any) {
      if (e.status) throw e;

      const textError = await res.text().catch(() => null);
      if (textError) errorMessage = textError;

      throw { status: res.status, message: errorMessage };
    }
  }

  if (res.status === 204) return null; 

  const contentType = res.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  } else {
    const text = await res.text();
    return { message: text };
  }
};

export const restaurantService = {
  getBookings: async (params: {
    page: number;
    size: number;
    keyword?: string;
    status?: BookingStatus | "";
    fromDate?: string; 
    toDate?: string; 
  }): Promise<PageResponse<AdminBookingSummary>> => {
    const queryParams = new URLSearchParams();

    queryParams.append("page", params.page.toString());
    queryParams.append("size", params.size.toString());

    if (params.keyword) queryParams.append("keyword", params.keyword);
    if (params.status) queryParams.append("status", params.status);
    if (params.fromDate) queryParams.append("fromDate", params.fromDate);
    if (params.toDate) queryParams.append("toDate", params.toDate);

    const response = await fetch(
      `${BASE_URL}/booking?${queryParams.toString()}`,
    );
    return await handleResponse(response);
  },

  getBookingDetail: async (bookingId: number): Promise<AdminBookingDetail> => {
    const response = await fetch(`${BASE_URL}/booking/${bookingId}`);
    return await handleResponse(response);
  },

  updateBookingStatus: async (
    bookingId: number,
    status: BookingStatus,
  ): Promise<AdminBookingDetail> => {
    const params = new URLSearchParams();
    params.append("status", status);

    const response = await fetch(
      `${BASE_URL}/booking/${bookingId}/status?${params.toString()}`,
      {
        method: "PUT",
      },
    );
    return await handleResponse(response);
  },

  cancelBookingByAdmin: async (bookingId: number): Promise<any> => {
    const response = await fetch(`${BASE_URL}/booking/${bookingId}/cancel`, {
      method: "PUT",
    });
    return await handleResponse(response);
  },

  getRevenueStatistics: async (): Promise<RestaurantStatisticResponse> => {
    const response = await fetch(`${BASE_URL}/statistics/revenue`);
    return await handleResponse(response);
  },

  getRevenueChart: async (
    type: "this_week" | "this_month" | "monthly"
  ): Promise<ChartDataResponse[]> => {
    const response = await fetch(`${BASE_URL}/statistics/chart?type=${type}`);
    return await handleResponse(response);
  },
};
