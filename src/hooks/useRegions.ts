import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { demoRegions } from '@/lib/demoData';
import type { Region } from '@/types/database';

export function useRegions() {
  const { isDemo } = useAuth();

  return useQuery({
    queryKey: ['regions', isDemo],
    queryFn: async () => {
      // Return demo data in demo mode
      if (isDemo) {
        return demoRegions;
      }

      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Region[];
    },
  });
}

export function useCreateRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('regions')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
    },
  });
}
