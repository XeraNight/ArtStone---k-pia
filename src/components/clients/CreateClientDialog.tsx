import { useState } from 'react';
import { useCreateClient } from '@/hooks/useClients';
import { useRegions } from '@/hooks/useRegions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CreateClientDialog() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        contact_name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        postal_code: '',
        region_id: '',
        status: 'prospect' as 'prospect' | 'active' | 'inactive' | 'completed',
        notes: '',
    });

    const createClient = useCreateClient();
    const { data: regions = [] } = useRegions();
    const { user } = useAuth();
    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.contact_name) {
            toast.error('Meno kontaktnej osoby je povinné');
            return;
        }

        try {
            await createClient.mutateAsync({
                contact_name: formData.contact_name,
                company_name: formData.company_name || null,
                email: formData.email || null,
                phone: formData.phone || null,
                address: formData.address || null,
                postal_code: formData.postal_code || null,
                region_id: formData.region_id || null,
                status: formData.status,
                notes: formData.notes || null,
            });

            toast.success('Klient bol úspešne vytvorený');
            setOpen(false);
            setFormData({
                contact_name: '',
                company_name: '',
                email: '',
                phone: '',
                address: '',
                postal_code: '',
                region_id: '',
                status: 'prospect',
                notes: '',
            });
        } catch (error: any) {
            console.error('Create client error:', error);
            toast.error(error.message || 'Nepodarilo sa vytvoriť klienta');
            if (error.details) {
                toast.error(error.details);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {/* Mobile: Icon-only button */}
                <Button className="md:hidden min-h-[44px] min-w-[44px]" size="icon" title="Nový klient">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
                {/* Desktop: Full button */}
                <Button className="hidden md:flex">
                    <Plus className="h-4 w-4 mr-2" />
                    Nový klient
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Vytvoriť nového klienta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact_name">Meno a priezvisko *</Label>
                            <Input
                                id="contact_name"
                                placeholder="Ján Novák"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Firma</Label>
                            <Input
                                id="company_name"
                                placeholder="Firma s.r.o."
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jan@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefón</Label>
                            <Input
                                id="phone"
                                placeholder="+421 9xx xxx xxx"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Adresa</Label>
                            <Input
                                id="address"
                                placeholder="Ulica 123"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postal_code">PSČ</Label>
                            <Input
                                id="postal_code"
                                placeholder="000 00"
                                value={formData.postal_code}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="region">Región</Label>
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
                        <Label htmlFor="notes">Poznámka</Label>
                        <Textarea
                            id="notes"
                            placeholder="Interné poznámky..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={createClient.isPending}
                        >
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={createClient.isPending}>
                            {createClient.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Vytváram...
                                </>
                            ) : (
                                'Vytvoriť klienta'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
