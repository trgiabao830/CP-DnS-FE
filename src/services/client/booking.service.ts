import type {
  BookingSearchRequest,
  AvailableTableResponse,
  PaymentPreviewResponse,
  PaymentPreviewRequest,
  CreateBookingRequest,
  BookingCreationResponse,
  FoodResponse,
  CouponResponse,
  BookingDetailResponse,
  BookingStatus,
  PageResponse,
  BookingSummary,
} from "../../types/client/booking";

const API_URL = "/api/booking";

export const bookingService = {
  getOperatingHours: async () => {
    const response = await fetch(`${API_URL}/operating-hours`);
    if (!response.ok) {
      throw new Error("Không lấy được giờ hoạt động");
    }
    return response.json();
  },

  searchTables: async (
    request: BookingSearchRequest,
  ): Promise<AvailableTableResponse[]> => {
    const response = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Không thể tìm kiếm bàn lúc này");
    }

    return await response.json();
  },

  getTableDetail: async (id: number): Promise<AvailableTableResponse> => {
    const response = await fetch(`${API_URL}/tables/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Không thể lấy thông tin bàn.");
    }
    return await response.json();
  },

  previewDepositPolicy: async (
    request: PaymentPreviewRequest,
  ): Promise<PaymentPreviewResponse> => {
    const response = await fetch(`${API_URL}/payment-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error("Không thể kiểm tra chính sách cọc");
    }
    return await response.json();
  },

  getMenuForBooking: async (
    date: string,
    keyword?: string,
  ): Promise<FoodResponse[]> => {
    const params = new URLSearchParams({ date });
    if (keyword) params.append("keyword", keyword);

    const response = await fetch(`${API_URL}/menu?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Không thể tải thực đơn");
    return await response.json();
  },

  getAvailableCoupons: async (): Promise<CouponResponse[]> => {
    const response = await fetch(`${API_URL}/coupons`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Không thể tải mã giảm giá");
    return await response.json();
  },

  createBooking: async (
    request: CreateBookingRequest,
  ): Promise<BookingCreationResponse> => {
    const response = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Đặt bàn thất bại");
    }

    return await response.json();
  },

  verifyVnPayReturn: async (
    queryString: string,
  ): Promise<{
    isSuccess: boolean;
    message: string;
    bookingCode?: string;
    amount?: number;
    transactionId?: string;
  }> => {
    const response = await fetch(
      `${API_URL}/payment/vnpay-callback?${queryString}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi xác thực thanh toán.");
    }

    return await response.json();
  },

  getMyBookings: async (
    status: BookingStatus | "" = "",
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<BookingSummary>> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("size", size.toString());

    const response = await fetch(
      `${API_URL}/my-bookings?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Không thể tải lịch sử đặt bàn");
    }

    return response.json();
  },

  getTrackingDetail: async (
    accessToken: string,
  ): Promise<BookingDetailResponse> => {
    const response = await fetch(`${API_URL}/view/${accessToken}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error("Đơn không tồn tại.");
      if (response.status === 403)
        throw new Error("Bạn không có quyền xem đơn này.");
      throw new Error("Lỗi tải thông tin đơn.");
    }

    return await response.json();
  },

  cancelBooking: async (accessToken: string): Promise<string> => {
    const response = await fetch(`${API_URL}/cancel/${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message) {
          throw new Error(errorJson.message); 
        }
      } catch (e) {
      }
      throw new Error(responseText || "Không thể hủy đơn.");
    }

    return responseText;
  },
};
