export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  name: string;
  role: string;
  permissions: string[];
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
}