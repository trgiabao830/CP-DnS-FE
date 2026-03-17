const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMessage = `Lỗi ${res.status}: ${res.statusText}`;
    try {
      const errorBody = await res.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
      throw { status: res.status, message: errorMessage };
    } catch (e: any) {
      if (e.status) throw e;
      const textError = await res.text().catch(() => null);
      if (textError) errorMessage = textError;
      throw { status: res.status, message: errorMessage };
    }
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  } else {
    const text = await res.text();
    return { message: text };
  }
};

export const settingsService = {
  getDepositRequirement: async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/settings/restaurant/deposit`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.isRequired === true || data.isRequired === "true";
    } catch (error) {
      return false;
    }
  },

  updateDepositRequirement: async (isRequired: boolean) => {
    const res = await fetch(
      `/api/admin/settings/restaurant/deposit?isRequired=${isRequired}`,
      {
        method: "PATCH",
      },
    );
    return handleResponse(res);
  },

  resetAllOutOfStockFoods: async () => {
    const res = await fetch(
      `/api/admin/settings/restaurant/foods/reset-status`,
      {
        method: "POST",
      },
    );
    return handleResponse(res);
  },

  getCancellationDeadlines: async () => {
    const res = await fetch(`/api/admin/settings/cancellation-deadlines`);
    if (!res.ok) throw new Error("Không thể tải cấu hình thời gian hủy");
    return await res.json();
  },

  updateCancellationDeadlines: async (data: {
    homestayHours?: number;
    restaurantDepositHours?: number;
    restaurantNoDepositHours?: number;
  }) => {
    const params = new URLSearchParams();
    if (data.homestayHours !== undefined)
      params.append("homestayHours", data.homestayHours.toString());
    if (data.restaurantDepositHours !== undefined)
      params.append(
        "restaurantDepositHours",
        data.restaurantDepositHours.toString(),
      );
    if (data.restaurantNoDepositHours !== undefined)
      params.append(
        "restaurantNoDepositHours",
        data.restaurantNoDepositHours.toString(),
      );

    const res = await fetch(
      `/api/admin/settings/cancellation-deadlines?${params.toString()}`,
      {
        method: "PATCH",
      },
    );
    return handleResponse(res);
  },

  getOperatingHours: async () => {
    const res = await fetch(`/api/admin/settings/restaurant/operating-hours`);
    if (!res.ok) throw new Error("Không thể tải khung giờ hoạt động");
    return await res.json();
  },

  updateOperatingHours: async (openingTime: string, closingTime: string) => {
    const params = new URLSearchParams();
    if (openingTime) params.append("openingTime", openingTime);
    if (closingTime) params.append("closingTime", closingTime);

    const res = await fetch(
      `/api/admin/settings/restaurant/operating-hours?${params.toString()}`,
      {
        method: "PATCH",
      },
    );
    return handleResponse(res);
  },
};
