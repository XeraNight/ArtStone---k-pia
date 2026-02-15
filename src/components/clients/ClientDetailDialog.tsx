import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivities } from '@/hooks/useActivities';
import type { Client, ClientStatus } from '@/types/database';
import { Mail, Phone, MapPin, Building, Calendar, User, Tag, Euro, History, FileText, StickyNote, CheckCircle2 } from 'lucide-react';

interface ClientDetailDialogProps {
    client: Client | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    statusLabels: Record<ClientStatus, string>;
    statusVariants: Record<ClientStatus, 'success' | 'secondary' | 'info' | 'completed'>;
    getRegionName: (id: string | null) => string;
    formatCurrency: (value: number | null) => string;
    onEdit?: () => void;
}

const activityTypeIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
    note: <StickyNote className="h-4 w-4" />,
    status_change: <CheckCircle2 className="h-4 w-4" />,
};

export function ClientDetailDialog({
    client,
    open,
    onOpenChange,
    statusLabels,
    statusVariants,
    getRegionName,
    formatCurrency,
    onEdit
}: ClientDetailDialogProps) {
    const { data: activities = [], isLoading: activitiesLoading } = useActivities({
        entityType: 'client',
        entityId: client?.id,
        limit: 5,
    });

    if (!client) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="text-xl">{client.contact_name}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant={statusVariants[client.status]}>
                                {statusLabels[client.status]}
                            </Badge>
                            {onEdit && (
                                <Button variant="outline" size="sm" onClick={onEdit}>
                                    Upraviť
                                </Button>
                            )}
                        </div>
                    </div>
                    {client.company_name && (
                        <p className="text-muted-foreground mt-1">{client.company_name}</p>
                    )}
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Contact Information */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Kontaktné údaje</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {client.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
                                </div>
                            )}
                            {(client.address || client.postal_code) && (
                                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span>
                                        {[client.address, client.postal_code].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Business Info */}
                    <section className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Informácie</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> Región
                                </span>
                                <p className="text-sm font-medium">{getRegionName(client.region_id)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" /> Priradené
                                </span>
                                <p className="text-sm font-medium">
                                    {(client as any).assigned_user?.full_name || 'Nepriradené'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Euro className="h-3 w-3" /> Celková hodnota
                                </span>
                                <p className="text-sm font-medium">{formatCurrency(client.total_value)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Vytvorené
                                </span>
                                <p className="text-sm font-medium">
                                    {new Date(client.created_at).toLocaleDateString('sk-SK')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    {client.notes && (
                        <section className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Poznámka</h4>
                            <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                                {client.notes}
                            </div>
                        </section>
                    )}

                    {/* Recent Activities */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Posledné aktivity</h4>
                        </div>
                        {activitiesLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                                Žiadne aktivity
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activities.map((activity: any) => (
                                    <div
                                        key={activity.id}
                                        className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="text-primary mt-0.5">
                                            {activityTypeIcons[activity.activity_type] || <FileText className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium text-foreground">
                                                    {activity.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(activity.created_at).toLocaleDateString('sk-SK')}
                                                </span>
                                            </div>
                                            {activity.description && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {activity.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
