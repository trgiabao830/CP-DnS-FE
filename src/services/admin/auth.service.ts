import type { LoginRequest, AuthResponse, ApiError } from "../../types/admin/auth";

const LOGIN_URL = "/api/admin/auth/login";
const LOGOUT_URL = "/api/auth/logout";
const PROFILE_URL = "/api/admin/profile";
const REFRESH_PERM_URL = "/api/admin/auth/refresh-permissions"; 

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.message || "Đăng nhập thất bại.");
    }

    const data = (await response.json()) as AuthResponse;
    if (data) {
      localStorage.setItem("currentUser", JSON.stringify(data));
    }
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await fetch(LOGOUT_URL, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("currentUser");
    }
  },

  checkSession: async (): Promise<AuthResponse> => {
    const response = await fetch(PROFILE_URL);

    if (!response.ok) {
      const error = new Error("Session expired");
      (error as any).status = response.status;
      throw error;
    }

    const profile = await response.json();
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

    const finalUser = {
      ...storedUser,
      ...profile,
      name: profile.fullName,
      role: profile.jobTitle,
    };
    localStorage.setItem("currentUser", JSON.stringify(finalUser));

    return finalUser;
  },

  refreshPermissions: async (): Promise<AuthResponse> => {
    const response = await fetch(REFRESH_PERM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error("Failed to refresh permissions");
    }

    return (await response.json()) as AuthResponse;
  },
};
