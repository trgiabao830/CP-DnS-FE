import type { RestaurantArea } from "./area";

export type TableStatus = 'AVAILABLE' | 'SERVING' | 'RESERVED' | 'UNAVAILABLE';

export interface RestaurantTable {
  tableId: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  area: RestaurantArea;
}

export interface RestaurantTableRequest {
  tableNumber: string;
  capacity: number;
  areaId: number;
}

export interface UpdateTableStatusRequest {
  status: TableStatus;
}