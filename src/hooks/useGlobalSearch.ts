import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { SearchResults, SearchResult } from '@/types/search';

export function useGlobalSearch(query: string) {
    const { user } = useAuth();
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const { data: results, isLoading } = useQuery({
        queryKey: ['global-search', debouncedQuery, user?.id],
        queryFn: async (): Promise<SearchResults> => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                return { leads: [], clients: [], quotes: [], invoices: [], inventory: [] };
            }

            const searchPattern = `%${debouncedQuery}%`;

            // Build base queries
            let leadsQuery = supabase
                .from('leads')
                .select('id, contact_name, email, phone, company_name, status')
                .or(`contact_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern},company_name.ilike.${searchPattern}`)
                .limit(5);

            let clientsQuery = supabase
                .from('clients')
                .select('id, contact_name, email, phone, company_name, status')
                .or(`contact_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern},company_name.ilike.${searchPattern}`)
                .limit(5);

            let quotesQuery = supabase
                .from('quotes')
                .select('id, quote_number, client_id, clients(contact_name), total_price')
                .ilike('quote_number', searchPattern)
                .limit(5);

            let invoicesQuery = supabase
                .from('invoices')
                .select('id, invoice_number, total, status, clients(contact_name, company_name)')
                .ilike('invoice_number', searchPattern)
                .limit(5);

            let inventoryQuery = supabase
                .from('inventory_items')
                .select('id, name, sku, sale_price, category:inventory_categories(name)')
                .or(`name.ilike.${searchPattern},sku.ilike.${searchPattern}`)
                .limit(5);

            // Filter by region for sales users
            if (user?.role === 'sales' && user?.regionId) {
                leadsQuery = leadsQuery.eq('region_id', user.regionId);
                clientsQuery = clientsQuery.eq('region_id', user.regionId);
            }

            // Execute searches in parallel with error handling
            const [leadsRes, clientsRes, quotesRes, invoicesRes, inventoryRes] = await Promise.allSettled([
                leadsQuery,
                clientsQuery,
                quotesQuery,
                invoicesQuery,
                inventoryQuery,
            ]);

            // Format results
            const leads: SearchResult[] = (leadsRes.status === 'fulfilled' && leadsRes.value.data || []).map((lead: any) => ({
                id: lead.id,
                type: 'lead' as const,
                title: lead.contact_name,
                subtitle: lead.company_name,
                metadata: {
                    email: lead.email,
                    phone: lead.phone,
                    status: lead.status,
                },
                href: `/leads`,
            }));

            const clients: SearchResult[] = (clientsRes.status === 'fulfilled' && clientsRes.value.data || []).map((client: any) => ({
                id: client.id,
                type: 'client' as const,
                title: client.contact_name,
                subtitle: client.company_name,
                metadata: {
                    email: client.email,
                    phone: client.phone,
                    status: client.status,
                },
                href: `/clients`,
            }));

            const quotes: SearchResult[] = (quotesRes.status === 'fulfilled' && quotesRes.value.data || []).map((quote: any) => ({
                id: quote.id,
                type: 'quote' as const,
                title: `Ponuka ${quote.quote_number}`,
                subtitle: quote.clients?.contact_name,
                metadata: {
                    company: quote.total_price ? `${quote.total_price}€` : undefined,
                },
                href: `/quotes`,
            }));

            const invoices: SearchResult[] = (invoicesRes.status === 'fulfilled' && invoicesRes.value.data || []).map((invoice: any) => ({
                id: invoice.id,
                type: 'invoice' as const,
                title: `Faktúra ${invoice.invoice_number}`,
                subtitle: invoice.clients?.contact_name || invoice.clients?.company_name,
                metadata: {
                    company: invoice.total ? `${invoice.total}€` : undefined,
                    status: invoice.status,
                },
                href: `/invoices`,
            }));

            const inventory: SearchResult[] = (inventoryRes.status === 'fulfilled' && inventoryRes.value.data || []).map((item: any) => ({
                id: item.id,
                type: 'inventory' as const,
                title: item.name,
                subtitle: item.sku,
                metadata: {
                    company: item.sale_price ? `${item.sale_price}€` : undefined,
                },
                href: `/inventory`,
            }));

            return { leads, clients, quotes, invoices, inventory };
        },
        enabled: debouncedQuery.length >= 2,
    });

    const clearResults = useCallback(() => {
        setDebouncedQuery('');
    }, []);

    return {
        results: results || { leads: [], clients: [], quotes: [], invoices: [], inventory: [] },
        isLoading,
        clearResults,
    };
}
