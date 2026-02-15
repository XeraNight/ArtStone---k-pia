import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
    return (
        <div className="p-4 md:p-6 space-y-6 animate-pulse">
            {/* Page title */}
            <Skeleton className="h-8 w-64 bg-[hsl(35,20%,80%)]" />

            {/* Stats grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[120px] bg-[hsl(35,20%,80%)]" />
                ))}
            </div>

            {/* Main content area */}
            <Skeleton className="h-[400px] bg-[hsl(35,20%,80%)]" />
        </div>
    );
}
