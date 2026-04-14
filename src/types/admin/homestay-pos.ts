export interface RoomSnapshot {
  roomId: number;
  roomNumber: string;
  status: "AVAILABLE" | "BOOKED" | "OCCUPIED" | "UNAVAILABLE"; 
  currentBookingId?: number | null;
  currentCustomerName?: string | null;
  checkInDate?: string | null;  
  checkOutDate?: string | null; 
}

export interface RoomTypeGroup {
  typeId: number;
  typeName: string;
  pricePerNight: number;
  rooms: RoomSnapshot[];
}

export interface RoomClassGroup {
  classId: number;
  className: string;
  roomTypes: RoomTypeGroup[];
}

export interface ShortBookingInfo {
  bookingId: number;
  customerName: string;
  roomNumber: string;
  status: string;
  totalAmount: number;
}

export interface HomestayOverviewResponse {
  arrivingToday: ShortBookingInfo[];
  departingToday: ShortBookingInfo[];
  roomMap: RoomClassGroup[];
}

export interface CreateHomestayWalkInRequest {
  roomId: number;
  customerName: string;
  customerPhone: string;
  checkInDate: string; 
  checkOutDate: string; 
  numberOfAdults: number;
  numberOfChildren: number;
  couponCode?: string;
}