import type { AdminAvailableRoomGroupResponse } from "../../types/admin/homestay-booking";
import type {
  HomestayOverviewResponse,
  CreateHomestayWalkInRequest,
} from "../../types/admin/homestay-pos";

const BASE_URL = "/api/admin/homestay";

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

export const homestayPosService = {
  getOverview: async (): Promise<HomestayOverviewResponse> => {
    const response = await fetch(`${BASE_URL}/pos/overview`);
    return await handleResponse(response);
  },


  searchAvailableRooms: async (
    checkIn: string,
    checkOut: string
  ): Promise<AdminAvailableRoomGroupResponse[]> => {
    const params = new URLSearchParams({ checkIn, checkOut });
    const response = await fetch(`${BASE_URL}/available-rooms-public?${params.toString()}`);
    return await handleResponse(response);
  },
  createWalkIn: async (
    data: CreateHomestayWalkInRequest
  ): Promise<{ bookingCode: string; message: string }> => {
    const response = await fetch(`${BASE_URL}/booking/walk-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },
};