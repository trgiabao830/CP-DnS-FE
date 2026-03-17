export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "SERVING";

export interface BookingSearchRequest {
  date: string; 
  time: string; 
  numberOfGuests: number;
}

export interface AvailableTableResponse {
  areaId: number;
  areaName: string;
  capacity: number;
  suggestedTableId: number;
  tableName: string;
  remainingTables: number;
}

export interface PaymentPreviewRequest {
  isPreOrderFood: boolean;
}

export interface PaymentPreviewResponse {
  isDepositRequired: boolean;
  depositAmount: number;
}

export interface FoodOption {
  optionId: number;
  name: string;
  priceAdjustment: number;
  status: string; 
}

export interface FoodVariant {
  variantId: number;
  name: string; 
  isRequired: boolean; 
  options: FoodOption[];
}

export interface FoodResponse {
  foodId: number;
  name: string;
  description: string;
  basePrice: number;
  discountPrice?: number; 
  imageUrl: string;
  status: string;
  categoryId: number;
  categoryName: string;
  variants: FoodVariant[];
}

export interface CartItem extends OrderItemRequest {
  tempId: string; 
  name: string;
  price: number; 
  image: string;
  optionNames: string[]; 
}

export interface CartOption {
  id: number;
  name: string;
  price: number;
}

export interface OrderItemRequest {
  foodId: number;
  quantity: number;
  optionIds: number[];
  note: string; 
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

export interface BookingFlowState {
  searchParams: {
    date: string;
    time: string;
    numberOfGuests: number;
  };
  selectedTable: AvailableTableResponse;
  customerInfo?: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    isPreOrderFood: boolean;
  };
  cartItems?: CartItem[];
}

export interface CreateBookingRequest {
  tableId: number;
  date: string; 
  time: string; 
  numberOfGuests: number;

  customerName: string;
  customerPhone: string;
  customerEmail: string;

  paymentMethod: "CASH" | "VNPAY" | "MOMO";
  isPreOrderFood: boolean;
  depositType: "FULL_100" | "PERCENT_50";

  orderItems?: OrderItemRequest[]; 
  couponCode?: string;
}

export interface BookingCreationResponse {
  bookingCode: string;
  message: string;
  paymentUrl?: string;
}

export interface DetailItemDto {
  foodName: string;
  foodImage: string;
  quantity: number;
  note?: string;
  unitPrice: number;
  totalPrice: number;
  options: string[];
}

export interface BookingDetailResponse {
  bookingId: number;
  customerName: string;
  customerPhone: string;

  bookingTime: string;
  createdAt: string;
  cancellationNoticeHours: number;

  tableNumber: string;
  numberOfGuests: number;

  subTotal: number;
  discountAmount: number;
  depositAmount: number;
  totalAmount: number;

  paymentMethod: string;
  status: string;
  bookingType: string;

  orderItems: DetailItemDto[];
}

export interface BookingSummary {
  bookingId: number;
  accessToken: string;
  bookingTime: string;
  createdAt: string;
  status: BookingStatus;
  numberOfGuests: number;
  totalAmount: number;
  depositAmount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; 
  first: boolean;
  last: boolean;
  empty: boolean;
}