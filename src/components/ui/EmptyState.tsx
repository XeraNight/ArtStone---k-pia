import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: ReactNode;
    };
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    size = 'lg',
    className,
}: EmptyStateProps) {
    const iconContainerSize = size === 'sm' ? 'p-3' : size === 'md' ? 'p-4' : 'p-5';
    const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-12 w-12' : 'h-16 w-16';
    const padding = size === 'sm' ? 'py-8' : size === 'md' ? 'py-12' : 'py-16';
    const titleSize = size === 'sm' ? 'text-base' : size === 'md' ? 'text-lg' : 'text-xl';

    return (
        <div className={cn(
            'flex flex-col items-center text-center animate-fade-in',
            padding,
            className
        )}>
            {/* Icon Container */}
            <div className={cn(
                'rounded-2xl border-2 border-[hsl(35,30%,70%)] bg-[hsl(35,20%,85%)] mb-4 flex items-center justify-center',
                iconContainerSize
            )}>
                <div className={cn(iconSize, 'text-[hsl(30,35%,45%)]')}>
                    {icon}
                </div>
            </div>

            {/* Title */}
            <h3 className={cn(
                'font-display font-semibold text-foreground mb-2',
                titleSize
            )}>
                {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                {description}
            </p>

            {/* Action Button */}
            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    {action.icon}
                    {action.label}
                </Button>
            )}
        </div>
    );
}
