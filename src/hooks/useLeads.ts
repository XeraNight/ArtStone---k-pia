import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import type { Lead, LeadStatus, LeadSource } from '@/types/database';

interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  regionId?: string;
  assignedUserId?: string;
  search?: string;
}

export const demoLeads: Lead[] = [
  {
    id: '1',
    contact_name: 'Martin Kováč',
    company_name: 'StartUp House',
    email: 'martin@startuphouse.sk',
    phone: '+421 902 111 222',
    address: null,
    postal_code: null,
    region_id: '1',
    status: 'new',
    source_type: 'website_form',
    source_campaign: null,
    source_adset: null,
    source_ad: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    external_lead_id: null,
    assigned_user_id: null,
    duplicate_of_lead_id: null,
    converted_to_client_id: null,
    notes: 'Záujem o webstránku',
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigned_user: undefined
  },
  {
    id: '2',
    contact_name: 'Jana Veselá',
    company_name: null,
    email: 'jana.vesela@gmail.com',
    phone: '+421 904 333 444',
    address: null,
    postal_code: null,
    region_id: '2',
    status: 'contacted',
    source_type: 'facebook_lead_ads',
    source_campaign: 'Spring Promo',
    source_adset: null,
    source_ad: null,
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'spring_promo',
    external_lead_id: null,
    assigned_user_id: '1',
    duplicate_of_lead_id: null,
    converted_to_client_id: null,
    notes: 'Volala ohľadom cenníka, poslať ponuku',
    created_by: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
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
    contact_name: 'Firma ABC s.r.o.',
    company_name: 'Firma ABC',
    email: 'info@firmaabc.sk',
    phone: '+421 905 555 555',
    address: null,
    postal_code: null,
    region_id: '3',
    status: 'offer',
    source_type: 'manual',
    source_campaign: null,
    source_adset: null,
    source_ad: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    external_lead_id: null,
    assigned_user_id: '2',
    duplicate_of_lead_id: null,
    converted_to_client_id: null,
    notes: 'Poslaná cenová ponuka na CRM systém',
    created_by: '1',
    created_at: new Date(Date.now() - 86400000).toISOString(),
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

export function useLeads(filters?: LeadFilters) {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let data: Lead[] = [];
      console.log('useLeads: fetching leads', { isDemo });

      if (isDemo) {
        data = [...demoLeads];
      } else {
        const { data: dbData, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('useLeads: Supabase response', { dbData, error });

        if (error) {
          console.error('useLeads: Error fetching leads', error);
          throw error;
        }
        data = dbData as Lead[];
      }

      if (filters?.status) {
        data = data.filter(l => l.status === filters.status);
      }
      if (filters?.source) {
        data = data.filter(l => l.source_type === filters.source);
      }
      if (filters?.regionId) {
        data = data.filter(l => l.region_id === filters.regionId);
      }
      if (filters?.assignedUserId) {
        data = data.filter(l => l.assigned_user_id === filters.assignedUserId);
      }
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        data = data.filter(l =>
          l.contact_name?.toLowerCase().includes(search) ||
          l.email?.toLowerCase().includes(search) ||
          l.company_name?.toLowerCase().includes(search)
        );
      }
      return data;
    },
    enabled: !!user,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          region:regions(id, name),
          assigned_user:profiles!leads_assigned_user_id_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      if (isDemo) {
        const newLead: Lead = {
          id: crypto.randomUUID(),
          contact_name: lead.contact_name!,
          company_name: lead.company_name || null,
          email: lead.email || null,
          phone: lead.phone || null,
          address: lead.address || null,
          postal_code: lead.postal_code || null,
          region_id: lead.region_id || null,
          status: lead.status || 'new',
          source_type: lead.source_type || 'manual',
          notes: lead.notes || null,
          assigned_user_id: lead.assigned_user_id || user?.id || null,
          created_by: user?.id || 'demo-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Mock empty/default values for required fields that might be missing in Partial<Lead>
          source_campaign: null,
          source_adset: null,
          source_ad: null,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          external_lead_id: null,
          duplicate_of_lead_id: null,
          converted_to_client_id: null
        };
        demoLeads.unshift(newLead);
        return newLead;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert({
          contact_name: lead.contact_name!,
          company_name: lead.company_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          postal_code: lead.postal_code,
          region_id: lead.region_id,
          status: lead.status || 'new',
          source_type: lead.source_type || 'manual',
          notes: lead.notes,
          assigned_user_id: lead.assigned_user_id || user?.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase create lead error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      console.error('Mutation create lead error:', error);
    }
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      if (isDemo) {
        // ... demo logic
        const index = demoLeads.findIndex(l => l.id === id);
        if (index !== -1) {
          demoLeads[index] = { ...demoLeads[index], ...updates, updated_at: new Date().toISOString() };
          return demoLeads[index];
        }
        throw new Error('Lead not found in demo data');
      }

      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update lead error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', data.id] });
    },
    onError: (error) => {
      console.error('Mutation update lead error:', error);
    }
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const index = demoLeads.findIndex(l => l.id === id);
        if (index !== -1) {
          demoLeads.splice(index, 1);
          return;
        }
        throw new Error('Lead not found in demo data');
      }

      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  return useMutation({
    mutationFn: async ({ leadId, userId }: { leadId: string; userId: string }) => {
      if (isDemo) {
        const index = demoLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          demoLeads[index] = { ...demoLeads[index], assigned_user_id: userId, updated_at: new Date().toISOString() };
          // Simulate fetching the assigned user profile logic for demo if needed, but UI might handle it via another lookup or just ID.
          return demoLeads[index];
        }
        throw new Error('Lead not found in demo data');
      }

      const { data, error } = await supabase
        .from('leads')
        .update({ assigned_user_id: userId, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert({
        entity_type: 'lead',
        entity_id: leadId,
        activity_type: 'note',
        title: 'Lead priradený',
        description: `Lead bol priradený novému obchodníkovi`,
        created_by: user?.id,
      });

      // Create notification if assigned to someone else (not the current user)
      if (userId && userId !== user?.id) {
        // Get lead details for notification
        const { data: leadData } = await supabase
          .from('leads')
          .select('contact_name,company_name')
          .eq('id', leadId)
          .single();

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'new_lead',
          title: 'Nový lead priradený',
          message: `Lead ${leadData?.contact_name || leadData?.company_name || ''} vám bol priradený`,
          entity_type: 'lead',
          entity_id: leadId,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  return useMutation({
    mutationFn: async ({ leadId, status, note }: { leadId: string; status: LeadStatus; note?: string }) => {
      if (isDemo) {
        const index = demoLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          demoLeads[index] = { ...demoLeads[index], status: status, updated_at: new Date().toISOString() };
          return demoLeads[index];
        }
        throw new Error('Lead not found in demo data');
      }

      const { data, error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert({
        entity_type: 'lead',
        entity_id: leadId,
        activity_type: 'status_change',
        title: 'Zmena statusu',
        description: note || `Status zmenený na: ${status}`,
        created_by: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUnassignLead() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  return useMutation({
    mutationFn: async (leadId: string) => {
      if (isDemo) {
        const index = demoLeads.findIndex(l => l.id === leadId);
        if (index !== -1) {
          demoLeads[index] = { ...demoLeads[index], assigned_user_id: null, updated_at: new Date().toISOString() };
          return demoLeads[index];
        }
        throw new Error('Lead not found in demo data');
      }

      const { data, error } = await supabase
        .from('leads')
        .update({ assigned_user_id: null, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert({
        entity_type: 'lead',
        entity_id: leadId,
        activity_type: 'note',
        title: 'Priradenie zrušené',
        description: 'Lead bol oddelený od obchodníka',
        created_by: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  return useMutation({
    mutationFn: async (leadId: string) => {
      if (isDemo) {
        throw new Error('Nemôžete konvertovať leady v demo režime');
      }

      // 1. Fetch the full lead data
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;
      if (!lead) throw new Error('Lead not found');

      // Check if already converted
      if (lead.converted_to_client_id) {
        throw new Error('Tento lead už bol konvertovaný na klienta');
      }

      // 2. Check for duplicate client (by email)
      if (lead.email) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id, contact_name')
          .eq('email', lead.email)
          .single();

        if (existingClient) {
          throw new Error(`Klient s emailom ${lead.email} už existuje`);
        }
      }

      // 3. Create new client from lead data
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          contact_name: lead.contact_name,
          company_name: lead.company_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          postal_code: lead.postal_code,
          region_id: lead.region_id,
          assigned_user_id: lead.assigned_user_id,
          notes: lead.notes,
          status: 'active', // New clients start as active
          converted_from_lead_id: lead.id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        throw clientError;
      }

      // 4. Copy all activities from lead to client
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('entity_type', 'lead')
        .eq('entity_id', leadId);

      if (!activitiesError && activities && activities.length > 0) {
        // Create new activities for the client
        const clientActivities = activities.map(activity => ({
          entity_type: 'client' as const,
          entity_id: newClient.id,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          created_by: activity.created_by,
          created_at: activity.created_at,
        }));

        await supabase.from('activities').insert(clientActivities);
      }

      // 5. Update lead with conversion info
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          converted_to_client_id: newClient.id,
          converted_at: new Date().toISOString(),
          status: 'won', // Mark lead as won
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (updateError) {
        console.error('Error updating lead:', updateError);
        // Don't throw here, client was created successfully
      }

      // 6. Log conversion activity on the client
      await supabase.from('activities').insert({
        entity_type: 'client',
        entity_id: newClient.id,
        activity_type: 'note',
        title: 'Klient vytvorený z leadu',
        description: `Klient bol úspešne konvertovaný z leadu "${lead.contact_name}"`,
        created_by: user?.id,
      });

      return {
        client: newClient,
        lead: lead,
        activitiesCopied: activities?.length || 0,
      };
    },
    onSuccess: (data) => {
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leads'] });
    },
    onError: (error) => {
      console.error('Lead conversion error:', error);
    },
  });
}
