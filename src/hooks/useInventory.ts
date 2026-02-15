import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { InventoryItem, InventoryCategory } from '@/types/database';

interface InventoryFilters {
  categoryId?: string;
  search?: string;
  lowStock?: boolean;
}

export const demoInventoryCategories: InventoryCategory[] = [
  { id: '1', name: 'Hardware', created_at: new Date().toISOString() },
  { id: '2', name: 'Software', created_at: new Date().toISOString() },
  { id: '3', name: 'Služby', created_at: new Date().toISOString() },
  { id: '4', name: 'Kancelárske potreby', created_at: new Date().toISOString() }
];

export const demoInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Notebook Dell XPS 15',
    sku: 'HW-DELL-XPS15',
    category_id: '1',
    qty_available: 5,
    qty_reserved: 1,
    min_stock: 2,
    purchase_price: 1800,
    sale_price: 2400,
    notes: 'High-end notebook pre vývojárov',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: '1', name: 'Hardware', created_at: new Date().toISOString() }
  },
  {
    id: '2',
    name: 'Monitor Dell UltraSharp U2723QE',
    sku: 'HW-DELL-U2723QE',
    category_id: '1',
    qty_available: 12,
    qty_reserved: 0,
    min_stock: 5,
    purchase_price: 450,
    sale_price: 650,
    notes: '4K USB-C Hub Monitor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: '1', name: 'Hardware', created_at: new Date().toISOString() }
  },
  {
    id: '3',
    name: 'Office 365 Business Standard',
    sku: 'SW-O365-BUS',
    category_id: '2',
    qty_available: 100,
    qty_reserved: 0,
    min_stock: 10,
    purchase_price: 10,
    sale_price: 12.5,
    notes: 'Mesačná licencia',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: '2', name: 'Software', created_at: new Date().toISOString() }
  },
  {
    id: '4',
    name: 'Inštalácia Windowsu',
    sku: 'SRV-WIN-INSTALL',
    category_id: '3',
    qty_available: 999,
    qty_reserved: 0,
    min_stock: 0,
    purchase_price: 0,
    sale_price: 50,
    notes: 'Služba inštalácie OS',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: '3', name: 'Služby', created_at: new Date().toISOString() }
  }
];

export function useInventoryCategories() {
  const { isDemo } = useAuth();

  return useQuery({
    queryKey: ['inventory-categories', isDemo],
    queryFn: async () => {
      if (isDemo) {
        return demoInventoryCategories;
      }

      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as InventoryCategory[];
    },
  });
}

export function useInventoryItems(filters?: InventoryFilters) {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['inventory', filters, isDemo],
    queryFn: async () => {
      if (isDemo) {
        let items = [...demoInventoryItems];

        if (filters?.categoryId) {
          items = items.filter(i => i.category_id === filters.categoryId);
        }
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          items = items.filter(i =>
            i.name.toLowerCase().includes(search) ||
            i.sku.toLowerCase().includes(search)
          );
        }

        // Filter low stock items client-side
        if (filters?.lowStock) {
          items = items.filter(item => (item.qty_available - item.qty_reserved) < item.min_stock);
        }

        return items;
      }

      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories(id, name)
        `)
        .order('name');

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let items = data as InventoryItem[];

      // Filter low stock items client-side
      if (filters?.lowStock) {
        items = items.filter(item => (item.qty_available - item.qty_reserved) < item.min_stock);
      }

      return items;
    },
    enabled: !!user,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as InventoryItem;
    },
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Partial<InventoryItem>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          name: item.name!,
          sku: item.sku!,
          category_id: item.category_id,
          qty_available: item.qty_available || 0,
          qty_reserved: 0,
          min_stock: item.min_stock || 0,
          purchase_price: item.purchase_price,
          sale_price: item.sale_price,
          notes: item.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
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
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', data.id] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, forceDelete = false }: { id: string; forceDelete?: boolean }) => {
      // First, check if this item is used in any quotes
      const { data: quoteItems, error: checkError } = await supabase
        .from('quote_items')
        .select('id, quote:quotes(quote_number)')
        .eq('inventory_item_id', id);

      if (checkError) throw checkError;

      const affectedQuotes = quoteItems
        ?.map((item: any) => item.quote?.quote_number)
        .filter(Boolean) || [];

      // Check if used in invoices
      const { data: invoiceItems, error: invoiceCheckError } = await supabase
        .from('invoice_items')
        .select('id, invoice:invoices(invoice_number)')
        .eq('inventory_item_id', id);

      if (invoiceCheckError) throw invoiceCheckError;

      const affectedInvoices = invoiceItems
        ?.map((item: any) => item.invoice?.invoice_number)
        .filter(Boolean) || [];

      // If item has references and forceDelete is not enabled, throw error with details
      if ((affectedQuotes.length > 0 || affectedInvoices.length > 0) && !forceDelete) {
        const error: any = new Error('Item has references');
        error.affectedQuotes = affectedQuotes;
        error.affectedInvoices = affectedInvoices;
        throw error;
      }

      // If forceDelete is enabled, remove all references first
      if (forceDelete) {
        // Delete from quote_items
        if (quoteItems && quoteItems.length > 0) {
          const { error: deleteQuoteItemsError } = await supabase
            .from('quote_items')
            .delete()
            .eq('inventory_item_id', id);

          if (deleteQuoteItemsError) throw deleteQuoteItemsError;
        }

        // Delete from invoice_items
        if (invoiceItems && invoiceItems.length > 0) {
          const { error: deleteInvoiceItemsError } = await supabase
            .from('invoice_items')
            .delete()
            .eq('inventory_item_id', id);

          if (deleteInvoiceItemsError) throw deleteInvoiceItemsError;
        }
      }

      // Proceed with deletion
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useCreateInventoryCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, adjustment }: { itemId: string; adjustment: number }) => {
      // Get current stock
      const { data: current, error: fetchError } = await supabase
        .from('inventory_items')
        .select('qty_available')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const newQty = Math.max(0, (current.qty_available || 0) + adjustment);

      const { data, error } = await supabase
        .from('inventory_items')
        .update({ qty_available: newQty, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useInventoryReservations(itemId: string) {
  const { isDemo } = useAuth();

  return useQuery({
    queryKey: ['inventory-reservations', itemId, isDemo],
    queryFn: async () => {
      if (isDemo) {
        // Return empty array for demo mode
        return [];
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          client:clients(id, contact_name, company_name),
          quote:quotes(id, quote_number)
        `)
        .eq('inventory_item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });
}
