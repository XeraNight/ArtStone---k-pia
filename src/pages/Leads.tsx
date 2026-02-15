import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { LeadDetailDialog } from '@/components/leads/LeadDetailDialog';
import { AssignLeadDialog } from '@/components/leads/AssignLeadDialog';
import { EditLeadDialog } from '@/components/leads/EditLeadDialog';
import { ConvertToClientDialog } from '@/components/leads/ConvertToClientDialog';
import { QuickActivityDialog } from '@/components/shared/QuickActivityDialog';
import { KanbanBoard } from '@/components/leads/KanbanBoard';
import { ViewToggle } from '@/components/leads/ViewToggle';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads, useUpdateLeadStatus, useDeleteLead } from '@/hooks/useLeads';
import { useRegions } from '@/hooks/useRegions';
import { useSalespeople, useAllUsers } from '@/hooks/useSalespeople';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  MoreHorizontal,
  Facebook,
  Globe,
  UserPlus,
  Pencil,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Lead, LeadStatus, LeadSource } from '@/types/database';

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nový',
  contacted: 'Kontaktovaný',
  offer: 'Ponuka',
  won: 'Vyhraný',
  lost: 'Stratený',
  waiting: 'Čaká sa',
};

const sourceLabels: Record<LeadSource, string> = {
  facebook_lead_ads: 'Facebook Lead Ads',
  facebook_ads: 'Facebook Ads',
  google_ads: 'Google Ads',
  website_form: 'Web formulár',
  manual: 'Manuálne',
};

const sourceIcons: Record<LeadSource, React.ReactNode> = {
  facebook_lead_ads: <Facebook className="h-4 w-4" />,
  facebook_ads: <Facebook className="h-4 w-4" />,
  google_ads: <Globe className="h-4 w-4" />,
  website_form: <Globe className="h-4 w-4" />,
  manual: <UserPlus className="h-4 w-4" />,
};

export default function Leads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [creatorFilter, setCreatorFilter] = useState<string>('all');

  // View toggle state
  const [view, setView] = useState<'table' | 'kanban'>(() => {
    const saved = localStorage.getItem('artstone-leads-view');
    return (saved === 'kanban' || saved === 'table') ? saved : 'table';
  });

  // Dialog states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState<'call' | 'email' | 'note'>('note');

  // Save view preference
  useEffect(() => {
    localStorage.setItem('artstone-leads-view', view);
  }, [view]);

  const { data: leads = [], isLoading, isError, error } = useLeads();
  const { data: regions = [] } = useRegions();
  const { data: salespeople = [] } = useSalespeople();
  const { data: allUsers = [] } = useAllUsers();
  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  if (isError) {
    return (
      <AppLayout title="Leady">
        <div className="p-6">
          <div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20">
            <h3 className="font-semibold text-lg mb-2">Chyba pri načítaní leadov</h3>
            <p>Nepodarilo sa načítať zoznam leadov z databázy.</p>
            <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
            <p className="mt-4 text-sm text-foreground">
              Skontrolujte "RLS Policies" v Supabase dashboarde.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source_type === sourceFilter;
    const matchesCreator = creatorFilter === 'all' || lead.created_by === creatorFilter;
    return matchesSearch && matchesStatus && matchesSource && matchesCreator;
  });

  const getRegionName = (regionId: string | null) => {
    if (!regionId) return 'Neurčený';
    const region = regions.find((r) => r.id === regionId);
    return region?.name || 'Neurčený';
  };

  const getAssignedUserName = (userId: string | null) => {
    if (!userId) return '—';
    const person = salespeople.find((p) => p.id === userId);
    return person?.full_name || '—';
  };

  const getCreatorName = (lead: Lead) => {
    if (lead.created_by_user) {
      return lead.created_by_user.full_name;
    }
    if (lead.created_by) {
      // Try allUsers first (includes all roles), then salespeople
      const person = allUsers.find((p) => p.id === lead.created_by) ||
        salespeople.find((p) => p.id === lead.created_by);
      return person?.full_name || '—';
    }
    return '—';
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateStatus.mutateAsync({ leadId, status: newStatus });
      toast.success('Status leadu bol aktualizovaný');
    } catch {
      toast.error('Nepodarilo sa aktualizovať status');
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Naozaj chcete vymazať tento lead?')) return;
    try {
      await deleteLead.mutateAsync(leadId);
      toast.success('Lead bol vymazaný');
    } catch {
      toast.error('Nepodarilo sa vymazať lead');
    }
  };

  const handleShowDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailOpen(true);
  };

  const handleAssign = (lead: Lead) => {
    setSelectedLead(lead);
    setAssignOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setEditOpen(true);
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setConvertOpen(true);
  };

  const handleQuickActivity = (lead: Lead, type: 'call' | 'email' | 'note', e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent row click
    setSelectedLead(lead);
    setActivityType(type);
    setActivityOpen(true);
  };

  const handleCreateQuote = (lead: Lead) => {
    toast.info(`Presmerovanie na vytvorenie ponuky pre ${lead.contact_name}`);
    navigate(`/quotes?leadId=${lead.id}&action=new`);
  };

  const statusCounts = {
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    offer: leads.filter((l) => l.status === 'offer').length,
    won: leads.filter((l) => l.status === 'won').length,
  };

  const handleExportLeads = (leadsToExport: Lead[]) => {
    // CSV Header
    const headers = [
      'Meno',
      'Firma',
      'Email',
      'Telefón',
      'Zdroj',
      'Status',
      'Región',
      'Priradené',
      'Vytvoril',
      'Vytvorené',
      'Poznámka'
    ];

    // CSV Rows
    const rows = leadsToExport.map(lead => [
      lead.contact_name,
      lead.company_name || '',
      lead.email || '',
      lead.phone || '',
      sourceLabels[lead.source_type as LeadSource],
      statusLabels[lead.status as LeadStatus],
      getRegionName(lead.region_id),
      getAssignedUserName(lead.assigned_user_id),
      getCreatorName(lead),
      new Date(lead.created_at).toLocaleDateString('sk-SK'),
      lead.notes || ''
    ]);

    // Combine and format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blobs and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout title="Leady">
      <div className="space-y-6 animate-fade-in">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            {/* ... (existing filters inputs) */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať podľa mena, emailu, firmy..."
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
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Zdroj" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky zdroje</SelectItem>
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={creatorFilter} onValueChange={setCreatorFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Vytvoril" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetci obchodníci</SelectItem>
                {allUsers.length > 0 ? allUsers.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.full_name}
                  </SelectItem>
                )) : salespeople.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <ViewToggle view={view} onViewChange={setView} />
            {(isAdmin || isManager) && (
              <>
                {/* Mobile: Icon-only button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleExportLeads(filteredLeads)}
                  className="md:hidden min-h-[44px] min-w-[44px]"
                  title="Export"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {/* Desktop: Full button */}
                <Button
                  variant="outline"
                  onClick={() => handleExportLeads(filteredLeads)}
                  className="hidden md:flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <CreateLeadDialog />
          </div>
        </div>



        {/* Leads view - Table or Kanban */}
        {view === 'kanban' ? (
          <KanbanBoard />
        ) : (
          <Card className="shadow-soft">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Zdroj</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Región</TableHead>
                      <TableHead>Priradené</TableHead>
                      <TableHead>Vytvoril</TableHead>
                      <TableHead>Dátum</TableHead>
                      <TableHead className="w-28">Akcie</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState
                            icon={<Inbox className="h-full w-full" />}
                            title="Zatiaľ žiadne leady"
                            description="Začnite pridávať leadov alebo nastavte integráciu pre automatický import."
                            action={{
                              label: "Vytvoriť prvý lead",
                              onClick: () => setCreateDialogOpen(true),
                              icon: <Plus className="h-4 w-4" />,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleShowDetail(lead)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-foreground">{lead.contact_name}</p>
                                  {lead.duplicate_of_lead_id && (
                                    <Badge variant="warning" className="text-xs">
                                      Duplicita
                                    </Badge>
                                  )}
                                </div>
                                {lead.company_name && (
                                  <p className="text-sm text-muted-foreground">{lead.company_name}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  {lead.email && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {lead.email}
                                    </span>
                                  )}
                                  {lead.phone && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {lead.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {sourceIcons[lead.source_type as LeadSource]}
                              </span>
                              <span className="text-sm">{sourceLabels[lead.source_type as LeadSource]}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={lead.status as LeadStatus}>
                              {statusLabels[lead.status as LeadStatus]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{getRegionName(lead.region_id)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {getAssignedUserName(lead.assigned_user_id)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {getCreatorName(lead)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(lead.created_at).toLocaleDateString('sk-SK')}
                            </span>
                          </TableCell>
                          {/* Quick Actions */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {lead.phone && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => handleQuickActivity(lead, 'call', e)}
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="Zavolať"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {lead.email && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => handleQuickActivity(lead, 'email', e)}
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title="Poslať email"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => handleQuickActivity(lead, 'note', e)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Pridať poznámku"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleShowDetail(lead)}>
                                    Zobraziť detail
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(lead)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Upraviť
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAssign(lead)}>
                                    Priradiť
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Zmeniť status</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                      <DropdownMenuRadioGroup
                                        value={lead.status}
                                        onValueChange={(value) => {
                                          handleStatusChange(lead.id, value as LeadStatus);
                                        }}
                                      >
                                        {Object.entries(statusLabels).map(([key, label]) => (
                                          <DropdownMenuRadioItem key={key} value={key}>
                                            {label}
                                          </DropdownMenuRadioItem>
                                        ))}
                                      </DropdownMenuRadioGroup>
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuItem onClick={() => handleCreateQuote(lead)}>
                                    Vytvoriť ponuku
                                  </DropdownMenuItem>
                                  {/* Convert to Client - only show for offer/won status */}
                                  {(lead.status === 'offer' || lead.status === 'won') && !lead.converted_to_client_id && (
                                    <DropdownMenuItem onClick={() => handleConvert(lead)}>
                                      Konvertovať na klienta
                                    </DropdownMenuItem>
                                  )}
                                  {(isAdmin || isManager) && (
                                    <DropdownMenuItem onClick={() => handleExportLeads([lead])}>
                                      Exportovať
                                    </DropdownMenuItem>
                                  )}
                                  {isAdmin && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleDelete(lead.id)}
                                      >
                                        Vymazať
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <LeadDetailDialog
          lead={selectedLead}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          statusLabels={statusLabels}
          sourceLabels={sourceLabels}
          getRegionName={getRegionName}
          onEdit={() => {
            setDetailOpen(false);
            setEditOpen(true);
          }}
        />
        <EditLeadDialog
          lead={selectedLead}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
        <AssignLeadDialog
          lead={selectedLead}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
        <ConvertToClientDialog
          lead={selectedLead}
          open={convertOpen}
          onOpenChange={setConvertOpen}
        />
        <QuickActivityDialog
          open={activityOpen}
          onOpenChange={setActivityOpen}
          entityType="lead"
          entityId={selectedLead?.id || ''}
          entityName={selectedLead?.contact_name}
          defaultType={activityType}
          defaultContact={{
            email: selectedLead?.email || undefined,
            phone: selectedLead?.phone || undefined,
          }}
        />
      </div>
    </AppLayout>
  );
}
