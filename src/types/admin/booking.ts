export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SERVING"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface AdminBookingSummary {
  bookingId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingTime: string;
  createdAt: string;
  status: BookingStatus;
  tableNumber: string;
  numberOfGuests: number;
  totalAmount: number;
  depositAmount: number;
}

export interface AdminOrderedItem {
  detailId: number; 
  foodId: number;
  foodName: string;
  foodImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note: string;
  options: string[]; 
}

export interface AdminBookingDetail {
  bookingId: number;
  status: BookingStatus;
  bookingType: string;
  createdAt: string;

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  tableNumber: string;
  numberOfGuests: number;
  bookingTime: string;

  paymentMethod: string;
  paymentTime?: string;
  vnpTxnRef?: string;

  subTotal: number;
  discountAmount: number;
  depositAmount: number;
  totalAmount: number;

  orderItems: AdminOrderedItem[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
