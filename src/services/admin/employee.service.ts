import type {
  Employee,
  EmployeePageResponse,
  EmployeeRequest,
  Permission,
} from "../../types/admin/employees";

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

export const employeeService = {
  getAll: async (
    page: number,
    size: number,
    keyword: string,
    status: string = "",
  ): Promise<EmployeePageResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (keyword) params.append("keyword", keyword);
    if (status) params.append("status", status);

    const res = await fetch(`/api/admin/employees?${params}`);
    const data = await handleResponse(res);

    if (Array.isArray(data)) {
      return { content: data, totalPages: 1, totalElements: data.length };
    }
    return data || { content: [], totalPages: 0, totalElements: 0 };
  },

  getPermissions: async (): Promise<Permission[]> => {
    const res = await fetch("/api/admin/permissions");
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
  },

  create: async (data: EmployeeRequest) => {
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id: number, data: EmployeeRequest) => {
    const res = await fetch(`/api/admin/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: number) => {
    const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    return handleResponse(res);
  },

  updateStatus: async (id: number, status: string) => {
    const res = await fetch(
      `/api/admin/employees/${id}/status?status=${status}`,
      { method: "PATCH" },
    );
    return handleResponse(res);
  },

  resetPassword: async (
    id: number,
    data: { newPassword: string; confirmPassword: string },
  ) => {
    const res = await fetch(`/api/admin/employees/${id}/reset-password`, {
      method: "PATCH", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
