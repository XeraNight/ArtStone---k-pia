import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths } from 'date-fns';

interface EnhancedStats {
    totalRevenue: number;
    revenueChange: number;
    averageDealSize: number;
    dealSizeChange: number;
    quoteAcceptanceRate: number;
    acceptanceRateChange: number;
}

export function useEnhancedStats() {
    return useQuery({
        queryKey: ['enhanced-stats'],
        queryFn: async (): Promise<EnhancedStats> => {
            const thisMonthStart = startOfMonth(new Date());
            const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
            const twoMonthsAgoStart = startOfMonth(subMonths(new Date(), 2));

            // Get this month's accepted quotes
            const { data: thisMonthQuotes, error: thisMonthError } = await supabase
                .from('quotes')
                .select('total, status')
                .gte('created_at', thisMonthStart.toISOString());

            if (thisMonthError) throw thisMonthError;

            // Get last month's accepted quotes
            const { data: lastMonthQuotes, error: lastMonthError } = await supabase
                .from('quotes')
                .select('total, status')
                .gte('created_at', lastMonthStart.toISOString())
                .lt('created_at', thisMonthStart.toISOString());

            if (lastMonthError) throw lastMonthError;

            // Calculate total revenue (this month)
            const thisMonthAccepted = thisMonthQuotes?.filter(q => q.status === 'accepted') || [];
            const totalRevenue = thisMonthAccepted.reduce((sum, q) => sum + q.total, 0);

            // Calculate last month revenue
            const lastMonthAccepted = lastMonthQuotes?.filter(q => q.status === 'accepted') || [];
            const lastMonthRevenue = lastMonthAccepted.reduce((sum, q) => sum + q.total, 0);

            // Calculate revenue change
            const revenueChange = lastMonthRevenue > 0
                ? Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
                : 0;

            // Calculate average deal size
            const averageDealSize = thisMonthAccepted.length > 0
                ? Math.round(totalRevenue / thisMonthAccepted.length)
                : 0;

            const lastMonthAvgDeal = lastMonthAccepted.length > 0
                ? Math.round(lastMonthRevenue / lastMonthAccepted.length)
                : 0;

            const dealSizeChange = lastMonthAvgDeal > 0
                ? Math.round(((averageDealSize - lastMonthAvgDeal) / lastMonthAvgDeal) * 100)
                : 0;

            // Calculate quote acceptance rate (this month)
            const thisMonthTotal = thisMonthQuotes?.length || 0;
            const thisMonthAcceptedCount = thisMonthAccepted.length;
            const quoteAcceptanceRate = thisMonthTotal > 0
                ? Math.round((thisMonthAcceptedCount / thisMonthTotal) * 100)
                : 0;

            // Calculate last month acceptance rate
            const lastMonthTotal = lastMonthQuotes?.length || 0;
            const lastMonthAcceptedCount = lastMonthAccepted.length;
            const lastMonthAcceptanceRate = lastMonthTotal > 0
                ? Math.round((lastMonthAcceptedCount / lastMonthTotal) * 100)
                : 0;

            const acceptanceRateChange = quoteAcceptanceRate - lastMonthAcceptanceRate;

            return {
                totalRevenue,
                revenueChange,
                averageDealSize,
                dealSizeChange,
                quoteAcceptanceRate,
                acceptanceRateChange,
            };
        },
    });
}
