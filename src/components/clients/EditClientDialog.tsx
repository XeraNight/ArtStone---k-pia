import { useState, useEffect } from 'react';
import { useUpdateClient } from '@/hooks/useClients';
import { useRegions } from '@/hooks/useRegions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, ClientStatus } from '@/types/database';

interface EditClientDialogProps {
    client: Client | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<ClientStatus, string> = {
    active: 'Aktívny',
    inactive: 'Neaktívny',
    prospect: 'Potenciálny',
    completed: 'Ukončená spolupráca',
};

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
    const [formData, setFormData] = useState({
        contact_name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        postal_code: '',
        region_id: '',
        notes: '',
        status: 'prospect' as ClientStatus,
        total_value: '',
    });

    const updateClient = useUpdateClient();
    const { data: regions = [] } = useRegions();

    useEffect(() => {
        if (client) {
            setFormData({
                contact_name: client.contact_name || '',
                company_name: client.company_name || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                postal_code: client.postal_code || '',
                region_id: client.region_id || '',
                notes: client.notes || '',
                status: client.status || 'prospect',
                total_value: client.total_value?.toString() || '',
            });
        }
    }, [client, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!client) return;

        if (!formData.contact_name) {
            toast.error('Meno kontaktnej osoby je povinné');
            return;
        }

        try {
            await updateClient.mutateAsync({
                id: client.id,
                contact_name: formData.contact_name,
                company_name: formData.company_name || null,
                email: formData.email || null,
                phone: formData.phone || null,
                address: formData.address || null,
                postal_code: formData.postal_code || null,
                region_id: formData.region_id || null,
                notes: formData.notes || null,
                status: formData.status,
                total_value: formData.total_value ? parseFloat(formData.total_value) : 0,
            });

            toast.success('Klient bol úspešne aktualizovaný');
            onOpenChange(false);
        } catch (error) {
            toast.error('Nepodarilo sa aktualizovať klienta');
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upraviť klienta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: ClientStatus) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-total_value">Celková hodnota (€)</Label>
                            <Input
                                id="edit-total_value"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.total_value}
                                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-contact_name">Meno a priezvisko *</Label>
                            <Input
                                id="edit-contact_name"
                                placeholder="Ján Novák"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-company_name">Firma</Label>
                            <Input
                                id="edit-company_name"
                                placeholder="Firma s.r.o."
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="jan@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Telefón</Label>
                            <Input
                                id="edit-phone"
                                placeholder="+421 9xx xxx xxx"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Adresa</Label>
                            <Input
                                id="edit-address"
                                placeholder="Ulica 123"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-postal_code">PSČ</Label>
                            <Input
                                id="edit-postal_code"
                                placeholder="000 00"
                                value={formData.postal_code}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-region">Región</Label>
                        <Select
                            value={formData.region_id}
                            onValueChange={(value) => setFormData({ ...formData, region_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vyberte región" />
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map((region) => (
                                    <SelectItem key={region.id} value={region.id}>
                                        {region.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Poznámka</Label>
                        <Textarea
                            id="edit-notes"
                            placeholder="Interné poznámky..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateClient.isPending}
                        >
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={updateClient.isPending}>
                            {updateClient.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ukladám...
                                </>
                            ) : (
                                'Uložiť zmeny'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
