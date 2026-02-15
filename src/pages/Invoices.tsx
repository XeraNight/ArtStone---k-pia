import { useState } from 'react';
import { DeleteInvoiceDialog } from '@/components/invoices/DeleteInvoiceDialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Search, Download, Receipt, MoreHorizontal, Eye, Send, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInvoices, useUpdateInvoiceStatus, useInvoice, useDeleteInvoice } from '@/hooks/useInvoices';
import { CreateInvoiceDialog } from '@/components/invoices/CreateInvoiceDialog';
import { EditInvoiceDialog } from '@/components/invoices/EditInvoiceDialog';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import type { InvoiceStatus, Invoice } from '@/types/database';

const statusLabels: Record<InvoiceStatus, string> = {
  draft: 'Návrh',
  sent: 'Odoslaná',
  paid: 'Zaplatená',
  overdue: 'Po splatnosti',
  cancelled: 'Zrušená',
};

const statusVariants: Record<InvoiceStatus, 'secondary' | 'info' | 'success' | 'destructive' | 'warning'> = {
  draft: 'secondary',
  sent: 'info',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'warning',
};

export default function Invoices() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // State for Edit Dialog
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<{ id: string; number: string } | null>(null);


  // Only admin and manager can access invoices
  if (user?.role === 'sales') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: invoices, isLoading, isError, error } = useInvoices({
    status: statusFilter !== 'all' ? (statusFilter as InvoiceStatus) : undefined,
    search: searchQuery || undefined,
  });

  // Fetch full details when an invoice is selected for editing
  const { data: fullInvoice } = useInvoice(selectedInvoiceId || '');

  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoiceMutation = useDeleteInvoice();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const totalValue = invoices?.reduce((acc, i) => acc + i.total, 0) || 0;
  const paidValue = invoices?.filter((i) => i.status === 'paid').reduce((acc, i) => acc + i.total, 0) || 0;
  const overdueValue = invoices?.filter((i) => i.status === 'overdue').reduce((acc, i) => acc + i.total, 0) || 0;

  const handleStatusChange = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      await updateStatus.mutateAsync({ invoiceId, status: newStatus });
      toast.success('Status faktúry aktualizovaný');
    } catch (error) {
      toast.error('Nepodarilo sa aktualizovať status');
    }
  };

  const handleViewDetails = (id: string) => {
    setSelectedInvoiceId(id);
    setIsEditDialogOpen(true);
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, contact_name, company_name, email, phone, address),
          items:invoice_items(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      if (fullInvoice) {
        generateInvoicePDF(fullInvoice as unknown as Invoice);
        toast.success('PDF faktúry vygenerované');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Nepodarilo sa vygenerovať PDF');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoice) return;

    try {
      await deleteInvoiceMutation.mutateAsync(deleteInvoice.id);
      toast.success('Faktúra vymazaná');
      setDeleteInvoice(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Nepodarilo sa vymazať faktúru');
    }
  };


  return (
    <AppLayout title="Faktúry">
      <div className="space-y-6 animate-fade-in">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať podľa čísla, klienta..."
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
          <CreateInvoiceDialog />
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Celkom faktúr</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold">{invoices?.length || 0}</p>
                  )}
                </div>
                <Receipt className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Celková hodnota</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Zaplatené</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-success">{formatCurrency(paidValue)}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Po splatnosti</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-destructive">{formatCurrency(overdueValue)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices table */}
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Suma</TableHead>
                  <TableHead>Splatnosť</TableHead>
                  <TableHead>Vytvoril</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : invoices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={<Receipt className="h-full w-full" />}
                        title="Zatiaľ žiadne faktúry"
                        description="Vytvorte faktúru z akceptovanej ponuky alebo od začiatku."
                        action={{
                          label: "Vytvoriť faktúru",
                          onClick: () => setCreateDialogOpen(true),
                          icon: <Plus className="h-4 w-4" />,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices?.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={() => handleViewDetails(invoice.id)}>
                        <span className="font-medium text-foreground">{invoice.invoice_number}</span>
                      </TableCell>
                      <TableCell onClick={() => handleViewDetails(invoice.id)}>
                        <div>
                          <p className="font-medium text-foreground">{invoice.client?.contact_name || '-'}</p>
                          {invoice.client?.company_name && (
                            <p className="text-sm text-muted-foreground">{invoice.client.company_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleViewDetails(invoice.id)}>
                        <Badge variant={statusVariants[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium" onClick={() => handleViewDetails(invoice.id)}>
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell onClick={() => handleViewDetails(invoice.id)}>
                        <span
                          className={`text-sm ${invoice.status === 'overdue'
                            ? 'text-destructive font-medium'
                            : 'text-muted-foreground'
                            }`}
                        >
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('sk-SK') : '-'}
                        </span>
                      </TableCell>
                      <TableCell onClick={() => handleViewDetails(invoice.id)}>
                        <span className="text-sm text-muted-foreground">
                          {invoice.created_by_user?.full_name || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(invoice.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Zobraziť / Upraviť
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}>
                              <Download className="h-4 w-4 mr-2" />
                              Stiahnuť PDF
                            </DropdownMenuItem>
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'sent')}>
                                <Send className="h-4 w-4 mr-2" />
                                Odoslať klientovi
                              </DropdownMenuItem>
                            )}
                            {invoice.status === 'sent' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid')}>
                                Označiť ako zaplatenú
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteInvoice({ id: invoice.id, number: invoice.invoice_number })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Vymazať
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit/Detail Dialog */}
        <EditInvoiceDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          invoice={fullInvoice || null}
        />

        <DeleteInvoiceDialog
          open={!!deleteInvoice}
          onOpenChange={(open) => !open && setDeleteInvoice(null)}
          invoiceNumber={deleteInvoice?.number || ''}
          onConfirm={handleDeleteInvoice}
          isDeleting={deleteInvoiceMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
