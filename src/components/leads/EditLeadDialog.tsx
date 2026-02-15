import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateLead } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { useRegions } from '@/hooks/useRegions';
import type { Lead, LeadSource, LeadStatus } from '@/types/database';

interface FormData {
    contact_name: string;
    company_name: string;
    email: string;
    phone: string;
    address: string;
    postal_code: string;
    region_id: string;
    status: LeadStatus;
    source_type: LeadSource;
    notes: string;
}

interface EditLeadDialogProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditLeadDialog({ lead, open, onOpenChange }: EditLeadDialogProps) {
    const updateLead = useUpdateLead();
    const { data: regions } = useRegions();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>();

    useEffect(() => {
        if (lead && open) {
            reset({
                contact_name: lead.contact_name,
                company_name: lead.company_name || '',
                email: lead.email || '',
                phone: lead.phone || '',
                address: lead.address || '',
                postal_code: lead.postal_code || '',
                region_id: lead.region_id || '',
                status: lead.status,
                source_type: lead.source_type,
                notes: lead.notes || '',
            });
        }
    }, [lead, open, reset]);

    const onSubmit = async (data: FormData) => {
        if (!lead) return;

        try {
            await updateLead.mutateAsync({
                id: lead.id,
                ...data,
                company_name: data.company_name || null,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                postal_code: data.postal_code || null,
                region_id: data.region_id || null,
                notes: data.notes || null,
            });
            toast.success('Lead bol úspešne aktualizovaný');
            onOpenChange(false);
        } catch (error) {
            toast.error('Nepodarilo sa aktualizovať lead');
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upraviť lead</DialogTitle>
                    <DialogDescription>
                        Upravte informácie o potenciálnom klientovi.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-contact_name">Meno kontaktu *</Label>
                            <Input
                                id="edit-contact_name"
                                {...register('contact_name', { required: true })}
                                className={errors.contact_name ? 'border-destructive' : ''}
                            />
                            {errors.contact_name && (
                                <span className="text-xs text-destructive">Toto pole je povinné</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-company_name">Názov firmy</Label>
                            <Input id="edit-company_name" {...register('company_name')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" type="email" {...register('email')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Telefón</Label>
                            <Input id="edit-phone" {...register('phone')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-source">Zdroj</Label>
                            <Select
                                onValueChange={(value) => setValue('source_type', value as LeadSource)}
                                defaultValue={lead?.source_type}
                                value={lead ? lead.source_type : undefined} // Controlled if needed, but using reset with defaultValue is better for rhf
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Vyberte zdroj" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manuálne</SelectItem>
                                    <SelectItem value="website_form">Web formulár</SelectItem>
                                    <SelectItem value="facebook_lead_ads">Facebook Lead Ads</SelectItem>
                                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                                    <SelectItem value="google_ads">Google Ads</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                onValueChange={(value) => setValue('status', value as LeadStatus)}
                                defaultValue={lead?.status}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Vyberte status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Nový</SelectItem>
                                    <SelectItem value="contacted">Kontaktovaný</SelectItem>
                                    <SelectItem value="offer">Ponuka</SelectItem>
                                    <SelectItem value="won">Vyhraný</SelectItem>
                                    <SelectItem value="lost">Stratený</SelectItem>
                                    <SelectItem value="waiting">Čaká sa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-region">Región</Label>
                        <Select
                            onValueChange={(value) => setValue('region_id', value)}
                            defaultValue={lead?.region_id || undefined}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vyberte región" />
                            </SelectTrigger>
                            <SelectContent>
                                {regions?.map((region) => (
                                    <SelectItem key={region.id} value={region.id}>
                                        {region.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Poznámka</Label>
                        <Textarea id="edit-notes" {...register('notes')} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={updateLead.isPending}>
                            {updateLead.isPending ? 'Ukladám...' : 'Uložiť zmeny'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
