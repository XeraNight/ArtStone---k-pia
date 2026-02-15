import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Users, FileText, TrendingUp } from 'lucide-react';

interface SalespersonProfileDialogProps {
    salesperson: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SalespersonProfileDialog({ salesperson, open, onOpenChange }: SalespersonProfileDialogProps) {
    if (!salesperson) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Profil obchodníka</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header with avatar */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-20 w-20 bg-primary/10">
                                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                                    {salesperson.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <span
                                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${salesperson.is_active ? 'bg-success' : 'bg-muted-foreground'
                                    }`}
                            />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-foreground">{salesperson.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{salesperson.region?.name || 'Neurčený región'}</p>
                            <Badge variant={salesperson.is_active ? 'success' : 'secondary'} className="mt-2">
                                {salesperson.is_active ? 'Aktívny' : 'Neaktívny'}
                            </Badge>
                        </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-3 border-y border-border py-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{salesperson.email}</span>
                        </div>
                        {salesperson.phone && (
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{salesperson.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{salesperson.region?.name || 'Neurčený región'}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                            <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-semibold text-foreground">{salesperson.stats?.leads || 0}</p>
                            <p className="text-xs text-muted-foreground">Leady</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                            <Users className="h-5 w-5 text-success mx-auto mb-2" />
                            <p className="text-2xl font-semibold text-foreground">{salesperson.stats?.clients || 0}</p>
                            <p className="text-xs text-muted-foreground">Klienti</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                            <FileText className="h-5 w-5 text-info mx-auto mb-2" />
                            <p className="text-2xl font-semibold text-foreground">{salesperson.stats?.quotes || 0}</p>
                            <p className="text-xs text-muted-foreground">Ponuky</p>
                        </div>
                    </div>

                    {/* Conversion rate */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-foreground">Konverzná miera</span>
                        </div>
                        <span className="text-xl font-semibold text-primary">
                            {(salesperson.stats as any)?.conversionRate || 0}%
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
