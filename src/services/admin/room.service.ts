import type {
  HomestayRoom,
  RoomRequest,
  RoomStatus,
  PageResponse,
} from "../../types/admin/room";

const BASE_URL = "/api/admin/homestay/rooms";

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

export const roomService = {
  getAll: async (
    page: number,
    size: number,
    search: string = "",
    status: string = "",
    typeId: string = "", 
    classId: string = "",
    unpaged: boolean = false
  ): Promise<PageResponse<HomestayRoom>> => {
    const params = new URLSearchParams();
    if (unpaged) params.append("unpaged", "true");
    else {
      params.append("page", page.toString());
      params.append("size", size.toString());
    }

    if (search) params.append("keyword", search);
    if (status) params.append("status", status);
    if (typeId) params.append("typeId", typeId);
    if (classId) params.append("classId", classId);

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    return handleResponse(response);
  },

  create: async (data: RoomRequest): Promise<HomestayRoom> => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: number, data: RoomRequest): Promise<HomestayRoom> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateStatus: async (id: number, status: RoomStatus) => {
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