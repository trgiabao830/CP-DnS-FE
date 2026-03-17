import type { BookingCreationResponse } from "../../types/client/booking";
import type {
  HomestaySearchRequest,
  AvailableRoomTypeResponse,
  RoomTypeDetailResponse,
  CouponResponse,
  CreateHomestayBookingRequest,
  HomestayBookingDetailResponse,
  HomestayBookingStatus,
  PageResponse,
  HomestayBookingSummaryResponse,
} from "../../types/client/homestay-booking";

const API_URL = "/api/homestay/booking";

export const homestayBookingService = {
  searchAvailableRooms: async (
    request: HomestaySearchRequest,
  ): Promise<AvailableRoomTypeResponse[]> => {
    const response = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Không thể tìm kiếm phòng lúc này");
    }

    return await response.json();
  },

  getRoomTypeDetail: async (
    id: string | number,
    checkIn?: string,
    checkOut?: string,
  ): Promise<RoomTypeDetailResponse> => {
    const params = new URLSearchParams();
    if (checkIn) params.append("checkIn", checkIn);
    if (checkOut) params.append("checkOut", checkOut);

    const response = await fetch(
      `${API_URL}/room-types/${id}?${params.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Không thể tải thông tin phòng");
    }

    return await response.json();
  },

  getAvailableCoupons: async (): Promise<CouponResponse[]> => {
    const response = await fetch(`${API_URL}/coupons`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Không thể tải mã giảm giá homestay");
    return await response.json();
  },

  createBooking: async (request: CreateHomestayBookingRequest): Promise<BookingCreationResponse> => {
    const response = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Đặt phòng thất bại");
    }
    return await response.json();
  },

  getMyBookings: async (
    status: HomestayBookingStatus | "" = "",
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<HomestayBookingSummaryResponse>> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("size", size.toString());

    const response = await fetch(`${API_URL}/my-bookings?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Không thể tải lịch sử đặt phòng");
    return await response.json();
  },

  getTrackingDetail: async (accessToken: string): Promise<HomestayBookingDetailResponse> => {
    const response = await fetch(`${API_URL}/view/${accessToken}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error("Đơn đặt phòng không tồn tại.");
      if (response.status === 403) throw new Error("Bạn không có quyền xem đơn này.");
      throw new Error("Lỗi tải thông tin đơn.");
    }
    return await response.json();
  },

  cancelBooking: async (accessToken: string): Promise<string> => {
    const response = await fetch(`${API_URL}/cancel/${accessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });
    
    const text = await response.text();
    if (!response.ok) {
        try {
            const json = JSON.parse(text);
            throw new Error(json.message || text);
        } catch {
            throw new Error(text || "Lỗi hủy đơn");
        }
    }
    return text;
  }
};
