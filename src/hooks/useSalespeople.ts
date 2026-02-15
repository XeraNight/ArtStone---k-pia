import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, AppRole } from '@/types/database';

interface Salesperson extends Profile {
  role: AppRole;
  stats: {
    leads: number;
    clients: number;
    quotes: number;
  };
}

export function useSalespeople() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['salespeople'],
    queryFn: async () => {
      // Get profiles for sales users
      let query = supabase
        .from('profiles')
        .select(`
          *,
          region:regions(id, name)
        `)
        .eq('role', 'sales')
        .eq('is_active', true);

      // Manager can only see salespeople in their region
      if (user?.role === 'manager' && user.regionId) {
        query = query.eq('region_id', user.regionId);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Get stats for each salesperson
      const salespeopleWithStats: Salesperson[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [leadsResult, clientsResult, quotesResult] = await Promise.all([
            supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_user_id', profile.id),
            supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_user_id', profile.id),
            supabase
              .from('quotes')
              .select('*', { count: 'exact', head: true })
              .eq('created_by', profile.id),
          ]);

          return {
            ...profile,
            role: 'sales' as AppRole,
            stats: {
              leads: leadsResult.count || 0,
              clients: clientsResult.count || 0,
              quotes: quotesResult.count || 0,
            },
          };
        })
      );

      return salespeopleWithStats;
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'manager'),
  });
}

export function useAllUsers() {
  const { user } = useAuth();
  const isDemoUser = user?.id?.startsWith('admin-') || user?.id?.startsWith('manager-') || user?.id?.startsWith('sales-');

  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      console.log('=== Fetching all users ===');
      console.log('Current user role:', user?.role);
      console.log('Current user regionId:', user?.regionId);
      console.log('Is demo user:', isDemoUser);

      // DEMO MODE: Return demo profiles
      if (isDemoUser) {
        console.log('Using demo profiles for demo user');
        const { demoProfiles } = await import('@/lib/demoData');

        // Filter by manager region if needed
        let filteredProfiles = demoProfiles;
        if (user?.role === 'manager' && user.regionId) {
          filteredProfiles = demoProfiles.filter(p =>
            p.region_id === user.regionId || p.role === 'admin'
          );
        }

        console.log('Demo profiles count:', filteredProfiles.length);
        return filteredProfiles.map(profile => ({
          ...profile,
          role: profile.role as AppRole,
        }));
      }

      try {
        // Try with region join first
        let query = supabase
          .from('profiles')
          .select('*')
          .order('full_name');

        // Manager can only see users in their region
        if (user?.role === 'manager' && user.regionId) {
          query = query.eq('region_id', user.regionId);
          console.log('Manager filter applied for region:', user.regionId);
        }

        let { data: profiles, error } = await query;

        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }

        console.log('Fetched profiles (without region data):', profiles);
        console.log('Total profiles count:', profiles?.length || 0);

        // If we have profiles, try to fetch region data separately
        if (profiles && profiles.length > 0) {
          const regionIds = [...new Set(profiles.map(p => p.region_id).filter(Boolean))];

          if (regionIds.length > 0) {
            const { data: regions } = await supabase
              .from('regions')
              .select('id, name')
              .in('id', regionIds);

            console.log('Fetched regions:', regions);

            // Attach region data to profiles
            profiles = profiles.map(profile => ({
              ...profile,
              region: profile.region_id && regions
                ? regions.find(r => r.id === profile.region_id) || null
                : null
            }));
          }
        }

        return (profiles || []).map(profile => ({
          ...profile,
          role: (profile.role as AppRole) || 'sales',
        }));
      } catch (error) {
        console.error('useAllUsers query failed:', error);
        throw error;
      }
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'manager'),
  });
}
