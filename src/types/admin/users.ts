export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  status: "ACTIVE" | "LOCKED";
}

export interface UserPageResponse {
  content: User[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phone: string;
  password?: string; 
  confirmPassword?: string;
  gender: string;
  dob: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
}