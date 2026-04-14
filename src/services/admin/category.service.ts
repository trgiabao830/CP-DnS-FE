import type {
  Category,
  CategoryRequest,
  ReorderItem,
} from "../../types/admin/categories";

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

const BASE_URL = "/api/admin/restaurant/categories";

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

export const categoryService = {
  getAll: async (
    page: number,
    size: number,
    search: string = "",
    status: string = "",
    unpaged: boolean = false,
  ): Promise<PageResponse<Category>> => {
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
  create: async (data: CategoryRequest): Promise<Category> => {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id: number, data: CategoryRequest): Promise<Category> => {
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
    status: "AVAILABLE" | "UNAVAILABLE",
  ): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  reorder: async (items: ReorderItem[]): Promise<void> => {
    const response = await fetch(`${BASE_URL}/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    return handleResponse(response);
  },
};
