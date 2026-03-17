export type FoodStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK';
export type OptionStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface Food {
  foodId: number;
  name: string;
  description?: string;
  basePrice: number;
  discountPrice?: number;
  imageUrl?: string;
  status: FoodStatus;
  displayOrder: number;
  categoryId: number;
  variants?: Variant[]; 
}

export interface Variant {
  variantId: number;
  name: string;
  isRequired: boolean;
  options: VariantOption[];
}

export interface VariantOption {
  optionId: number;
  name: string;
  priceAdjustment: number;
  status?: OptionStatus;
  linkedFoodId?: number;
}

export interface FoodRequest {
  name: string;
  description?: string;
  basePrice: number | undefined; 
  discountPrice?: number;
  status: FoodStatus;
  categoryId: number;
  variants: VariantRequest[];
}

export interface VariantRequest {
  variantId?: number;
  name: string;
  isRequired: boolean;
  options: VariantOptionRequest[];
}

export interface VariantOptionRequest {
  optionId?: number;
  name: string;
  priceAdjustment: number | undefined;
  status: OptionStatus;
  linkedFoodId?: number;
}

export interface FoodReorderItem {
  id: number;
  order: number;
}