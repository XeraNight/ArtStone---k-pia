import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateClientDialog } from '@/components/clients/CreateClientDialog';
import { EditClientDialog } from '@/components/clients/EditClientDialog';
import { ClientDetailDialog } from '@/components/clients/ClientDetailDialog';
import { QuickActivityDialog } from '@/components/shared/QuickActivityDialog';
import { CreateQuoteDialog } from '@/components/quotes/CreateQuoteDialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useClients, useDeleteClient } from '@/hooks/useClients';
import { useRegions } from '@/hooks/useRegions';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Phone,
  Mail,
  MapPin,
  Building2,
  MoreHorizontal,
  StickyNote,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Client, ClientStatus } from '@/types/database';

const statusLabels: Record<ClientStatus, string> = {
  active: 'Aktívny',
  inactive: 'Neaktívny',
  prospect: 'Potenciálny',
  completed: 'Vybavený',
};

const statusVariants: Record<ClientStatus, 'success' | 'secondary' | 'info' | 'completed'> = {
  active: 'success',
  inactive: 'secondary',
  prospect: 'info',
  completed: 'completed',
};

export default function Clients() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false);
  const [quoteClientId, setQuoteClientId] = useState<string>('');
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState<'call' | 'email' | 'note'>('note');

  // Added isError handling
  const { data: clients = [], isLoading, isError } = useClients();
  const { data: regions = [] } = useRegions();
  const deleteClient = useDeleteClient();

  const isAdmin = user?.role === 'admin';

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRegionName = (regionId: string | null) => {
    if (!regionId) return 'Neurčený';
    const region = regions.find((r) => r.id === regionId);
    return region?.name || 'Neurčený';
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Naozaj chcete vymazať tohto klienta?')) return;
    try {
      await deleteClient.mutateAsync(clientId);
      toast.success('Klient bol vymazaný');
    } catch {
      toast.error('Nepodarilo sa vymazať klienta');
    }
  };

  const handleShowDetail = (client: Client) => {
    setSelectedClient(client);
    setDetailOpen(true);
  };

  const handleQuickActivity = (client: Client, type: 'call' | 'email' | 'note', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click if any
    setSelectedClient(client);
    setActivityType(type);
    setActivityOpen(true);
  };

  // Error state UI
  if (isError) {
    return (
      <AppLayout title="Klienti">
        <div className="p-8 text-center text-destructive">
          <p>Nepodarilo sa načítať zoznam klientov.</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Skúsiť znova
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Klienti">
      <div className="space-y-6 animate-fade-in">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať klientov..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky statusy</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <div className="flex border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <CreateClientDialog />
          </div>
        </div>

        {/* Clients grid/list */}
        {isLoading ? (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[220px]" />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}
          >
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="shadow-soft hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 bg-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {/* FIXED: Safe access to contact_name */}
                          {(client.contact_name || '?').split(' ').map((n) => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">{client.contact_name}</h3>
                        {client.company_name && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {client.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Quick Action Buttons - Show on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {client.phone && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleQuickActivity(client, 'call', e)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Zavolať"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {client.email && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleQuickActivity(client, 'email', e)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Poslať email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => handleQuickActivity(client, 'note', e)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Pridať poznámku"
                        >
                          <StickyNote className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShowDetail(client)}>
                            Zobraziť detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setQuoteClientId(client.id);
                            setCreateQuoteOpen(true);
                          }}>
                            Vytvoriť ponuku
                          </DropdownMenuItem>
                          {(isAdmin || user?.role === 'manager') && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setEditingClient(client);
                                setEditOpen(true);
                              }}>
                                Upraviť
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(client.id)}
                              >
                                Vymazať
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {client.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Badge variant={statusVariants[client.status as ClientStatus]}>
                      {statusLabels[client.status as ClientStatus]}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Celková hodnota</p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(client.total_value)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>{getRegionName(client.region_id)}</span>
                    <span>{(client as any).assigned_user?.full_name || '—'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredClients.length === 0 && (
          <EmptyState
            icon={<Users className="h-full w-full" />}
            title="Ešte nemáte žiadnych klientov"
            description="Pridajte svojho prvého klienta alebo konvertujte lead na klienta."
            action={{
              label: "Pridať klienta",
              onClick: () => setCreateDialogOpen(true),
              icon: <Plus className="h-4 w-4" />,
            }}
          />
        )}

        <ClientDetailDialog
          client={selectedClient}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          statusLabels={statusLabels}
          statusVariants={statusVariants}
          getRegionName={getRegionName}
          formatCurrency={formatCurrency}
          onEdit={() => {
            setDetailOpen(false);
            setEditingClient(selectedClient);
            setEditOpen(true);
          }}
        />

        <EditClientDialog
          client={editingClient}
          open={editOpen}
          onOpenChange={setEditOpen}
        />

        <CreateQuoteDialog
          open={createQuoteOpen}
          onOpenChange={setCreateQuoteOpen}
          defaultClientId={quoteClientId}
        />

        <QuickActivityDialog
          open={activityOpen}
          onOpenChange={setActivityOpen}
          entityType="client"
          entityId={selectedClient?.id || ''}
          entityName={selectedClient?.contact_name}
          defaultType={activityType}
          defaultContact={{
            email: selectedClient?.email || undefined,
            phone: selectedClient?.phone || undefined,
          }}
        />
      </div>
    </AppLayout>
  );
}
