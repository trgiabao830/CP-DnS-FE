import type {
  RestaurantTable,
  RestaurantTableRequest,
  UpdateTableStatusRequest,
  TableStatus,
} from "../../types/admin/table";

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const BASE_URL = "/api/admin/restaurant/tables";

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
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  } else {
    const text = await response.text();
    return { message: text };
  }
};

export const tableService = {
  getAll: async (
    page: number,
    size: number,
    keyword: string = "",
    status: string = "",
    areaId: number | null = null,
  ): Promise<PageResponse<RestaurantTable>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);

    if (areaId) params.append("areaId", areaId.toString());

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await handleResponse(response);
  },

  create: async (data: RestaurantTableRequest) => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  update: async (id: number, data: RestaurantTableRequest) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await handleResponse(response);
  },

  updateStatus: async (id: number, status: TableStatus) => {
    const payload: UpdateTableStatusRequest = { status };

    const response = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  },
};
