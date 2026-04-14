import type {
  HomestayBookingFilter,
  PageResponse,
  AdminHomestayBookingResponse,
  AdminHomestayBookingDetailResponse,
  HomestayBookingStatus,
  AdminAvailableRoomGroupResponse,
} from "../../types/admin/homestay-booking";
import type {
  ChartDataResponse,
  HomestayStatisticResponse,
} from "../../types/admin/statistic";

const API_URL = "/api/admin/homestay"; 

export const homestayService = {
  getBookings: async (
    filter: HomestayBookingFilter,
  ): Promise<PageResponse<AdminHomestayBookingResponse>> => {
    const params = new URLSearchParams();
    params.append("page", filter.page.toString());
    params.append("size", filter.size.toString());
    if (filter.keyword) params.append("keyword", filter.keyword);
    if (filter.status) params.append("status", filter.status);
    if (filter.fromDate) params.append("fromDate", filter.fromDate);
    if (filter.toDate) params.append("toDate", filter.toDate);

    const response = await fetch(`${API_URL}/booking?${params.toString()}`);
    if (!response.ok) throw new Error("Lỗi tải danh sách đặt phòng");
    return await response.json();
  },

  getBookingDetail: async (
    id: number,
  ): Promise<AdminHomestayBookingDetailResponse> => {
    const response = await fetch(`${API_URL}/booking/${id}`);
    if (!response.ok) {
      if (response.status === 403) throw new Error("FORBIDDEN");
      throw new Error("Lỗi tải chi tiết đặt phòng");
    }
    return await response.json();
  },

  updateStatus: async (
    id: number,
    status: HomestayBookingStatus,
    confirmCheckOutDate?: string, 
    couponCode?: string | null, 
  ): Promise<AdminHomestayBookingDetailResponse> => {
    const params = new URLSearchParams();
    params.append("status", status);

    if (confirmCheckOutDate) {
      params.append("confirmCheckOutDate", confirmCheckOutDate);
    }

    if (couponCode !== undefined && couponCode !== null) {
      params.append("couponCode", couponCode);
    }

    const response = await fetch(
      `${API_URL}/booking/${id}/status?${params.toString()}`,
      {
        method: "PUT",
      },
    );

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || "Lỗi cập nhật trạng thái");
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  },

  cancelBooking: async (id: number): Promise<string> => {
    const response = await fetch(`${API_URL}/booking/${id}/cancel`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Lỗi hủy đơn");
    return await response.text();
  },

  getAvailableRooms: async (
    bookingId: number,
  ): Promise<AdminAvailableRoomGroupResponse[]> => {
    const response = await fetch(
      `${API_URL}/booking/${bookingId}/available-rooms`,
    );
    if (!response.ok) throw new Error("Lỗi tải danh sách phòng khả dụng");
    return await response.json();
  },

  changeRoom: async (
    bookingId: number,
    newRoomId: number,
    couponCode?: string | null,
  ): Promise<AdminHomestayBookingDetailResponse> => {
    const params = new URLSearchParams();
    params.append("newRoomId", newRoomId.toString());

    if (couponCode !== undefined && couponCode !== null) {
      params.append("couponCode", couponCode);
    }

    const response = await fetch(
      `${API_URL}/booking/${bookingId}/change-room?${params.toString()}`,
      {
        method: "PUT",
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Lỗi đổi phòng");
    }
    return await response.json();
  },

  getRevenueStatistics: async (): Promise<HomestayStatisticResponse> => {
    const response = await fetch(`${API_URL}/statistics/revenue`);
    if (!response.ok) throw new Error("Lỗi tải thống kê homestay");
    return await response.json();
  },

  getRevenueChart: async (
    type: "this_week" | "this_month" | "monthly",
  ): Promise<ChartDataResponse[]> => {
    const response = await fetch(`${API_URL}/statistics/chart?type=${type}`);
    if (!response.ok) throw new Error("Lỗi tải biểu đồ homestay");
    return await response.json();
  },
};
