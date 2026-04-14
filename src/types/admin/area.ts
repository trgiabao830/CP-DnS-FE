export type AreaStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface RestaurantArea {
  areaId: number;
  name: string;
  status: AreaStatus; 
}

export interface RestaurantAreaRequest {
  name: string;
}

export interface UpdateAreaStatusRequest {
  status: AreaStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}