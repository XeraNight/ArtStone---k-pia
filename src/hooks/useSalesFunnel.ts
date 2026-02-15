import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

interface FunnelStage {
    name: string;
    count: number;
    percentage: number;
}

interface SalesFunnelData {
    stages: FunnelStage[];
    totalLeads: number;
    conversionRate: number;
}

export function useSalesFunnel(days: number = 30) {
    return useQuery({
        queryKey: ['sales-funnel', days],
        queryFn: async (): Promise<SalesFunnelData> => {
            const startDate = subDays(new Date(), days);

            const { data: leads, error } = await supabase
                .from('leads')
                .select('status')
                .gte('created_at', startDate.toISOString());

            if (error) throw error;

            const totalLeads = leads?.length || 0;

            // Count leads at each stage
            const newLeads = leads?.filter(l => l.status === 'new').length || 0;
            const contacted = leads?.filter(l => l.status === 'contacted').length || 0;
            const offer = leads?.filter(l => l.status === 'offer').length || 0;
            const won = leads?.filter(l => l.status === 'won').length || 0;

            const stages: FunnelStage[] = [
                {
                    name: 'Nové leady',
                    count: totalLeads,
                    percentage: 100,
                },
                {
                    name: 'Kontaktované',
                    count: contacted + offer + won,
                    percentage: totalLeads > 0 ? Math.round(((contacted + offer + won) / totalLeads) * 100) : 0,
                },
                {
                    name: 'Ponuka odoslaná',
                    count: offer + won,
                    percentage: totalLeads > 0 ? Math.round(((offer + won) / totalLeads) * 100) : 0,
                },
                {
                    name: 'Vyhraté',
                    count: won,
                    percentage: totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0,
                },
            ];

            const conversionRate = totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0;

            return {
                stages,
                totalLeads,
                conversionRate,
            };
        },
    });
}
