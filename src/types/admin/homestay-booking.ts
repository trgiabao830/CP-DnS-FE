export type HomestayBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN" 
  | "COMPLETED" 
  | "CANCELLED"
  | "NO_SHOW";

export interface AdminHomestayBookingResponse {
  bookingId: number;
  customerName: string;
  customerPhone: string;
  roomNumber: string;
  roomClassName: string;
  checkInDate: string;
  checkOutDate: string;
  status: HomestayBookingStatus;
  totalAmount: number;
  createdAt: string;
}

export interface AdminHomestayBookingDetailResponse {
  bookingId: number;
  status: HomestayBookingStatus;
  createdAt: string;

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  roomNumber: string;
  roomClassName: string;
  roomName: string;
  roomImage: string | null;

  checkInDate: string;
  checkOutDate: string;
  numberOfAdults: number;
  numberOfChildren: number;

  paymentMethod: string;
  paymentTime: string | null;
  vnpTxnRef: string | null;

  pricePerNight: number;
  subTotal: number;
  discountAmount: number;
  depositAmount: number;
  totalAmount: number;
}

export interface AdminAvailableRoomGroupResponse {
  classId: number;
  className: string;
  roomTypes: RoomTypeGroup[];
}

export interface RoomTypeGroup {
  typeId: number;
  typeName: string;
  pricePerNight: number;
  maxAdults: number;
  maxChildren: number;
  rooms: RoomDetail[];
}

export interface RoomDetail {
  roomId: number;
  roomNumber: string;
  isCurrentRoom: boolean;
}

export interface HomestayBookingFilter {
  page: number;
  size: number;
  keyword?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
