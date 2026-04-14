export interface Permission {
  permissionId: number;
  code: string;
  description: string;
}

export interface Employee {
  empId: number;
  username: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  permissions?: Permission[];
}

export interface EmployeeRequest {
  username: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  password?: string;
  confirmPassword?: string;
  permissionIds: number[];
}

export interface EmployeePageResponse {
  content: Employee[];
  totalPages: number;
  totalElements: number;
}