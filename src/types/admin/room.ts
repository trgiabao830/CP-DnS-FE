export type RoomStatus = "AVAILABLE" | "BOOKED" | "OCCUPIED" | "UNAVAILABLE";

export interface HomestayRoom {
  roomId: number;
  roomNumber: string;
  roomType: {
    typeId: number;
    name: string;
    basePrice: number;
    roomClass?: {
      classId: number;
      name: string;
    };
  };
  status: RoomStatus;
}

export interface RoomRequest {
  roomNumber: string;
  typeId: number;
  status: RoomStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
