import type { AdminBookingDetail, BookingStatus } from "./booking";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "SERVING";

export interface ShortBooking {
  bookingId: number;
  customerName: string;
  customerPhone: string;
  bookingTime: string; 
  endTime: string;     
  status: BookingStatus;
  numberOfGuests: number;
}

export interface TableSnapshot {
  tableId: number;
  tableNumber: string;
  capacity: number;
  currentStatus: TableStatus;
  currentBooking?: ShortBooking; 
  todayBookings: ShortBooking[]; 
}

export interface AreaSnapshot {
  areaId: number;
  areaName: string;
  tables: TableSnapshot[];
}

export interface RestaurantOverview {
  areas: AreaSnapshot[];
}

export interface OrderItemRequest {
  foodId: number;
  quantity: number;
  note?: string;
  optionIds?: number[];
}

export interface WalkInBookingRequest {
  tableId: number;
  customerName?: string;
  customerPhone?: string;
  numberOfGuests?: number;
  orderItems?: any[]; 
}