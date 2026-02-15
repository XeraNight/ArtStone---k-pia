import { useState, useEffect } from 'react';
import { CreateQuoteDialog } from '@/components/quotes/CreateQuoteDialog';
import { QuoteDetailDialog } from '@/components/quotes/QuoteDetailDialog';
import { DeleteQuoteDialog } from '@/components/quotes/DeleteQuoteDialog';
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
import { Plus, Search, Download, FileText, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotes, useUpdateQuoteStatus, useDeleteQuote } from '@/hooks/useQuotes';
import { useCreateInvoiceFromQuote } from '@/hooks/useInvoices';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { QuoteStatus } from '@/types/database';

const statusLabels: Record<QuoteStatus, string> = {
  draft: 'Návrh',
  sent: 'Odoslaná',
  accepted: 'Prijatá',
  rejected: 'Zamietnutá',
};

const statusVariants: Record<QuoteStatus, 'secondary' | 'info' | 'success' | 'destructive'> = {
  draft: 'secondary',
  sent: 'info',
  accepted: 'success',
  rejected: 'destructive',
};

export default function Quotes() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewQuoteId, setViewQuoteId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false);
  const [deleteQuote, setDeleteQuote] = useState<{ id: string; number: string } | null>(null);

  const { data: quotes, isLoading, isError, error } = useQuotes({
    status: statusFilter !== 'all' ? (statusFilter as QuoteStatus) : undefined,
    search: searchQuery || undefined,
  });
  const updateStatus = useUpdateQuoteStatus();
  const createInvoice = useCreateInvoiceFromQuote();
  const deleteQuoteMutation = useDeleteQuote();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  useEffect(() => {
    if (isError) {
      console.error('Error loading quotes:', error);
      toast.error('Nepodarilo sa načítať cenové ponuky');
    }
  }, [isError, error]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  // ...



  const totalValue = quotes?.reduce((acc, q) => acc + q.total, 0) || 0;
  const acceptedValue = quotes?.filter((q) => q.status === 'accepted').reduce((acc, q) => acc + q.total, 0) || 0;
  const successRate = quotes?.length ? Math.round((quotes.filter((q) => q.status === 'accepted').length / quotes.length) * 100) : 0;

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      await updateStatus.mutateAsync({ quoteId, status: newStatus });
      toast.success('Status ponuky aktualizovaný');
    } catch (error) {
      toast.error('Nepodarilo sa aktualizovať status');
    }
  };

  const handleCreateInvoice = async (quoteId: string) => {
    try {
      await createInvoice.mutateAsync(quoteId);
      toast.success('Faktúra vytvorená');
    } catch (error) {
      toast.error('Nepodarilo sa vytvoriť faktúru');
    }
  };

  const handleDownloadPdf = async (quote: any) => {
    try {
      // Fetch full quote with items directly, bypass hooks
      const { data: fullQuote, error } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(id, contact_name, company_name, email, phone, address),
          items:quote_items(*)
        `)
        .eq('id', quote.id)
        .single();

      if (error) throw error;

      if (fullQuote) {
        generateQuotePDF(fullQuote as unknown as import('@/types/database').Quote);
        toast.success('PDF vygenerované');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Nepodarilo sa vygenerovať PDF');
    }
  };

  const handleDeleteQuote = async () => {
    if (!deleteQuote) return;

    try {
      await deleteQuoteMutation.mutateAsync(deleteQuote.id);
      toast.success('Cenová ponuka vymazaná');
      setDeleteQuote(null);
    } catch (error: any) {
      console.error('Delete quote error:', error);
      const errorMessage = error?.message || 'Nepodarilo sa vymazať ponuku';
      toast.error(errorMessage);
    }
  };

  return (
    <AppLayout title="Cenové ponuky">
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
          <>
            {/* Mobile: Icon-only button */}
            <Button
              onClick={() => setCreateQuoteOpen(true)}
              className="md:hidden min-h-[44px] min-w-[44px]"
              size="icon"
              title="Nová ponuka"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {/* Desktop: Full button */}
            <Button
              onClick={() => setCreateQuoteOpen(true)}
              className="hidden md:flex"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nová ponuka
            </Button>
          </>
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Celkom ponúk</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold">{quotes?.length || 0}</p>
                  )}
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/50" />
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
                <p className="text-sm text-muted-foreground">Prijaté ponuky</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-success">{formatCurrency(acceptedValue)}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Úspešnosť</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold">{successRate}%</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes table */}
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Suma</TableHead>
                  <TableHead>Platnosť do</TableHead>
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
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-destructive">
                      Nepodarilo sa načítať dáta. Skúste obnoviť stránku.
                    </TableCell>
                  </TableRow>
                ) : quotes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        icon={<FileText className="h-full w-full" />}
                        title="Zatiaľ žiadne cenové ponuky"
                        description="Vytvorte cenovú ponuku pre klienta a začnite predávať."
                        action={{
                          label: "Vytvoriť ponuku",
                          onClick: () => setCreateQuoteDialogOpen(true),
                          icon: <Plus className="h-4 w-4" />,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes?.map((quote) => (
                    <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <span className="font-medium text-foreground">{quote.quote_number}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{quote.client?.contact_name || '-'}</p>
                          {quote.client?.company_name && (
                            <p className="text-sm text-muted-foreground">{quote.client.company_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[quote.status]}>
                          {statusLabels[quote.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(quote.total)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('sk-SK') : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {quote.created_by_user?.full_name || '-'}
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
                            <DropdownMenuItem onSelect={(e) => {
                              e.preventDefault();
                              setViewQuoteId(quote.id);
                              setViewOpen(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Zobraziť
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(quote)}>
                              <Download className="h-4 w-4 mr-2" />
                              Stiahnuť PDF
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'sent')}>
                                Odoslať klientovi
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'sent' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'accepted')}>
                                  Označiť ako prijatú
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(quote.id, 'rejected')}>
                                  Označiť ako zamietnutú
                                </DropdownMenuItem>
                              </>
                            )}
                            {quote.status === 'accepted' && (isAdmin || isManager) && (
                              <DropdownMenuItem onClick={() => handleCreateInvoice(quote.id)}>
                                Vytvoriť faktúru
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>Duplikovať</DropdownMenuItem>
                            {(isAdmin || isManager) && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteQuote({ id: quote.id, number: quote.quote_number })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Vymazať
                              </DropdownMenuItem>
                            )}
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
      </div>

      <CreateQuoteDialog
        open={createQuoteOpen}
        onOpenChange={setCreateQuoteOpen}
      />

      <QuoteDetailDialog
        quoteId={viewQuoteId}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <DeleteQuoteDialog
        open={!!deleteQuote}
        onOpenChange={(open) => !open && setDeleteQuote(null)}
        quoteNumber={deleteQuote?.number || ''}
        onConfirm={handleDeleteQuote}
        isDeleting={deleteQuoteMutation.isPending}
      />
    </AppLayout>
  );
}
