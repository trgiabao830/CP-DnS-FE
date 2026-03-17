import type {
  Food,
  FoodRequest,
  FoodReorderItem,
  FoodStatus,
} from "../../types/admin/food";

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

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

export const foodService = {
  getByCategory: async (
    categoryId: number,
    page: number,
    size: number,
    keyword: string = "",
    status: string = "",
    unpaged: boolean = false,
  ): Promise<PageResponse<Food>> => {
    const params = new URLSearchParams();

    if (unpaged) {
      params.append("unpaged", "true");
    } else {
      params.append("page", page.toString());
      params.append("size", size.toString());
    }

    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);

    const response = await fetch(
      `${BASE_URL}/categories/${categoryId}/foods?${params.toString()}`,
    );
    return await handleResponse(response);
  },

  create: async (data: FoodRequest, imageFile?: File): Promise<Food> => {
    const formData = new FormData();

    formData.append("data", JSON.stringify(data));

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch(`${BASE_URL}/foods`, {
      method: "POST",
      body: formData,
    });

    return await handleResponse(response);
  },

  update: async (
    id: number,
    data: FoodRequest,
    imageFile?: File,
  ): Promise<Food> => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch(`${BASE_URL}/foods/${id}`, {
      method: "PUT",
      body: formData,
    });

    return await handleResponse(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/foods/${id}`, {
      method: "DELETE",
    });
    return await handleResponse(response);
  },

  updateStatus: async (id: number, status: FoodStatus): Promise<void> => {
    const response = await fetch(`${BASE_URL}/foods/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return await handleResponse(response);
  },

  reorder: async (items: FoodReorderItem[]): Promise<void> => {
    const response = await fetch(`${BASE_URL}/foods/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    return await handleResponse(response);
  },

  getDetail: async (id: number): Promise<Food> => {
    const response = await fetch(`${BASE_URL}/foods/${id}`);
    return await handleResponse(response);
  },

  getAll: async (
    page: number,
    size: number,
    keyword: string = "",
    status: string = "",
    categoryId: number | null = null,
  ): Promise<PageResponse<Food>> => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);
    if (categoryId) params.append("categoryId", categoryId.toString());

    const response = await fetch(`${BASE_URL}/foods?${params.toString()}`);
    return await handleResponse(response);
  },
};
