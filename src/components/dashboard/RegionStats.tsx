import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRegionStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

export const RegionStats = memo(function RegionStats() {
  const { data: regionStats, isLoading } = useRegionStats();

  if (isLoading) {
    return (
      <Card className="vintage-card vintage-cracks">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg text-foreground">Štatistiky podľa regiónov</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] bg-[hsl(35,20%,80%)]" />
        </CardContent>
      </Card>
    );
  }

  if (!regionStats || regionStats.length === 0) {
    return (
      <Card className="vintage-card vintage-cracks">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg text-[hsl(30,35%,25%)]">Štatistiky podľa regiónov</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-[hsl(30,25%,45%)]">
            Žiadne dáta k dispozícii
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="vintage-card vintage-cracks">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg text-foreground">Štatistiky podľa regiónov</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 25%, 75%)" opacity={0.5} />
              <XAxis
                dataKey="region"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(35, 25%, 70%)' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(35, 25%, 70%)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(40, 25%, 88%)',
                  border: '1.5px solid hsl(35, 30%, 70%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px hsla(30, 20%, 40%, 0.15)',
                }}
                labelStyle={{ color: 'hsl(30, 35%, 25%)', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(30, 30%, 30%)' }}
              />
              <Bar
                dataKey="leads"
                name="Leady"
                fill="hsl(35, 40%, 55%)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="clients"
                name="Klienti"
                fill="hsl(20, 45%, 50%)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
