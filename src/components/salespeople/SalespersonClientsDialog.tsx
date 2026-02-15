import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { Building2, Mail, Phone, Users } from 'lucide-react';
import type { ClientStatus } from '@/types/database';

interface SalespersonClientsDialogProps {
    salespersonId: string | null;
    salespersonName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<ClientStatus, string> = {
    active: 'Aktívny',
    inactive: 'Neaktívny',
    prospect: 'Potenciálny',
    completed: 'Ukončená spolupráca',
};

const statusVariants: Record<ClientStatus, 'success' | 'secondary' | 'info' | 'completed'> = {
    active: 'success',
    inactive: 'secondary',
    prospect: 'info',
    completed: 'completed',
};

export function SalespersonClientsDialog({
    salespersonId,
    salespersonName,
    open,
    onOpenChange,
}: SalespersonClientsDialogProps) {
    const { data: allClients, isLoading } = useClients();

    const clients = allClients?.filter(c => c.assigned_user_id === salespersonId) || [];

    const formatCurrency = (value: number | null) => {
        return new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
        }).format(value || 0);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Klienti - {salespersonName}</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                ) : clients.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Žiadni priradení klienti</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Celkom {clients.length} {clients.length === 1 ? 'klient' : clients.length < 5 ? 'klienti' : 'klientov'}
                        </p>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Klient</TableHead>
                                    <TableHead>Kontakt</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Hodnota</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.map(client => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-foreground">{client.contact_name}</p>
                                                {client.company_name && (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" />
                                                        {client.company_name}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                {client.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate max-w-[150px]">{client.email}</span>
                                                    </div>
                                                )}
                                                {client.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{client.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariants[client.status as ClientStatus]}>
                                                {statusLabels[client.status as ClientStatus]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(client.total_value)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
