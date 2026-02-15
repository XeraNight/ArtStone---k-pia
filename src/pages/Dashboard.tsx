import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { LeadSourceChart } from '@/components/dashboard/LeadSourceChart';
import { RecentLeads } from '@/components/dashboard/RecentLeads';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { RegionStats } from '@/components/dashboard/RegionStats';
import { RevenueTrendChart } from '@/components/dashboard/RevenueTrendChart';
import { SalesFunnelChart } from '@/components/dashboard/SalesFunnelChart';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useEnhancedStats } from '@/hooks/useEnhancedStats';
import { Users, Inbox, FileText, UserCheck, TrendingUp, DollarSign, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: enhancedStats, isLoading: enhancedLoading } = useEnhancedStats();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isSales = user?.role === 'sales';

  // Calculate conversion rate
  const conversionRate = stats?.leads.total
    ? Math.round((stats.leads.won / stats.leads.total) * 100)
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome message */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-semibold text-foreground">
            Dobrý deň, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground mt-1">
            {isAdmin && 'Tu je prehľad celej spoločnosti ArtStone.'}
            {isManager && `Tu je prehľad vášho regiónu – ${user?.regionName}.`}
            {isSales && 'Tu je prehľad vašich klientov a úloh.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
              <Skeleton className="h-[120px]" />
            </>
          ) : (
            <>
              <StatCard
                title="Nové leady"
                value={stats?.leads.new ?? 0}
                change={stats?.leads.newChange}
                changeLabel="tento mesiac"
                icon={<Inbox className="h-5 w-5" />}
              />
              <StatCard
                title="Aktívni klienti"
                value={stats?.clients.active ?? 0}
                change={stats?.clients.activeChange}
                changeLabel="tento mesiac"
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                title="Cenové ponuky"
                value={stats?.quotes.total ?? 0}
                change={stats?.quotes.totalChange}
                changeLabel="tento týždeň"
                icon={<FileText className="h-5 w-5" />}
              />
              {(isAdmin || isManager) && (
                <StatCard
                  title="Obchodníci"
                  value={stats?.salespeople ?? 0}
                  icon={<UserCheck className="h-5 w-5" />}
                />
              )}
              {isSales && (
                <StatCard
                  title="Konverzia"
                  value={`${stats?.conversionRate ?? 0}%`}
                  change={stats?.conversionChange}
                  changeLabel="tento mesiac"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
              )}
            </>
          )}
        </div>

        {/* Enhanced KPI Stats - Admin/Manager Only */}
        {(isAdmin || isManager) && (
          <div className="grid gap-4 md:grid-cols-3">
            {enhancedLoading ? (
              <>
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
                <Skeleton className="h-[120px]" />
              </>
            ) : (
              <>
                <StatCard
                  title="Príjmy tento mesiac"
                  value={formatCurrency(enhancedStats?.totalRevenue ?? 0)}
                  change={enhancedStats?.revenueChange}
                  changeLabel="vs minulý mesiac"
                  icon={<DollarSign className="h-5 w-5" />}
                  className="border-l-4 border-l-success"
                />
                <StatCard
                  title="Priemerný deal"
                  value={formatCurrency(enhancedStats?.averageDealSize ?? 0)}
                  change={enhancedStats?.dealSizeChange}
                  changeLabel="vs minulý mesiac"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <StatCard
                  title="Úspešnosť ponúk"
                  value={`${enhancedStats?.quoteAcceptanceRate ?? 0}%`}
                  change={enhancedStats?.acceptanceRateChange}
                  changeLabel="vs minulý mesiac"
                  icon={<Target className="h-5 w-5" />}
                />
              </>
            )}
          </div>
        )}

        {/* Analytics Charts - New Section */}
        {(isAdmin || isManager) && (
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueTrendChart />
            <SalesFunnelChart />
          </div>
        )}

        {/* Charts and Lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {(isAdmin || isManager) && <LeadSourceChart />}
          <RecentLeads />
          {isAdmin && <RegionStats />}
          <ActivityTimeline />
        </div>
      </div>
    </AppLayout>
  );
}
