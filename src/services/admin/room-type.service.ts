import type {
  HomestayRoomType,
  RoomTypeRequest,
  HomestayCommonStatus,
  PageResponse,
} from "../../types/admin/room-type";

const BASE_URL = "/api/admin/homestay/room-types";

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

export const roomTypeService = {
  getAll: async (
    page: number,
    size: number,
    search: string = "",
    status: string = "",
    classId: string = "",
    unpaged: boolean = false,
  ): Promise<PageResponse<HomestayRoomType>> => {
    const params = new URLSearchParams();
    if (unpaged) params.append("unpaged", "true");
    else {
      params.append("page", page.toString());
      params.append("size", size.toString());
    }

    if (search) params.append("keyword", search);
    if (status) params.append("status", status);
    if (classId) params.append("classId", classId);

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    return handleResponse(response);
  },

  create: async (
    data: RoomTypeRequest,
    images: File[],
  ): Promise<HomestayRoomType> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (images && images.length > 0) {
      images.forEach((file) => formData.append("images", file));
    }

    const response = await fetch(BASE_URL, { method: "POST", body: formData });
    return handleResponse(response);
  },

  update: async (
    id: number,
    data: RoomTypeRequest,
    newImages: File[],
  ): Promise<HomestayRoomType> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (newImages && newImages.length > 0) {
      newImages.forEach((file) => formData.append("newImages", file)); 
    }

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      body: formData,
    });
    return handleResponse(response);
  },

  updateStatus: async (id: number, status: HomestayCommonStatus) => {
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
