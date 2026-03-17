import type {
  UserPageResponse,
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "../../types/admin/users";

const API_BASE_URL = "/api/admin/users";

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMessage = `Lỗi ${res.status}: ${res.statusText}`;
    try {
      const errorBody = await res.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
      throw { status: res.status, message: errorMessage, error: errorBody.error };
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

export const userService = {
  getAll: async (
    page: number,
    size: number,
    keyword: string,
    status: string = "",
  ): Promise<UserPageResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);

    const res = await fetch(`${API_BASE_URL}?${params}`);
    return handleResponse(res);
  },

  getDetail: async (id: number): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    return handleResponse(res);
  },

  create: async (data: CreateUserRequest) => {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id: number, data: UpdateUserRequest) => {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  toggleStatus: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/${id}/status`, { method: "PATCH" });
    return handleResponse(res);
  },
};