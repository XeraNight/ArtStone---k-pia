import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSalesFunnel } from '@/hooks/useSalesFunnel';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter } from 'lucide-react';

export const SalesFunnelChart = memo(function SalesFunnelChart() {
    const { data: funnelData, isLoading } = useSalesFunnel(30);

    if (isLoading) {
        return (
            <Card className="vintage-card vintage-cracks">
                <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg text-foreground">Sales Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[280px] bg-[hsl(35,20%,80%)]" />
                </CardContent>
            </Card>
        );
    }

    if (!funnelData || funnelData.totalLeads === 0) {
        return (
            <Card className="vintage-card vintage-cracks">
                <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg text-foreground">Sales Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] flex items-center justify-center text-[hsl(30,25%,45%)]">
                        Žiadne dáta k dispozícii
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { stages, conversionRate } = funnelData;

    return (
        <Card className="vintage-card vintage-cracks">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg text-foreground">Sales Funnel</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4 text-primary" />
                    <span>Posledných 30 dní</span>
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="space-y-3">
                    {stages.map((stage, index) => {
                        const maxWidth = 100;
                        const width = stage.percentage;
                        const color = index === 0 ? 'hsl(217, 91%, 60%)' :
                            index === 1 ? 'hsl(34, 89%, 55%)' :
                                index === 2 ? 'hsl(25, 95%, 53%)' :
                                    'hsl(142, 76%, 36%)';

                        return (
                            <div key={stage.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-foreground text-xs md:text-sm">{stage.name}</span>
                                    <span className="text-muted-foreground text-xs md:text-sm">
                                        {stage.count} ({stage.percentage}%)
                                    </span>
                                </div>
                                <div className="relative h-9 md:h-10 bg-muted/30 rounded-lg overflow-hidden border border-border/50">
                                    <div
                                        className="absolute inset-y-0 left-0 flex items-center justify-center transition-all duration-500 rounded-lg"
                                        style={{
                                            width: `${width}%`,
                                            background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                                        }}
                                    >
                                        {width > 15 && (
                                            <span className="text-white font-semibold text-xs md:text-sm px-2 md:px-3">
                                                {stage.percentage}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Celková konverzia</span>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-muted/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-success rounded-full transition-all duration-500"
                                    style={{ width: `${conversionRate}%` }}
                                />
                            </div>
                            <span className="text-lg font-bold text-success">{conversionRate}%</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
