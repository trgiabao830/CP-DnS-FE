export interface LoginRequest {
  username: string;
  password?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob: string; 
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ClientUser {
  id: number;
  name: string;
  role: string;
}

export interface AuthResponse {
  id: number;
  name: string;
  role: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
