import type { 
  RestaurantArea, 
  RestaurantAreaRequest, 
  UpdateAreaStatusRequest, 
  AreaStatus, 
  PageResponse 
} from "../../types/admin/area";

const BASE_URL = "/api/admin/restaurant/areas";

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

export const areaService = {
  getAll: async (
    page: number, 
    size: number, 
    keyword: string = '', 
    status: string = '',
    unpaged: boolean = false
  ): Promise<PageResponse<RestaurantArea>> => {
    const params = new URLSearchParams();
    if (unpaged) {
      params.append('unpaged', 'true');
    } else {
      params.append('page', page.toString());
      params.append('size', size.toString());
    }
    if (keyword) params.append('keyword', keyword);
    if (status) params.append('status', status);

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return await handleResponse(response);
  },

  create: async (data: RestaurantAreaRequest) => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data), 
    });
    return await handleResponse(response);
  },

  update: async (id: number, data: RestaurantAreaRequest) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data), 
    });
    return await handleResponse(response);
  },

  delete: async (id: number) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return await handleResponse(response);
  },

  updateStatus: async (id: number, status: AreaStatus) => {
    const payload: UpdateAreaStatusRequest = { status };

    const response = await fetch(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload), 
    });
    return await handleResponse(response);
  },
};