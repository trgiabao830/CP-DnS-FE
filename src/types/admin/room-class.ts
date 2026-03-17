export type HomestayCommonStatus = 'ACTIVE' | 'INACTIVE';

export interface HomestayRoomClass {
  classId: number;
  name: string;
  status: HomestayCommonStatus;
  isDeleted?: boolean;
}

export interface RoomClassRequest {
  name: string;
  status: HomestayCommonStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}