export type HomestayBookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface HomestaySearchRequest {
  checkInDate: string; 
  checkOutDate: string; 
  numberOfAdults: number;
  numberOfChildren: number;
}

export interface AvailableRoomTypeResponse {
  typeId: number;
  typeName: string;
  className: string;
  description: string;
  basePrice: number;
  maxAdults: number;
  maxChildren: number;
  availableRoomsCount: number;
  mainImage: string | null;
  amenities: string[];
}

export interface RoomTypeDetailResponse {
  typeId: number;
  typeName: string;
  className: string;
  description: string;
  basePrice: number;
  maxAdults: number;
  maxChildren: number;
  images: string[];
  amenities: string[];
  availableRoomsCount: number | null;
}

export interface CouponResponse {
  couponId: number;
  code: string;
  discountPercent?: number; 
  discountAmount?: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  validUntil?: string;
  isRequireAccount: boolean;
}

export interface CreateHomestayBookingRequest {
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  numberOfAdults: number;
  numberOfChildren: number;
  paymentMethod: "VNPAY";
  depositType: "PERCENT_50" | "FULL_100";
}

export interface HomestayBookingSummaryResponse {
  bookingId: number;
  accessToken: string;
  checkInDate: string;
  checkOutDate: string;
  createdAt: string;
  status: HomestayBookingStatus;
  roomName: string;
  roomImage: string | null;
  totalAmount: number;
  depositAmount: number;
}

export interface HomestayBookingDetailResponse {
  bookingId: number;
  accessToken: string;
  status: HomestayBookingStatus;
  createdAt: string;
  cancellationNoticeHours: number;

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  roomNumber: string;
  roomClass: string;
  roomName: string;
  roomImage: string | null;
  pricePerNight: number;

  checkInDate: string;
  checkOutDate: string;
  numberOfAdults: number;
  numberOfChildren: number;

  paymentMethod: string;
  paymentTime: string | null;
  totalAmount: number;
  depositAmount: number;
  subTotal: number;
  discountAmount: number;
  appliedCouponCode: string | null;
  vnpTxnRef: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface HomestayBookingFlowState {
  searchParams: HomestaySearchRequest;
  selectedRoom: AvailableRoomTypeResponse;
}
