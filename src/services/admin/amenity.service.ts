import type {
  HomestayAmenity,
  AmenityRequest,
  HomestayCommonStatus,
} from "../../types/admin/amenity";

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const BASE_URL = "/api/admin/homestay/amenities";

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

export const amenityService = {
  getAll: async (
    page: number,
    size: number,
    search: string = "",
    status: string = "",
    unpaged: boolean = false, 
  ): Promise<PageResponse<HomestayAmenity>> => {
    const params = new URLSearchParams();

    if (unpaged) {
      params.append("unpaged", "true");
    } else {
      params.append("page", page.toString());
      params.append("size", size.toString());
    }

    if (search) params.append("keyword", search);
    if (status) params.append("status", status);

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    return handleResponse(response);
  },

  create: async (data: AmenityRequest): Promise<HomestayAmenity> => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (
    id: number,
    data: AmenityRequest,
  ): Promise<HomestayAmenity> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },

  updateStatus: async (
    id: number,
    status: HomestayCommonStatus,
  ): Promise<void> => {
    const params = new URLSearchParams();
    params.append("status", status);

    const response = await fetch(
      `${BASE_URL}/${id}/status?${params.toString()}`,
      {
        method: "PATCH",
      },
    );
    return handleResponse(response);
  },
};
