import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { demoClients } from './useClients';
import type { Quote, QuoteStatus, QuoteItem } from '@/types/database';

interface QuoteFilters {
  status?: QuoteStatus;
  clientId?: string;
  search?: string;
}

// In-memory store for demo quotes
export let demoQuotes: Quote[] = [
  {
    id: '1',
    quote_number: 'CP-2024-0001',
    client_id: '1',
    status: 'sent',
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 2000,
    discount: 0,
    shipping: 0,
    tax_rate: 20,
    tax_amount: 400,
    total: 2400,
    notes: 'Ponuka na nový hardware',
    pdf_url: null,
    created_by: '1',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    client: demoClients.find(c => c.id === '1'),
    created_by_user: {
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
  }
];

export function useQuotes(filters?: QuoteFilters) {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['quotes', filters, isDemo],
    queryFn: async () => {
      let data: Quote[] = [];

      if (isDemo) {
        data = [...demoQuotes];
      } else {
        console.log('Fetching quotes from Supabase...');
        // Simplified query first to ensure we get data
        let query = supabase
          .from('quotes')
          .select(`
            *,
            client:clients(id, contact_name, company_name)
          `)
          .order('created_at', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.clientId) {
          query = query.eq('client_id', filters.clientId);
        }
        if (filters?.search) {
          query = query.or(`quote_number.ilike.%${filters.search}%`);
        }

        const { data: dbData, error } = await query;

        console.log('Quotes fetch result:', { data: dbData, error });

        if (error) {
          console.error('Error fetching quotes:', error);
          throw error;
        }
        data = dbData as Quote[];
      }

      // Filter demo data client-side if needed (mimicking DB filters)
      if (isDemo) {
        if (filters?.status) {
          data = data.filter(q => q.status === filters.status);
        }
        if (filters?.clientId) {
          data = data.filter(q => q.client_id === filters.clientId);
        }
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          data = data.filter(q =>
            q.quote_number.toLowerCase().includes(search) ||
            q.client?.contact_name.toLowerCase().includes(search) ||
            q.client?.company_name?.toLowerCase().includes(search)
          );
        }
      }

      return data;
    },
    enabled: !!user,
  });
}

export function useQuote(id: string) {
  const { isDemo } = useAuth();

  return useQuery({
    queryKey: ['quotes', id, isDemo],
    queryFn: async () => {
      if (isDemo) {
        const quote = demoQuotes.find(q => q.id === id);
        if (!quote) throw new Error('Quote not found');
        return quote;
      }

      const { data, error } = await supabase
        .from('quotes')
        .select(`
                  *,
                  client:clients(id, contact_name, company_name, email, phone, address),
                  items:quote_items(*)
                `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Quote;
    },
    enabled: !!id,
  });
}

async function generateQuoteNumber(): Promise<string> {
  try {
    // Use the database function that bypasses RLS
    const { data, error } = await supabase.rpc('get_next_quote_number');

    if (error) {
      console.error('Error generating quote number:', error);
      // Fallback to timestamp-based number
      const year = new Date().getFullYear();
      return `CP-${year}-${Date.now().toString().slice(-4)}`;
    }

    return data as string;
  } catch (err) {
    console.error('Exception generating quote number:', err);
    // Fallback to timestamp-based number
    const year = new Date().getFullYear();
    return `CP-${year}-${Date.now().toString().slice(-4)}`;
  }
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  return useMutation({
    mutationFn: async (quote: {
      client_id: string;
      valid_until?: string;
      notes?: string;
      discount?: number;
      shipping?: number;
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        inventory_item_id?: string;
      }>;
    }) => {
      // Calculate totals
      const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const discount = quote.discount || 0;
      const shipping = quote.shipping || 0;

      // Calculate tax base: (Subtotal - Discount) + Shipping
      // Note: Usually shipping is taxable. Let's assume standard logic: (Subtotal - Discount + Shipping) is base
      const taxableBase = Math.max(0, subtotal - discount + shipping);
      const taxRate = 20;
      const taxAmount = taxableBase * (taxRate / 100);
      const total = taxableBase + taxAmount;

      let quoteNumber = `CP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;

      if (isDemo) {
        const newQuote: Quote = {
          id: Math.random().toString(36).substr(2, 9),
          quote_number: quoteNumber,
          client_id: quote.client_id,
          status: 'draft',
          valid_until: quote.valid_until || null,
          subtotal,
          discount,
          shipping,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          notes: quote.notes || null,
          pdf_url: null,
          created_by: user?.id || 'demo-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client: demoClients.find(c => c.id === quote.client_id),
        };
        demoQuotes.unshift(newQuote);
        return newQuote;
      }

      quoteNumber = await generateQuoteNumber();

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          quote_number: quoteNumber,
          client_id: quote.client_id,
          status: 'draft',
          valid_until: quote.valid_until,
          subtotal,
          discount,
          shipping,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          notes: quote.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert items
      const itemsToInsert = quote.items.map(item => ({
        quote_id: quoteData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        inventory_item_id: item.inventory_item_id,
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Create reservations and update inventory for items with inventory_item_id
      const itemsWithInventory = quote.items.filter(item => item.inventory_item_id);

      for (const item of itemsWithInventory) {
        // Create reservation record
        const { error: reservationError } = await supabase
          .from('reservations')
          .insert({
            inventory_item_id: item.inventory_item_id!,
            quote_id: quoteData.id,
            client_id: quote.client_id,
            quantity: item.quantity,
            status: 'active',
          });

        if (reservationError) {
          console.error('Error creating reservation:', reservationError);
          throw new Error('Failed to create inventory reservation');
        }

        // Update inventory qty_reserved
        const { data: currentInventory, error: fetchError } = await supabase
          .from('inventory_items')
          .select('qty_reserved')
          .eq('id', item.inventory_item_id)
          .single();

        if (fetchError) {
          console.error('Error fetching inventory:', fetchError);
          throw new Error('Failed to fetch inventory data');
        }

        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            qty_reserved: (currentInventory.qty_reserved || 0) + item.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.inventory_item_id);

        if (updateError) {
          console.error('Error updating inventory:', updateError);
          throw new Error('Failed to update inventory reservation');
        }
      }

      return quoteData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quote> & { id: string }) => {
      if (isDemo) {
        const index = demoQuotes.findIndex(q => q.id === id);
        if (index !== -1) {
          demoQuotes[index] = { ...demoQuotes[index], ...updates, updated_at: new Date().toISOString() };
          return demoQuotes[index];
        }
        throw new Error('Quote not found');
      }

      const { data, error } = await supabase
        .from('quotes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', data.id] });
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();

  return useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: QuoteStatus }) => {
      if (isDemo) {
        const index = demoQuotes.findIndex(q => q.id === quoteId);
        if (index !== -1) {
          demoQuotes[index] = { ...demoQuotes[index], status, updated_at: new Date().toISOString() };
          return demoQuotes[index];
        }
        throw new Error('Quote not found');
      }

      // If status is being changed to 'rejected', release reservations
      if (status === 'rejected') {
        const { data: reservations, error: fetchReservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('quote_id', quoteId);

        if (!fetchReservationsError && reservations) {
          // Reduce qty_reserved for each reserved item
          for (const reservation of reservations) {
            const { data: currentInventory, error: fetchError } = await supabase
              .from('inventory_items')
              .select('qty_reserved')
              .eq('id', reservation.inventory_item_id)
              .single();

            if (!fetchError && currentInventory) {
              await supabase
                .from('inventory_items')
                .update({
                  qty_reserved: Math.max(0, (currentInventory.qty_reserved || 0) - reservation.quantity),
                  updated_at: new Date().toISOString()
                })
                .eq('id', reservation.inventory_item_id);
            }
          }

          // Update reservation status to 'cancelled'
          await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('quote_id', quoteId);
        }
      }

      const { data, error } = await supabase
        .from('quotes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', quoteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const index = demoQuotes.findIndex(q => q.id === id);
        if (index !== -1) {
          demoQuotes.splice(index, 1);
        }
        return;
      }

      // First, nullify quote_id in any invoices that reference this quote
      const { error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({ quote_id: null })
        .eq('quote_id', id);

      if (invoiceUpdateError) {
        console.error('Error updating invoices:', invoiceUpdateError);
        throw invoiceUpdateError;
      }

      // Release reservations before deleting
      const { data: reservations, error: fetchReservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('quote_id', id);

      if (fetchReservationsError) {
        console.error('Error fetching reservations:', fetchReservationsError);
      } else if (reservations) {
        // Reduce qty_reserved for each reserved item
        for (const reservation of reservations) {
          const { data: currentInventory, error: fetchError } = await supabase
            .from('inventory_items')
            .select('qty_reserved')
            .eq('id', reservation.inventory_item_id)
            .single();

          if (!fetchError && currentInventory) {
            await supabase
              .from('inventory_items')
              .update({
                qty_reserved: Math.max(0, (currentInventory.qty_reserved || 0) - reservation.quantity),
                updated_at: new Date().toISOString()
              })
              .eq('id', reservation.inventory_item_id);
          }
        }

        // Delete reservations
        await supabase.from('reservations').delete().eq('quote_id', id);
      }

      // Delete items first (should cascade, but just in case)
      await supabase.from('quote_items').delete().eq('quote_id', id);

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
