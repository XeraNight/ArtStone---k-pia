import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, Calendar, FileText, CheckCircle, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecentActivities } from '@/hooks/useActivities';
import { Skeleton } from '@/components/ui/skeleton';

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  quote: FileText,
  status_change: CheckCircle,
  note: StickyNote,
};

// Vintage-themed activity colors
const typeColors = {
  call: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  email: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  meeting: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  quote: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  status_change: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  note: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
};

export const ActivityTimeline = memo(function ActivityTimeline() {
  const { data: activities = [], isLoading } = useRecentActivities(5);

  return (
    <Card className="vintage-card vintage-cracks">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg text-foreground">Posledné aktivity</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Žiadne aktivity</p>
            <p className="text-muted-foreground text-xs mt-1">Aktivity sa zobrazia po vytvorení leadov alebo klientov</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline line - vintage style */}
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-[hsl(35,25%,75%)] dark:bg-[hsl(30,15%,30%)]" />

            {activities.map((activity: any, index: number) => {
              const Icon = typeIcons[activity.type as keyof typeof typeIcons] || StickyNote;
              const colorClass = typeColors[activity.type as keyof typeof typeColors] || typeColors.note;

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'relative flex gap-3 animate-fade-in',
                    { 'opacity-0': false }
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={cn(
                      'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-vintage',
                      colorClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-0.5 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm">{activity.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
