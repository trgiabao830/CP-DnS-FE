import type {
  RestaurantOverview,
  WalkInBookingRequest,
  OrderItemRequest,
} from "../../types/admin/restaurant-pos"; 
import type { AdminBookingDetail } from "../../types/admin/booking"; 

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

export const posService = {
  getOverview: async (): Promise<RestaurantOverview> => {
    const response = await fetch(`${BASE_URL}/overview`);
    return await handleResponse(response);
  },

  createWalkInBooking: async (
    data: WalkInBookingRequest,
  ): Promise<AdminBookingDetail> => {
    const response = await fetch(`${BASE_URL}/bookings/walk-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  addOrderItem: async (
    bookingId: number,
    itemReq: OrderItemRequest,
  ): Promise<AdminBookingDetail> => {
    const response = await fetch(`${BASE_URL}/bookings/${bookingId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemReq),
    });
    return await handleResponse(response);
  },

  updateOrderItemQuantity: async (
    bookingId: number,
    detailId: number,
    quantity: number,
  ): Promise<AdminBookingDetail> => {
    const response = await fetch(
      `${BASE_URL}/bookings/${bookingId}/items/${detailId}?quantity=${quantity}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
    );
    return await handleResponse(response);
  },

  moveTable: async (
    bookingId: number,
    newTableId: number,
  ): Promise<AdminBookingDetail> => {
    const response = await fetch(
      `${BASE_URL}/bookings/${bookingId}/move-table?newTableId=${newTableId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
    );
    return await handleResponse(response);
  },
};
