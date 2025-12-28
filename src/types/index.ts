export type ProductStatus = 'AVAILABLE' | 'LIVE' | 'COOLDOWN' | 'BLACKLIST';

export interface Product {
  id: string;
  name: string;
  link: string;
  category: string;
  status: ProductStatus;
  currentStudioId: string | null;
  cooldownUntil: Date | null;
  gmv: number;
  clicks: number;
  score: number;
  addedAt: Date;
  lastUpdated: Date;
}

export interface Studio {
  id: string;
  name: string;
  category: string;
  capacity: number;
  dailyRotation: number;
  activeProducts: number;
  color: string;
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

export interface DailyStats {
  productId: string;
  date: Date;
  gmv: number;
  clicks: number;
}

export interface WeeklyInsight {
  productId: string;
  productName: string;
  studioName: string;
  avgGmv: number;
  avgClicks: number;
  trend: 'up' | 'down' | 'stable';
  daysLive: number;
}
