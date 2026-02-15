import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConvertLead } from '@/hooks/useLeads';
import { toast } from 'sonner';
import type { Lead } from '@/types/database';
import { Mail, Phone, Building, MapPin, User, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ConvertToClientDialogProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ConvertToClientDialog({
    lead,
    open,
    onOpenChange,
}: ConvertToClientDialogProps) {
    const navigate = useNavigate();
    const convertLead = useConvertLead();
    const [isConverting, setIsConverting] = useState(false);

    if (!lead) return null;

    const handleConvert = async () => {
        try {
            setIsConverting(true);
            const result = await convertLead.mutateAsync(lead.id);

            toast.success('Lead úspešne konvertovaný na klienta!', {
                description: `${result.activitiesCopied} aktivít bolo prenesených`,
                action: {
                    label: 'Zobraziť klienta',
                    onClick: () => navigate(`/clients`),
                },
            });

            onOpenChange(false);
        } catch (error: any) {
            toast.error('Chyba pri konverzii', {
                description: error.message || 'Nepodarilo sa konvertovať lead na klienta',
            });
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-primary" />
                        Konvertovať lead na klienta
                    </DialogTitle>
                    <DialogDescription>
                        Tento lead bude konvertovaný na klienta. Všetky údaje a aktivity budú prenesené.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Lead Info Preview */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Informácie leadu
                            </h4>
                            <Badge variant="info">Lead</Badge>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{lead.contact_name}</h3>
                            </div>

                            {lead.company_name && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building className="h-4 w-4" />
                                    <span>{lead.company_name}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {lead.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="truncate">{lead.email}</span>
                                    </div>
                                )}
                                {lead.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span >{lead.phone}</span>
                                    </div>
                                )}
                                {lead.address && (
                                    <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                                        <MapPin className="h-4 w-4" />
                                        <span className="truncate">{lead.address}</span>
                                    </div>
                                )}
                            </div>

                            {lead.notes && (
                                <div className="pt-2 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">Poznámky:</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">{lead.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex justify-center">
                        <div className="rounded-full bg-primary/10 p-3">
                            <ArrowRight className="h-6 w-6 text-primary" />
                        </div>
                    </div>

                    {/* New Client Info */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Nový klient
                            </h4>
                            <Badge variant="success">Klient</Badge>
                        </div>

                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <p className="text-sm font-medium">Klient bude vytvorený s nasledujúcimi údajmi:</p>
                            </div>

                            <ul className="text-sm space-y-2 ml-7 text-muted-foreground">
                                <li>• Kontaktné meno: <span className="text-foreground font-medium">{lead.contact_name}</span></li>
                                {lead.company_name && (
                                    <li>• Firma: <span className="text-foreground font-medium">{lead.company_name}</span></li>
                                )}
                                {lead.email && (
                                    <li>• Email: <span className="text-foreground font-medium">{lead.email}</span></li>
                                )}
                                {lead.phone && (
                                    <li>• Telefón: <span className="text-foreground font-medium">{lead.phone}</span></li>
                                )}
                                <li>• Status: <span className="text-success font-medium">Aktívny</span></li>
                                <li>• Všetky aktivity budú prenesené</li>
                            </ul>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
                        <div className="flex gap-3">
                            <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h5 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                                    Dôležité
                                </h5>
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    Lead bude automaticky označený ako "Vyhraný" a už nebude možné túto akciu vrátiť späť.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isConverting}
                    >
                        Zrušiť
                    </Button>
                    <Button
                        onClick={handleConvert}
                        disabled={isConverting}
                        className="min-w-[140px]"
                    >
                        {isConverting ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Konvertujem...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Konvertovať
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
