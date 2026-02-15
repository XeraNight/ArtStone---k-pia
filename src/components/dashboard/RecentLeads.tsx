import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRecentLeads } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

const statusLabels: Record<string, string> = {
  new: 'Nový',
  contacted: 'Kontaktovaný',
  offer: 'Ponuka',
  won: 'Vyhraný',
  lost: 'Stratený',
  waiting: 'Čaká sa',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-purple-100 text-purple-700 border-purple-200',
  offer: 'bg-amber-100 text-amber-700 border-amber-200',
  won: 'bg-green-100 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-600 border-gray-200',
  waiting: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const RecentLeads = memo(function RecentLeads() {
  const { data: leads, isLoading } = useRecentLeads(4);

  return (
    <Card className="vintage-card vintage-cracks">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-display text-lg text-foreground">Najnovšie leady</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Link to="/leads" className="gap-1 font-medium">
            Zobraziť všetky
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="relative z-10">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-[hsl(35,25%,78%)] last:border-0">
                <Skeleton className="h-10 w-10 rounded-full bg-[hsl(35,20%,80%)]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 bg-[hsl(35,20%,80%)]" />
                  <Skeleton className="h-3 w-24 bg-[hsl(35,20%,80%)]" />
                </div>
              </div>
            ))}
          </div>
        ) : !leads || leads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Žiadne leady
          </div>
        ) : (
          <div className="space-y-0">
            {leads.map((lead, index) => (
              <div
                key={lead.id}
                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(38,25%,84%)] transition-colors cursor-pointer group border-b border-[hsl(35,25%,78%)] ${index === leads.length - 1 ? 'border-0' : ''}`}
              >
                <Avatar className="h-10 w-10 border-2 border-[hsl(35,30%,75%)] shadow-vintage">
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(35,40%,55%)] to-[hsl(35,35%,45%)] text-white font-bold text-sm">
                    {lead.contact_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-[hsl(30,35%,25%)] truncate">{lead.contact_name || 'Bez mena'}</p>
                    <Badge
                      variant="secondary"
                      className={`text-xs font-medium px-2 py-0.5 border ${statusColors[lead.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {statusLabels[lead.status] || lead.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[hsl(30,22%,48%)] truncate">
                    {lead.company_name || lead.source_type}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {lead.phone && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      asChild
                      className="text-[hsl(30,25%,45%)] hover:text-[hsl(30,35%,25%)] hover:bg-[hsl(38,28%,80%)] h-7 w-7"
                    >
                      <a href={`tel:${lead.phone}`}>
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  {lead.email && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      asChild
                      className="text-[hsl(30,25%,45%)] hover:text-[hsl(30,35%,25%)] hover:bg-[hsl(38,28%,80%)] h-7 w-7"
                    >
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
