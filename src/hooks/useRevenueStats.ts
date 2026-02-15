import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format } from 'date-fns';

interface MonthlyRevenue {
    month: string;
    quoteRevenue: number;
    invoiceRevenue: number;
    totalRevenue: number;
}

export function useRevenueStats(months: number = 6) {
    return useQuery({
        queryKey: ['revenue-stats', months],
        queryFn: async (): Promise<MonthlyRevenue[]> => {
            const startDate = startOfMonth(subMonths(new Date(), months - 1));

            // Get accepted quotes revenue
            const { data: quotes, error: quotesError } = await supabase
                .from('quotes')
                .select('created_at, total')
                .eq('status', 'accepted')
                .gte('created_at', startDate.toISOString());

            if (quotesError) throw quotesError;

            // Get paid invoices revenue
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices')
                .select('created_at, total')
                .eq('status', 'paid')
                .gte('created_at', startDate.toISOString());

            if (invoicesError) throw invoicesError;

            // Aggregate by month
            const monthlyData: Record<string, MonthlyRevenue> = {};

            // Initialize all months
            for (let i = 0; i < months; i++) {
                const monthDate = subMonths(new Date(), months - 1 - i);
                const monthKey = format(monthDate, 'yyyy-MM');
                const monthLabel = format(monthDate, 'MMM yyyy');

                monthlyData[monthKey] = {
                    month: monthLabel,
                    quoteRevenue: 0,
                    invoiceRevenue: 0,
                    totalRevenue: 0,
                };
            }

            // Aggregate quotes
            quotes?.forEach((quote) => {
                const monthKey = format(new Date(quote.created_at), 'yyyy-MM');
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].quoteRevenue += quote.total;
                    monthlyData[monthKey].totalRevenue += quote.total;
                }
            });

            // Aggregate invoices
            invoices?.forEach((invoice) => {
                const monthKey = format(new Date(invoice.created_at), 'yyyy-MM');
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].invoiceRevenue += invoice.total;
                    // Don't add to totalRevenue if we're using quotes as primary source
                }
            });

            return Object.values(monthlyData);
        },
    });
}
