export interface UserProfile {
  empId: number;
  username: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  permissions: PermissionDto[];
}

export interface PermissionDto {
  id: number;
  code: string;
  description: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}