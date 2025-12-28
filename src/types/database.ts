export type ProductStatus = 'AVAILABLE' | 'LIVE' | 'COOLDOWN' | 'BLACKLIST';

export interface Studio {
  id: string;
  name: string;
  category: string;
  capacity: number;
  daily_rotation: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  studio_id: string;
  name: string;
  affiliate_link: string;
  original_url: string | null;
  category: string | null;
  status: ProductStatus;
  gmv: number;
  clicks: number;
  score: number;
  cooldown_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyStats {
  id: string;
  product_id: string;
  date: string;
  gmv: number;
  clicks: number;
  created_at: string;
}

export interface RotationItem {
  product: Product;
  action: 'remove' | 'add';
  markedComplete: boolean;
}

export interface StudioRotation {
  studio: Studio;
  toRemove: RotationItem[];
  toAdd: RotationItem[];
}

export interface StudioWithProductCount extends Studio {
  product_count: number;
}
