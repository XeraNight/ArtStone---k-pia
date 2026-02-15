import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuote } from '@/hooks/useQuotes';
// import { formatDate } from '@/lib/utils';
import { generateQuotePDF } from '@/utils/pdfGenerator';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { QuoteStatus } from '@/types/database';

interface QuoteDetailDialogProps {
    quoteId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

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

export function QuoteDetailDialog({ quoteId, open, onOpenChange }: QuoteDetailDialogProps) {
    const { data: quote, isLoading } = useQuote(quoteId || '');

    console.log('QuoteDetailDialog render:', { quoteId, quote, isLoading });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {isLoading ? (
                            <Skeleton className="h-6 w-32" />
                        ) : quote ? (
                            <div className="flex w-full items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span>Cenová ponuka {quote?.quote_number}</span>
                                    {quote && (
                                        <Badge variant={statusVariants[quote.status]}>
                                            {statusLabels[quote.status]}
                                        </Badge>
                                    )}
                                </div>
                                <Button size="sm" variant="outline" onClick={() => generateQuotePDF(quote)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Stiahnuť PDF
                                </Button>
                            </div>
                        ) : (
                            <span>Detail ponuky</span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4 py-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-20 w-40 ml-auto" />
                    </div>
                ) : quote ? (
                    <div className="space-y-8 py-4">
                        {/* Summary Info */}
                        <div className="grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <h4 className="font-semibold text-muted-foreground mb-1">Klient</h4>
                                <div className="font-medium text-lg">{quote.client?.contact_name}</div>
                                {quote.client?.company_name && (
                                    <div className="text-muted-foreground">{quote.client.company_name}</div>
                                )}
                                <div className="text-muted-foreground mt-1">
                                    {quote.client?.email && <div>{quote.client.email}</div>}
                                    {quote.client?.phone && <div>{quote.client.phone}</div>}
                                    {quote.client?.address && <div>{quote.client.address}, {quote.client?.postal_code}</div>}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-muted-foreground">Vytvorené</div>
                                        <div>{new Date(quote.created_at).toLocaleDateString('sk-SK')}</div>
                                    </div>
                                    {quote.valid_until && (
                                        <div>
                                            <div className="text-muted-foreground">Platnosť do</div>
                                            <div>{new Date(quote.valid_until).toLocaleDateString('sk-SK')}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-muted-foreground">Vytvoril</div>
                                        <div>{quote.created_by_user?.full_name || 'Neznámy užívateľ'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Položka</TableHead>
                                        <TableHead className="text-right">Množstvo</TableHead>
                                        <TableHead className="text-right">Cena/ks</TableHead>
                                        <TableHead className="text-right">Spolu</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quote.items?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity} ks</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!quote.items || quote.items.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                Žiadne položky
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Totals */}
                        <div className="flex flex-col items-end gap-2 border-t pt-4">
                            <div className="flex justify-between w-full max-w-[300px] text-sm text-muted-foreground">
                                <span>Základ (bez DPH):</span>
                                <span>{formatCurrency(quote.subtotal)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[300px] text-sm text-muted-foreground">
                                <span>DPH ({quote.tax_rate}%):</span>
                                <span>{formatCurrency(quote.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between w-full max-w-[300px] text-lg font-bold text-primary mt-2 border-t border-dashed pt-2">
                                <span>Spolu:</span>
                                <span>{formatCurrency(quote.total)}</span>
                            </div>
                        </div>

                        {quote.notes && (
                            <div className="bg-muted/30 p-4 rounded-lg text-sm">
                                <h4 className="font-semibold mb-1">Poznámka</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Cenová ponuka sa nenašla
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
