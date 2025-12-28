import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductStatus } from '@/types/database';
import { toast } from 'sonner';

export function useProducts(studioId?: string, status?: ProductStatus) {
  return useQuery({
    queryKey: ['products', studioId, status],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase.from('products').select('*');

      if (studioId) {
        query = query.eq('studio_id', studioId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('score', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllProducts(statusFilter?: string) {
  return useQuery({
    queryKey: ['all-products', statusFilter],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase.from('products').select('*');

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter as ProductStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Product[];
    },
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: ['product-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        available: data.filter((p) => p.status === 'AVAILABLE').length,
        live: data.filter((p) => p.status === 'LIVE').length,
        cooldown: data.filter((p) => p.status === 'COOLDOWN').length,
        blacklist: data.filter((p) => p.status === 'BLACKLIST').length,
      };

      return stats;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Product> & { studio_id: string; name: string; affiliate_link: string }) => {
      const score = calculateScore(data.gmv || 0, data.clicks || 0);
      
      const { data: product, error } = await supabase
        .from('products')
        .insert([{ ...data, score }])
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['studios'] });
      toast.success('Produk berhasil ditambahkan!');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan produk: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const { data: product, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['studios'] });
    },
    onError: (error) => {
      toast.error('Gagal memperbarui produk: ' + error.message);
    },
  });
}

export function useBulkCreateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (products: Array<{ 
      studio_id: string; 
      name: string; 
      affiliate_link: string; 
      original_url?: string;
      category?: string; 
      status?: ProductStatus; 
      gmv?: number; 
      clicks?: number 
    }>) => {
      const productsWithScore = products.map((p) => ({
        ...p,
        score: calculateScore(p.gmv || 0, p.clicks || 0),
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsWithScore)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      queryClient.invalidateQueries({ queryKey: ['studios'] });
      toast.success(`${data.length} produk berhasil diimport!`);
    },
    onError: (error) => {
      toast.error('Gagal mengimport produk: ' + error.message);
    },
  });
}

export function useMarkProductRemoved() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() + 14);

      const { data, error } = await supabase
        .from('products')
        .update({
          status: 'COOLDOWN' as ProductStatus,
          cooldown_until: cooldownDate.toISOString(),
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Produk ditandai sebagai dihapus!');
    },
    onError: (error) => {
      toast.error('Gagal menandai produk: ' + error.message);
    },
  });
}

export function useMarkProductAdded() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { data, error } = await supabase
        .from('products')
        .update({
          status: 'LIVE' as ProductStatus,
          cooldown_until: null,
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
      queryClient.invalidateQueries({ queryKey: ['product-stats'] });
      toast.success('Produk ditandai sebagai ditambahkan!');
    },
    onError: (error) => {
      toast.error('Gagal menandai produk: ' + error.message);
    },
  });
}

function calculateScore(gmv: number, clicks: number, gmvWeight = 0.7, clicksWeight = 0.3): number {
  return gmv * gmvWeight + clicks * 1000 * clicksWeight;
}
