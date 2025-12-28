import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Studio, StudioWithProductCount } from '@/types/database';
import { toast } from 'sonner';

export function useStudios() {
  return useQuery({
    queryKey: ['studios'],
    queryFn: async (): Promise<StudioWithProductCount[]> => {
      const { data: studios, error } = await supabase
        .from('studios')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get product counts for each studio
      const studiosWithCounts = await Promise.all(
        (studios || []).map(async (studio) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('studio_id', studio.id)
            .eq('status', 'LIVE');
          
          return {
            ...studio,
            product_count: count || 0,
          };
        })
      );

      return studiosWithCounts;
    },
  });
}

export function useCreateStudio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; category: string; color?: string }) => {
      const { data: studio, error } = await supabase
        .from('studios')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return studio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studios'] });
      toast.success('Studio berhasil ditambahkan!');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan studio: ' + error.message);
    },
  });
}

export function useUpdateStudio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Studio> & { id: string }) => {
      const { data: studio, error } = await supabase
        .from('studios')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return studio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studios'] });
      toast.success('Studio berhasil diperbarui!');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui studio: ' + error.message);
    },
  });
}

export function useDeleteStudio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('studios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studios'] });
      toast.success('Studio berhasil dihapus!');
    },
    onError: (error) => {
      toast.error('Gagal menghapus studio: ' + error.message);
    },
  });
}
