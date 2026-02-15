import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { demoDashboardStats, demoLeads, demoLeadsBySource, demoRegionStats } from '@/lib/demoData';

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    contacted: number;
    offer: number;
    won: number;
    newChange?: number; // % change from last month
  };
  clients: {
    total: number;
    active: number;
    activeChange?: number; // % change from last month
  };
  quotes: {
    total: number;
    pending: number;
    accepted: number;
    totalValue: number;
    totalChange?: number; // % change from last week
  };
  invoices: {
    total: number;
    paid: number;
    overdue: number;
    totalValue: number;
    paidValue: number;
  };
  salespeople: number;
  lowStockItems: number;
  conversionRate?: number; // % of won leads
  conversionChange?: number; // % change from last month
}

export function useDashboardStats() {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.role, user?.regionId, isDemo],
    queryFn: async () => {
      // Return demo data in demo mode
      if (isDemo) {
        return demoDashboardStats;
      }
      const stats: DashboardStats = {
        leads: { total: 0, new: 0, contacted: 0, offer: 0, won: 0 },
        clients: { total: 0, active: 0 },
        quotes: { total: 0, pending: 0, accepted: 0, totalValue: 0 },
        invoices: { total: 0, paid: 0, overdue: 0, totalValue: 0, paidValue: 0 },
        salespeople: 0,
        lowStockItems: 0,
      };

      // Build base queries based on user role
      const buildQuery = (table: string) => {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });

        if (user?.role === 'manager' && user.regionId) {
          query = query.eq('region_id', user.regionId);
        } else if (user?.role === 'sales' && user.regionId) {
          // For salespeople: show items in their region OR assigned to them OR created by them
          // This matches the RLS policy logic
          query = query.or(`region_id.eq.${user.regionId},assigned_user_id.eq.${user.id},created_by.eq.${user.id}`);
        }

        return query;
      };

      // Leads stats
      const [leadsTotal, leadsNew, leadsContacted, leadsOffer, leadsWon] = await Promise.all([
        buildQuery('leads'),
        buildQuery('leads').eq('status', 'new'),
        buildQuery('leads').eq('status', 'contacted'),
        buildQuery('leads').eq('status', 'offer'),
        buildQuery('leads').eq('status', 'won'),
      ]);

      stats.leads = {
        total: leadsTotal.count || 0,
        new: leadsNew.count || 0,
        contacted: leadsContacted.count || 0,
        offer: leadsOffer.count || 0,
        won: leadsWon.count || 0,
      };

      // Clients stats - show all clients, not just active
      // (new clients start as 'prospect' but should still count)
      const clientsTotal = await buildQuery('clients');

      stats.clients = {
        total: clientsTotal.count || 0,
        active: clientsTotal.count || 0, // Show total as "active" for now
      };

      // Quotes stats (for all roles)
      let quotesQuery = supabase.from('quotes').select('status, total');
      if (user?.role === 'sales') {
        quotesQuery = quotesQuery.eq('created_by', user.id);
      }

      const { data: quotesData } = await quotesQuery;

      if (quotesData) {
        stats.quotes.total = quotesData.length;
        stats.quotes.pending = quotesData.filter(q => q.status === 'sent').length;
        stats.quotes.accepted = quotesData.filter(q => q.status === 'accepted').length;
        stats.quotes.totalValue = quotesData.reduce((sum, q) => sum + (q.total || 0), 0);
      }

      // Invoices stats (admin and manager only)
      if (user?.role === 'admin' || user?.role === 'manager') {
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('status, total');

        if (invoicesData) {
          stats.invoices.total = invoicesData.length;
          stats.invoices.paid = invoicesData.filter(i => i.status === 'paid').length;
          stats.invoices.overdue = invoicesData.filter(i => i.status === 'overdue').length;
          stats.invoices.totalValue = invoicesData.reduce((sum, i) => sum + (i.total || 0), 0);
          stats.invoices.paidValue = invoicesData
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + (i.total || 0), 0);
        }
      }

      // Salespeople count (admin and manager only)
      if (user?.role === 'admin' || user?.role === 'manager') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'sales');

        stats.salespeople = count || 0;
      }

      // Low stock items
      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('qty_available, qty_reserved, min_stock');

      if (inventoryData) {
        stats.lowStockItems = inventoryData.filter(
          item => (item.qty_available - item.qty_reserved) < item.min_stock
        ).length;
      }

      // Calculate change percentages by comparing to previous period
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Last week stats for quotes
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      startOfThisWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      const endOfLastWeek = new Date(startOfThisWeek);
      endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

      // Leads change (this month vs last month)
      let lastMonthLeadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      if (user?.role === 'manager' && user.regionId) {
        lastMonthLeadsQuery = lastMonthLeadsQuery.eq('region_id', user.regionId);
      } else if (user?.role === 'sales') {
        lastMonthLeadsQuery = lastMonthLeadsQuery.eq('assigned_user_id', user.id);
      }

      const { count: lastMonthLeadsCount } = await lastMonthLeadsQuery;
      if (lastMonthLeadsCount && lastMonthLeadsCount > 0) {
        stats.leads.newChange = Math.round(((stats.leads.new - lastMonthLeadsCount) / lastMonthLeadsCount) * 100);
      } else {
        stats.leads.newChange = stats.leads.new > 0 ? 100 : 0;
      }

      // Clients change (this month vs last month)
      let lastMonthClientsQuery = supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      if (user?.role === 'manager' && user.regionId) {
        lastMonthClientsQuery = lastMonthClientsQuery.eq('region_id', user.regionId);
      } else if (user?.role === 'sales') {
        lastMonthClientsQuery = lastMonthClientsQuery.eq('assigned_user_id', user.id);
      }

      const { count: lastMonthClientsCount } = await lastMonthClientsQuery;
      if (lastMonthClientsCount && lastMonthClientsCount > 0) {
        stats.clients.activeChange = Math.round(((stats.clients.active - lastMonthClientsCount) / lastMonthClientsCount) * 100);
      } else {
        stats.clients.activeChange = stats.clients.active > 0 ? 100 : 0;
      }

      // Quotes change (this week vs last week)
      let lastWeekQuotesQuery = supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastWeek.toISOString())
        .lte('created_at', endOfLastWeek.toISOString());

      if (user?.role === 'sales') {
        lastWeekQuotesQuery = lastWeekQuotesQuery.eq('created_by', user.id);
      }

      const { count: lastWeekQuotesCount } = await lastWeekQuotesQuery;
      if (lastWeekQuotesCount && lastWeekQuotesCount > 0) {
        stats.quotes.totalChange = Math.round(((stats.quotes.total - lastWeekQuotesCount) / lastWeekQuotesCount) * 100);
      } else {
        stats.quotes.totalChange = stats.quotes.total > 0 ? 100 : 0;
      }

      // Conversion rate and change
      stats.conversionRate = stats.leads.total > 0
        ? Math.round((stats.leads.won / stats.leads.total) * 100)
        : 0;

      // Last month conversion for comparison
      let lastMonthLeadsTotalQuery = supabase
        .from('leads')
        .select('status', { count: 'exact' })
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      if (user?.role === 'sales') {
        lastMonthLeadsTotalQuery = lastMonthLeadsTotalQuery.eq('assigned_user_id', user.id);
      }

      const { data: lastMonthLeadsData } = await lastMonthLeadsTotalQuery;
      if (lastMonthLeadsData && lastMonthLeadsData.length > 0) {
        const lastMonthWon = lastMonthLeadsData.filter(l => l.status === 'won').length;
        const lastMonthConversion = Math.round((lastMonthWon / lastMonthLeadsData.length) * 100);
        stats.conversionChange = stats.conversionRate - lastMonthConversion;
      } else {
        stats.conversionChange = 0;
      }

      return stats;
    },
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds for live updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useRecentLeads(limit = 5) {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['recent-leads', limit, user?.role, user?.regionId, isDemo],
    queryFn: async () => {
      // Return demo data in demo mode
      if (isDemo) {
        return demoLeads.slice(0, limit);
      }

      let query = supabase
        .from('leads')
        .select(`
          *,
          region:regions(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (user?.role === 'manager' && user.regionId) {
        query = query.eq('region_id', user.regionId);
      } else if (user?.role === 'sales') {
        query = query.eq('assigned_user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds for live updates
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useLeadsBySource() {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['leads-by-source', isDemo],
    queryFn: async () => {
      // Return demo data in demo mode
      if (isDemo) {
        return demoLeadsBySource;
      }

      let query = supabase.from('leads').select('source_type');

      if (user?.role === 'manager' && user.regionId) {
        query = query.eq('region_id', user.regionId);
      } else if (user?.role === 'sales') {
        query = query.eq('assigned_user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Count by source
      const sourceCounts: Record<string, number> = {};
      data?.forEach(lead => {
        sourceCounts[lead.source_type] = (sourceCounts[lead.source_type] || 0) + 1;
      });

      return Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        count,
      }));
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'manager'),
  });
}

export function useRegionStats() {
  const { user, isDemo } = useAuth();

  return useQuery({
    queryKey: ['region-stats', isDemo],
    queryFn: async () => {
      // Return demo data in demo mode
      if (isDemo) {
        return demoRegionStats;
      }

      const { data: regions } = await supabase.from('regions').select('*');

      if (!regions) return [];

      const stats = await Promise.all(
        regions.map(async (region) => {
          const [leadsResult, clientsResult] = await Promise.all([
            supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('region_id', region.id),
            supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('region_id', region.id),
          ]);

          return {
            region: region.name,
            leads: leadsResult.count || 0,
            clients: clientsResult.count || 0,
          };
        })
      );

      return stats;
    },
    enabled: !!user && user.role === 'admin',
  });
}
