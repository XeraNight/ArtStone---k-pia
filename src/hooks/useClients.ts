import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import type { Client, ClientStatus } from '@/types/database';

interface ClientFilters {
  status?: ClientStatus;
  regionId?: string;
  assignedUserId?: string;
  search?: string;
}

export const demoClients: Client[] = [
  {
    id: '1',
    contact_name: 'Peter Krátky',
    company_name: 'TechSolutions s.r.o.',
    email: 'kratky@techsolutions.sk',
    phone: '+421 905 123 456',
    address: 'Priemyselná 5, Bratislava',
    postal_code: '821 09',
    region_id: '1',
    status: 'active',
    assigned_user_id: '1',
    lead_origin_id: null,
    total_value: 15400,
    notes: 'Kľúčový klient pre IT služby',
    created_by: '1',
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_user: {
      id: '1',
      full_name: 'Ján Novák',
      email: 'jan@example.com',
      phone: null,
      avatar_url: null,
      region_id: null,
      theme_preference: 'system',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '2',
    contact_name: 'Eva Malá',
    company_name: 'Design Studio',
    email: 'eva@designstudio.sk',
    phone: '+421 903 987 654',
    address: 'Hlavná 23, Košice',
    postal_code: '040 01',
    region_id: '3',
    status: 'active',
    assigned_user_id: '1',
    lead_origin_id: null,
    total_value: 5200,
    notes: 'Pravidelný odberateľ grafických prác',
    created_by: '1',
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_user: {
      id: '1',
      full_name: 'Ján Novák',
      email: 'jan@example.com',
      phone: null,
      avatar_url: null,
      region_id: null,
      theme_preference: 'system',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '3',
    contact_name: 'Ing. Jozef Varga',
    company_name: 'StavbaDom s.r.o.',
    email: 'varga@stavbadom.sk',
    phone: '+421 948 222 333',
    address: 'Dlhá 11, Nitra',
    postal_code: '949 01',
    region_id: '2',
    status: 'inactive',
    assigned_user_id: '2',
    lead_origin_id: null,
    total_value: 28000,
    notes: 'Momentálne bez aktívnych projektov',
    created_by: '2',
    created_at: new Date(Date.now() - 15552000000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_user: {
      id: '2',
      full_name: 'Mária Kováčová',
      email: 'maria@example.com',
      phone: null,
      avatar_url: null,
      region_id: null,
      theme_preference: 'system',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '4',
    contact_name: 'MUDr. Alena Novotná',
    company_name: 'Súkromná ambulancia',
    email: 'novotna@ambulancia.sk',
    phone: '+421 911 555 666',
    address: 'Nemocničná 8, Trenčín',
    postal_code: '911 01',
    region_id: '4',
    status: 'prospect',
    assigned_user_id: '1',
    lead_origin_id: null,
    total_value: 0,
    notes: 'Záujem o nový zdravotnícky softvér',
    created_by: '1',
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_user: {
      id: '1',
      full_name: 'Ján Novák',
      email: 'jan@example.com',
      phone: null,
      avatar_url: null,
      region_id: null,
      theme_preference: 'system',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: '5',
    contact_name: 'Peter Nagy',
    company_name: null,
    email: 'nagy.peter@gmail.com',
    phone: '+421 908 777 888',
    address: null,
    postal_code: null,
    region_id: '1',
    status: 'completed',
    assigned_user_id: '2',
    lead_origin_id: null,
    total_value: 1200,
    notes: 'Jednorazová konzultácia',
    created_by: '2',
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_user: {
      id: '2',
      full_name: 'Mária Kováčová',
      email: 'maria@example.com',
      phone: null,
      avatar_url: null,
      region_id: null,
      theme_preference: 'system',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

export function useClients(filters?: ClientFilters) {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let data: Client[] = [];
      console.log('useClients: fetching', { isDemo, filters });

      if (isDemo) {
        data = [...demoClients];
      } else {
        const { data: dbData, error } = await supabase
          .from('clients')
          .select('*')
          // .select(`
          //   *,
          //   assigned_user:profiles(id, full_name, email)
          // `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching clients:', error);
          throw error;
        }
        console.log('useClients: fetched', dbData);
        data = dbData as Client[];
      }

      if (filters?.status) {
        data = data.filter(c => c.status === filters.status);
      }
      if (filters?.regionId) {
        data = data.filter(c => c.region_id === filters.regionId);
      }
      if (filters?.assignedUserId) {
        data = data.filter(c => c.assigned_user_id === filters.assignedUserId);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        data = data.filter(c =>
          c.contact_name?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.company_name?.toLowerCase().includes(search)
        );
      }

      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
            *,
            assigned_user:profiles(id, full_name, email)
          `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (client: Partial<Client>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          contact_name: client.contact_name!,
          company_name: client.company_name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          postal_code: client.postal_code,
          region_id: client.region_id,
          status: client.status || 'prospect',
          notes: client.notes,
          assigned_user_id: client.assigned_user_id || user?.id,
          lead_origin_id: client.lead_origin_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      // Get current client data first to check if assigned_user_id changed
      const { data: currentClient } = await supabase
        .from('clients')
        .select('assigned_user_id,contact_name,company_name')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('clients')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create notification if assigned_user_id changed and it's not the current user
      if (
        updates.assigned_user_id &&
        currentClient?.assigned_user_id !== updates.assigned_user_id &&
        updates.assigned_user_id !== user?.id
      ) {
        await supabase.from('notifications').insert({
          user_id: updates.assigned_user_id,
          type: 'new_client',
          title: 'Nový klient priradený',
          message: `Klient ${currentClient?.contact_name || currentClient?.company_name || 'bol'} vám bol priradený`,
          entity_type: 'client',
          entity_id: id,
        });
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useConvertLeadToClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (leadId: string) => {
      // Fetch the lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // Create client from lead
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          contact_name: lead.contact_name,
          company_name: lead.company_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          postal_code: lead.postal_code,
          region_id: lead.region_id,
          status: 'active',
          assigned_user_id: lead.assigned_user_id,
          lead_origin_id: lead.id,
          notes: lead.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Update lead with converted_to_client_id
      await supabase
        .from('leads')
        .update({
          converted_to_client_id: client.id,
          status: 'won',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      // Log activity
      await supabase.from('activities').insert({
        entity_type: 'client',
        entity_id: client.id,
        activity_type: 'note',
        title: 'Klient vytvorený z leadu',
        description: `Klient bol vytvorený konverziou z leadu`,
        created_by: user?.id,
      });

      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
