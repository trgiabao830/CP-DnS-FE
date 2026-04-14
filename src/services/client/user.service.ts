import type {
  ChangePasswordRequest,
  UpdateUserRequest,
  UserProfileResponse,
} from "../../types/client/user";

const API_URL = "/api/user/profile";

export const userService = {
  getMyProfile: async (): Promise<UserProfileResponse> => {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    return await response.json();
  },

  updateProfile: async (
    data: UpdateUserRequest,
  ): Promise<UserProfileResponse> => {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) throw new Error(errorJson.message);
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected token...") throw e;
      }
      throw new Error("Cập nhật thất bại");
    }
    return await response.json();
  },

  changePassword: async (data: ChangePasswordRequest): Promise<string> => {
    const response = await fetch(`${API_URL}/change-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message) {
          throw new Error(errorJson.message);
        }
      } catch (e: any) {
        if (e.message !== "Unexpected token" && !e.message.includes("JSON")) {
          throw e;
        }
      }
      throw new Error(responseText || "Đổi mật khẩu thất bại");
    }

    return responseText; 
  },
};
