import { ReactNode, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
}

export const StatCard = memo(function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}: StatCardProps) {
  const getChangeText = () => {
    if (change === undefined) return null;
    if (change > 0) return `+${change}%`;
    if (change < 0) return `${change}%`;
    return `${change}%`;
  };

  const getChangeColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <Card className={cn('vintage-card vintage-cracks overflow-hidden border-[1.5px] border-[hsl(35,30%,65%)] animate-fade-in', className)}>
      <CardContent className="p-5 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <p className="text-sm font-medium text-[hsl(30,25%,45%)] dark:text-[hsl(35,15%,75%)] tracking-wide">{title}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl number-emphasis text-[hsl(30,35%,25%)] dark:text-[hsl(35,15%,95%)] font-display leading-none">
                {value}
              </p>
              {change !== undefined && (
                <span className={cn(
                  'text-sm font-medium transition-colors',
                  getChangeColor()
                )}>
                  {getChangeText()}
                </span>
              )}
            </div>
            {changeLabel && (
              <p className="text-xs text-[hsl(30,20%,50%)] dark:text-[hsl(35,12%,70%)] mt-1">{changeLabel}</p>
            )}
          </div>
          {icon && (
            <div className="p-3 stone-icon-bg">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
