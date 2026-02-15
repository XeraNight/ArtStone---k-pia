import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLeadsBySource } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

// ArtStone color palette - Industrial Orange & Monochrome
const COLORS = [
  'hsl(28 100% 50%)',   // ArtStone Orange
  'hsl(0 0% 80%)',      // Light Grey
  'hsl(0 0% 40%)',      // Medium Grey
  'hsl(0 0% 20%)',      // Dark Grey
  'hsl(28 100% 65%)',   // Lighter Orange
];

const sourceLabels: Record<string, string> = {
  facebook_lead_ads: 'Facebook Lead Ads',
  google_ads: 'Google Ads',
  web_form: 'Website_form',
  facebook_ads: 'Facebook Ads',
  manual: 'Manuálne',
};

export const LeadSourceChart = memo(function LeadSourceChart() {
  const { data: leadsBySource, isLoading } = useLeadsBySource();

  // Transform data for chart
  const chartData = leadsBySource?.map((item, index) => ({
    name: sourceLabels[item.source] || item.source,
    value: item.count,
    color: COLORS[index % COLORS.length],
  })) || [];

  if (isLoading) {
    return (
      <Card className="vintage-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg text-muted-foreground">Zdroje leadov</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="vintage-card vintage-cracks">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg text-foreground">Zdroje leadov</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-[hsl(30,25%,45%)]">
            Žiadne dáta k dispozícii
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="vintage-card vintage-cracks">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg text-foreground">Zdroje leadov</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                stroke="hsl(40, 25%, 88%)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(40, 25%, 88%)',
                  border: '1.5px solid hsl(35, 30%, 70%)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px hsla(30, 20%, 40%, 0.15)',
                  color: 'hsl(30, 35%, 25%)',
                }}
                labelStyle={{ color: 'hsl(30, 35%, 25%)', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(30, 35%, 25%)' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-foreground font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
