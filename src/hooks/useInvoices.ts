import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Invoice, InvoiceStatus } from '@/types/database';

interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  search?: string;
}

export const demoInvoices: Invoice[] = [
  {
    id: '1',
    invoice_number: 'FA-2024-0001',
    client_id: '1',
    quote_id: null,
    status: 'paid',
    issue_date: '2024-01-15',
    due_date: '2024-01-29',
    subtotal: 1200,
    tax_rate: 20,
    tax_amount: 240,
    total: 1440,
    notes: 'Fakturujeme Vám za IT služby',
    pdf_url: null,
    created_by: '1',
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2024-01-16').toISOString(),
    client: {
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
      notes: null,
      created_by: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
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
  },
  {
    id: '2',
    invoice_number: 'FA-2024-0002',
    client_id: '2',
    quote_id: null,
    status: 'sent',
    issue_date: '2024-02-01',
    due_date: '2024-02-15',
    subtotal: 800,
    tax_rate: 20,
    tax_amount: 160,
    total: 960,
    notes: 'Grafické práce - návrh loga',
    pdf_url: null,
    created_by: '1',
    created_at: new Date('2024-02-01').toISOString(),
    updated_at: new Date().toISOString(),
    client: {
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
      notes: null,
      created_by: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
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
  },
  {
    id: '3',
    invoice_number: 'FA-2024-0003',
    client_id: '1',
    quote_id: null,
    status: 'overdue',
    issue_date: '2024-03-01',
    due_date: '2024-03-15',
    subtotal: 2500,
    tax_rate: 20,
    tax_amount: 500,
    total: 3000,
    notes: 'Vývoj nového modulu',
    pdf_url: null,
    created_by: '1',
    created_at: new Date('2024-03-01').toISOString(),
    updated_at: new Date().toISOString(),
    client: {
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
      notes: null,
      created_by: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
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

export function useInvoices(filters?: InvoiceFilters) {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let data: Invoice[] = [];

      if (isDemo) {
        data = [...demoInvoices];
      } else {
        const { data: dbData, error } = await supabase
          .from('invoices')
          .select(`
            *,
            client:clients(id, contact_name, company_name)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading invoices:', error);
          throw error;
        }

        data = dbData as Invoice[];
      }

      if (filters?.status) {
        data = data.filter(i => i.status === filters.status);
      }
      if (filters?.clientId) {
        data = data.filter(i => i.client_id === filters.clientId);
      }
      if (filters?.search) {
        data = data.filter(i => i.invoice_number.toLowerCase().includes(filters.search!.toLowerCase()));
      }

      return data;
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'manager'),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, contact_name, company_name, email, phone, address),
          items:invoice_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Invoice;
    },
    enabled: !!id,
  });
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`);

  const number = (count || 0) + 1;
  return `FA-${year}-${number.toString().padStart(4, '0')}`;
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user, isDemo } = useAuth();

  return useMutation({
    mutationFn: async (invoice: {
      client_id: string;
      quote_id?: string;
      due_date?: string;
      notes?: string;
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        inventory_item_id?: string;
      }>;
    }) => {
      // Prevent creating real invoices in demo mode
      if (isDemo) {
        throw new Error('Nemôžete vytvárať faktúry v demo režime');
      }

      const invoiceNumber = await generateInvoiceNumber();

      // Calculate totals
      const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const taxRate = 20;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: invoice.client_id,
          quote_id: invoice.quote_id,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: invoice.due_date,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          notes: invoice.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items
      const itemsToInsert = invoice.items.map(item => ({
        invoice_id: invoiceData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        inventory_item_id: item.inventory_item_id,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useCreateInvoiceFromQuote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      // Fetch quote with items
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*, items:quote_items(*)')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      const invoiceNumber = await generateInvoiceNumber();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: quote.client_id,
          quote_id: quoteId,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          subtotal: quote.subtotal,
          tax_rate: quote.tax_rate,
          tax_amount: quote.tax_amount,
          total: quote.total,
          notes: quote.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Copy items from quote
      if (quote.items && quote.items.length > 0) {
        const itemsToInsert = quote.items.map((item: any) => ({
          invoice_id: invoiceData.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          inventory_item_id: item.inventory_item_id,
        }));

        await supabase.from('invoice_items').insert(itemsToInsert);
      }

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();

  return useMutation({
    mutationFn: async (invoice: {
      id: string;
      client_id: string;
      due_date?: string;
      status?: InvoiceStatus;
      notes?: string;
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        inventory_item_id?: string;
      }>;
    }) => {
      if (isDemo) {
        throw new Error('Not implemented for demo');
      }

      // 1. Update Invoice Details
      const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const taxRate = 20;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          client_id: invoice.client_id,
          due_date: invoice.due_date,
          status: invoice.status,
          notes: invoice.notes,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);

      if (deleteError) throw deleteError;

      // 3. Insert new items
      if (invoice.items.length > 0) {
        const itemsToInsert = invoice.items.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price,
          inventory_item_id: item.inventory_item_id,
        }));

        const { error: insertError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      return updatedInvoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete items first (should cascade, but just in case)
      await supabase.from('invoice_items').delete().eq('invoice_id', id);

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
