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
import { useLeads, useAssignLead } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AssignLeadToSalespersonDialogProps {
    salespersonId: string | null;
    salespersonName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignLeadToSalespersonDialog({
    salespersonId,
    salespersonName,
    open,
    onOpenChange,
}: AssignLeadToSalespersonDialogProps) {
    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    const { data: allLeads } = useLeads();
    const assignLead = useAssignLead();

    // Filter unassigned leads or leads from same region
    const availableLeads = allLeads?.filter(lead => !lead.assigned_user_id) || [];

    const handleAssign = async () => {
        if (!salespersonId || !selectedLeadId) return;

        try {
            await assignLead.mutateAsync({ leadId: selectedLeadId, userId: salespersonId });
            toast.success(`Lead bol priradený pre ${salespersonName}`);
            onOpenChange(false);
            setSelectedLeadId('');
        } catch {
            toast.error('Nepodarilo sa priradiť lead');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Priradiť lead</DialogTitle>
                    <DialogDescription>
                        Vyberte lead, ktorý chcete priradiť pre <strong>{salespersonName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {availableLeads.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Žiadne nepriradené leady
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="lead">Lead</Label>
                            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Vyberte lead" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableLeads.map(lead => (
                                        <SelectItem key={lead.id} value={lead.id}>
                                            <div>
                                                <span className="font-medium">{lead.contact_name}</span>
                                                {lead.company_name && (
                                                    <span className="text-muted-foreground"> ({lead.company_name})</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Zrušiť
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedLeadId || assignLead.isPending || availableLeads.length === 0}
                    >
                        {assignLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Priradiť
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
