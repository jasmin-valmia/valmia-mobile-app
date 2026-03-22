import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export function useEventsFeed() {
  return useQuery({
    queryKey: ['events-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}
