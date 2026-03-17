
export type HomestayCommonStatus = 'ACTIVE' | 'INACTIVE';

export interface HomestayAmenity {
  amenityId: number;
  name: string;
  status: HomestayCommonStatus;
  isDeleted?: boolean;
}

export interface AmenityRequest {
  name: string;
  status: HomestayCommonStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; 
}