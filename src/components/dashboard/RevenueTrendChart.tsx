import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useRevenueStats } from '@/hooks/useRevenueStats';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

export const RevenueTrendChart = memo(function RevenueTrendChart() {
    const { data: revenueData, isLoading } = useRevenueStats(6);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <Card className="vintage-card vintage-cracks">
                <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg text-foreground">Trend príjmov</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[280px] bg-[hsl(35,20%,80%)]" />
                </CardContent>
            </Card>
        );
    }

    if (!revenueData || revenueData.length === 0) {
        return (
            <Card className="vintage-card vintage-cracks">
                <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg text-foreground">Trend príjmov</CardTitle>
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
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg text-foreground">Trend príjmov</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span>Posledných 6 mesiacov</span>
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="h-[250px] md:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 25%, 75%)" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                                axisLine={{ stroke: 'hsl(35, 25%, 70%)' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                                axisLine={{ stroke: 'hsl(35, 25%, 70%)' }}
                                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1.5px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px hsla(30, 20%, 40%, 0.15)',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value: number) => [formatCurrency(value), 'Príjem']}
                            />
                            <Area
                                type="monotone"
                                dataKey="totalRevenue"
                                stroke="hsl(142, 76%, 36%)"
                                strokeWidth={3}
                                fill="url(#revenueGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
});
