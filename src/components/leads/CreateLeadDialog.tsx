import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { useCreateLead } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useRegions } from '@/hooks/useRegions';
import type { LeadSource, LeadStatus } from '@/types/database';

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

export function CreateLeadDialog() {
    const [open, setOpen] = useState(false);
    const createLead = useCreateLead();
    const { data: regions } = useRegions();

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            status: 'new',
            source_type: 'manual',
        }
    });

    const onSubmit = async (data: FormData) => {
        try {
            await createLead.mutateAsync({
                ...data,
                company_name: data.company_name || null,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                postal_code: data.postal_code || null,
                region_id: data.region_id || null,
                notes: data.notes || null,
            });
            toast.success('Lead bol úspešne vytvorený');
            setOpen(false);
            reset();
        } catch (error) {
            console.error('Create lead error:', error);
            // @ts-ignore
            const errorMessage = error?.message || 'Neznáma chyba';
            // @ts-ignore
            const errorDetails = error?.details || '';
            toast.error(`Nepodarilo sa vytvoriť lead: ${errorMessage} ${errorDetails}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {/* Mobile: Icon-only button */}
                <Button className="md:hidden min-h-[44px] min-w-[44px]" size="icon" title="Nový lead">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
                {/* Desktop: Full button */}
                <Button className="hidden md:flex">
                    <Plus className="h-4 w-4 mr-2" />
                    Nový lead
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Vytvoriť nový lead</DialogTitle>
                    <DialogDescription>
                        Vyplňte informácie o novom potenciálnom klientovi.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact_name">Meno kontaktu *</Label>
                            <Input
                                id="contact_name"
                                {...register('contact_name', { required: true })}
                                className={errors.contact_name ? 'border-destructive' : ''}
                            />
                            {errors.contact_name && (
                                <span className="text-xs text-destructive">Toto pole je povinné</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Názov firmy</Label>
                            <Input id="company_name" {...register('company_name')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" {...register('email')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefón</Label>
                            <Input id="phone" {...register('phone')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="source">Zdroj</Label>
                            <Select
                                onValueChange={(value) => setValue('source_type', value as LeadSource)}
                                defaultValue="manual"
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
                            <Label htmlFor="status">Status</Label>
                            <Select
                                onValueChange={(value) => setValue('status', value as LeadStatus)}
                                defaultValue="new"
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
                        <Label htmlFor="region">Región</Label>
                        <Select onValueChange={(value) => setValue('region_id', value)}>
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
                        <Label htmlFor="notes">Poznámka</Label>
                        <Textarea id="notes" {...register('notes')} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={createLead.isPending}>
                            {createLead.isPending ? 'Vytváranie...' : 'Vytvoriť lead'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
