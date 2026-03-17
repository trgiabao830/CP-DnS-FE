import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  AuthResponse,
  ApiError,
  ResetPasswordRequest,
} from "../../types/client/auth";

const API_URL = "/api/auth"; 

export const clientAuthService = {
  login: async (request: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.message || "Đăng nhập thất bại");
    }

    return await response.json();
  },

  register: async (request: RegisterRequest): Promise<string> => {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.message || "Đăng ký thất bại");
    }

    return await response.text();
  },

  forgotPassword: async (request: ForgotPasswordRequest): Promise<string> => {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ApiError;
      throw new Error(errorData.message || "Gửi yêu cầu thất bại");
    }

    return await response.text();
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.message) throw new Error(errorJson.message);
      } catch (e: any) {
        if (e.message !== "Unexpected token...") throw e;
      }
      throw new Error(responseText || "Đặt lại mật khẩu thất bại");
    }

    return responseText;
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("clientUser");
  },
};
