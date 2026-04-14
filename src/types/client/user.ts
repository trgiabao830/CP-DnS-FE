export interface UserProfileResponse {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  status: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  phone: string;
  dob: string | null;
  gender: string | null;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}