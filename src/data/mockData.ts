import { Product, Studio, StudioRotation } from '@/types';

export const studios: Studio[] = [
  { id: 'studio-1', name: 'Studio 1', category: 'Fashion', capacity: 100, dailyRotation: 2, activeProducts: 100, color: 'hsl(168 84% 45%)' },
  { id: 'studio-2', name: 'Studio 2', category: 'Electronics', capacity: 100, dailyRotation: 2, activeProducts: 100, color: 'hsl(258 90% 66%)' },
  { id: 'studio-3', name: 'Studio 3', category: 'Beauty', capacity: 100, dailyRotation: 2, activeProducts: 100, color: 'hsl(330 80% 60%)' },
  { id: 'studio-4', name: 'Studio 4', category: 'Home & Living', capacity: 100, dailyRotation: 2, activeProducts: 100, color: 'hsl(38 92% 55%)' },
  { id: 'studio-5', name: 'Studio 5', category: 'Sports', capacity: 100, dailyRotation: 2, activeProducts: 100, color: 'hsl(200 90% 50%)' },
  { id: 'studio-6', name: 'Studio 6', category: 'Food & Beverages', capacity: 100, dailyRotation: 2, activeProducts: 100, color: 'hsl(15 80% 55%)' },
  { id: 'studio-7', name: 'Studio 7', category: 'Kids & Baby', capacity: 100, dailyRotation: 2, activeProducts: 100, color: 'hsl(280 70% 55%)' },
];

const generateProducts = (): Product[] => {
  const products: Product[] = [];
  const categories = ['Fashion', 'Electronics', 'Beauty', 'Home & Living', 'Sports', 'Food & Beverages', 'Kids & Baby'];
  const productNames = [
    'Premium Wireless Earbuds', 'Organic Face Serum', 'Cotton Blend T-Shirt', 'Smart LED Bulb Set',
    'Yoga Mat Premium', 'Stainless Steel Tumbler', 'Baby Soft Blanket', 'Running Shoes Pro',
    'Vitamin C Moisturizer', 'Bluetooth Speaker Mini', 'Silk Scarf Collection', 'Air Fryer Compact',
    'Kids Drawing Set', 'Gaming Mouse RGB', 'Natural Lip Balm', 'Fitness Resistance Bands',
    'Bamboo Cutting Board', 'Plush Toy Bear', 'Portable Charger 20K', 'Hair Growth Serum'
  ];

  for (let i = 0; i < 800; i++) {
    const studioIndex = i < 700 ? Math.floor(i / 100) : -1;
    const isLive = studioIndex >= 0;
    
    products.push({
      id: `prod-${i + 1}`,
      name: `${productNames[i % productNames.length]} ${Math.floor(i / 20) + 1}`,
      link: `https://shopee.co.id/product/${100000 + i}`,
      category: categories[i % categories.length],
      status: isLive ? 'LIVE' : 'AVAILABLE',
      currentStudioId: isLive ? studios[studioIndex].id : null,
      cooldownUntil: null,
      gmv: Math.floor(Math.random() * 5000000) + 100000,
      clicks: Math.floor(Math.random() * 500) + 10,
      score: 0,
      addedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      lastUpdated: new Date(),
    });
  }

  // Calculate scores
  products.forEach(p => {
    p.score = (p.gmv * 0.7) + (p.clicks * 1000 * 0.3);
  });

  return products;
};

export const allProducts = generateProducts();

export const getStudioRotations = (): StudioRotation[] => {
  return studios.map(studio => {
    const studioProducts = allProducts
      .filter(p => p.currentStudioId === studio.id)
      .sort((a, b) => a.score - b.score);
    
    const availableProducts = allProducts
      .filter(p => p.status === 'AVAILABLE')
      .slice(0, 10);

    const toRemove = studioProducts.slice(0, 2);
    const toAdd = availableProducts.slice(0, 2);

    return {
      studio,
      toRemove: toRemove.map(p => ({ product: p, action: 'remove' as const, markedComplete: false })),
      toAdd: toAdd.map(p => ({ product: p, action: 'add' as const, markedComplete: false })),
    };
  });
};

export const getProductsByStatus = (status: Product['status']) => {
  return allProducts.filter(p => p.status === status);
};

export const getProductsByStudio = (studioId: string) => {
  return allProducts.filter(p => p.currentStudioId === studioId);
};
