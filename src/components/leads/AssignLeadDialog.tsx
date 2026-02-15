import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAssignLead } from '@/hooks/useLeads';
import { useSalespeople } from '@/hooks/useSalespeople';
import { toast } from 'sonner';
import type { Lead } from '@/types/database';

interface AssignLeadDialogProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignLeadDialog({ lead, open, onOpenChange }: AssignLeadDialogProps) {
    const [userId, setUserId] = useState<string>('');
    const assignLead = useAssignLead();
    const { data: salespeople = [], isLoading: loadingSalespeople } = useSalespeople();

    const handleAssign = async () => {
        if (!lead || !userId) return;

        try {
            await assignLead.mutateAsync({ leadId: lead.id, userId });
            toast.success('Lead bol úspešne priradený');
            onOpenChange(false);
            setUserId('');
        } catch {
            toast.error('Nepodarilo sa priradiť lead');
        }
    };

    if (!lead) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Priradiť lead</DialogTitle>
                    <DialogDescription>
                        Vyberte obchodníka, ktorému chcete priradiť lead <strong>{lead.contact_name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">Obchodník</Label>
                        <Select value={userId} onValueChange={setUserId} disabled={loadingSalespeople}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingSalespeople ? "Načítavam..." : "Vyberte obchodníka"} />
                            </SelectTrigger>
                            <SelectContent>
                                {salespeople.map((person) => (
                                    <SelectItem key={person.id} value={person.id}>
                                        {person.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Zrušiť
                    </Button>
                    <Button onClick={handleAssign} disabled={!userId || assignLead.isPending || loadingSalespeople}>
                        {assignLead.isPending ? 'Priraďovanie...' : 'Priradiť'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
