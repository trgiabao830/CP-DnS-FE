export interface Category {
  categoryId: number;
  name: string;
  displayOrder: number;
  status: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface CategoryRequest {
  name: string;
  displayOrder?: number;
  status?: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface ReorderItem {
  id: number;
  order: number;
}