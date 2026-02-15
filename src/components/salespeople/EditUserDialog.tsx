import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRegions } from '@/hooks/useRegions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface EditUserDialogProps {
    user: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<string, string> = {
    admin: 'Administrátor',
    manager: 'Manažér',
    sales: 'Obchodník',
};

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
    const [role, setRole] = useState<string>('');
    const [regionId, setRegionId] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const { data: regions = [] } = useRegions();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (user) {
            setRole(user.role || 'sales');
            setRegionId(user.region_id || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role,
                    region_id: regionId || null,
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Používateľ bol aktualizovaný');
            queryClient.invalidateQueries({ queryKey: ['salespeople'] });
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Nepodarilo sa aktualizovať používateľa');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upraviť používateľa</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* User info */}
                    <div className="space-y-1">
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>

                    {/* Role selector */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Rola</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Vyberte rolu" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(roleLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Region selector */}
                    <div className="space-y-2">
                        <Label htmlFor="region">Región</Label>
                        <Select value={regionId} onValueChange={setRegionId}>
                            <SelectTrigger id="region">
                                <SelectValue placeholder="Vyberte región" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Žiadny región</SelectItem>
                                {regions.map((region) => (
                                    <SelectItem key={region.id} value={region.id}>
                                        {region.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Zrušiť
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Ukladám...' : 'Uložiť'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
