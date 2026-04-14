export type HomestayCommonStatus = 'ACTIVE' | 'INACTIVE';

export interface RoomTypeImage {
  imageId: number;
  imageUrl: string;
  displayOrder: number;
}

export interface HomestayRoomType {
  typeId: number;
  name: string;
  description: string;
  basePrice: number;
  maxAdults: number;
  maxChildren: number;
  status: HomestayCommonStatus;
  roomClass: {
    classId: number;
    name: string;
  };
  amenities: {
    amenityId: number;
    name: string;
  }[];
  images: RoomTypeImage[];
}

export interface RoomTypeRequest {
  name: string;
  description?: string;
  basePrice: number;
  maxAdults: number;
  maxChildren: number;
  classId: number;
  amenityIds: number[];
  status: HomestayCommonStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}