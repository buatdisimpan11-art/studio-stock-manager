import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudioRotation, Product } from '@/types/database';

export function useRotations() {
  return useQuery({
    queryKey: ['rotations'],
    queryFn: async (): Promise<StudioRotation[]> => {
      // Get all studios
      const { data: studios, error: studiosError } = await supabase
        .from('studios')
        .select('*')
        .order('created_at', { ascending: true });

      if (studiosError) throw studiosError;

      const rotations: StudioRotation[] = await Promise.all(
        (studios || []).map(async (studio) => {
          // Get LIVE products for this studio, sorted by score (lowest first)
          const { data: liveProducts, error: liveError } = await supabase
            .from('products')
            .select('*')
            .eq('studio_id', studio.id)
            .eq('status', 'LIVE')
            .order('score', { ascending: true })
            .limit(studio.daily_rotation);

          if (liveError) throw liveError;

          // Get AVAILABLE products for this studio
          const { data: availableProducts, error: availableError } = await supabase
            .from('products')
            .select('*')
            .eq('studio_id', studio.id)
            .eq('status', 'AVAILABLE')
            .order('created_at', { ascending: false })
            .limit(studio.daily_rotation);

          if (availableError) throw availableError;

          return {
            studio,
            toRemove: (liveProducts || []).map((product: Product) => ({
              product,
              action: 'remove' as const,
              markedComplete: false,
            })),
            toAdd: (availableProducts || []).map((product: Product) => ({
              product,
              action: 'add' as const,
              markedComplete: false,
            })),
          };
        })
      );

      return rotations;
    },
  });
}
