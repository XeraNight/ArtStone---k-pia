import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useInventoryReservations } from '@/hooks/useInventory';
import { Package } from 'lucide-react';
import type { InventoryItem } from '@/types/database';

interface InventoryReservationsDialogProps {
    item: InventoryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InventoryReservationsDialog({ item, open, onOpenChange }: InventoryReservationsDialogProps) {
    const { data: reservations, isLoading } = useInventoryReservations(item?.id || '');

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('sk-SK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            active: { label: 'Aktívna', variant: 'default' },
            fulfilled: { label: 'Splnená', variant: 'secondary' },
            cancelled: { label: 'Zrušená', variant: 'destructive' },
        };

        const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Rezervácie: {item.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Celkovo rezervované</p>
                            <p className="text-2xl font-semibold">{item.qty_reserved} ks</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Dostupné</p>
                            <p className="text-2xl font-semibold">{item.qty_available - item.qty_reserved} ks</p>
                        </div>
                    </div>

                    {/* Reservations table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Klient</TableHead>
                                    <TableHead>Ponuka</TableHead>
                                    <TableHead className="text-center">Množstvo</TableHead>
                                    <TableHead>Stav</TableHead>
                                    <TableHead>Vytvorené</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : reservations?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Žiadne rezervácie
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reservations?.map((reservation: any) => (
                                        <TableRow key={reservation.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {reservation.client?.contact_name || '-'}
                                                    </p>
                                                    {reservation.client?.company_name && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {reservation.client.company_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {reservation.quote ? (
                                                    <code className="text-sm bg-muted px-2 py-0.5 rounded">
                                                        {reservation.quote.quote_number}
                                                    </code>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {reservation.quantity} ks
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(reservation.status)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(reservation.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
