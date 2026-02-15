import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { LeadDetailDialog } from './LeadDetailDialog';
import type { Lead, LeadStatus, LeadSource } from '@/types/database';
import { useLeads, useUpdateLeadStatus } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const LEAD_STATUSES: Array<{ value: LeadStatus; label: string; color: string }> = [
    { value: 'new', label: 'Nový', color: 'blue' },
    { value: 'contacted', label: 'Kontaktovaný', color: 'purple' },
    { value: 'offer', label: 'Ponuka', color: 'orange' },
    { value: 'won', label: 'Úspešný', color: 'emerald' },
    { value: 'lost', label: 'Stratený', color: 'red' },
];

const statusLabels: Record<LeadStatus, string> = {
    new: 'Nový',
    contacted: 'Kontaktovaný',
    offer: 'Ponuka',
    won: 'Vyhraný',
    lost: 'Stratený',
    waiting: 'Čaká sa',
};

const sourceLabels: Record<LeadSource, string> = {
    facebook_lead_ads: 'Facebook Lead Ads',
    facebook_ads: 'Facebook Ads',
    google_ads: 'Google Ads',
    website_form: 'Web formulár',
    manual: 'Manuálne',
};

export function KanbanBoard() {
    const { data: leads = [], isLoading } = useLeads({});
    const updateLeadStatus = useUpdateLeadStatus();
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        })
    );

    const handleDragStart = (event: any) => {
        const lead = leads.find(l => l.id === event.active.id);
        setActiveLead(lead || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveLead(null);

        // CRITICAL DEBUG: Log what we're getting
        console.log('🔍 DragEnd Debug:', {
            activeId: active.id,
            activeType: typeof active.id,
            overId: over?.id,
            overType: typeof over?.id,
            overData: over?.data,
        });

        if (!over || active.id === over.id) return;

        const leadId = active.id as string;
        let newStatus = over.id as string;

        // CRITICAL FIX: If over.id is a UUID (dropping on another card), 
        // find that card's status instead
        if (newStatus.length > 10 && newStatus.includes('-')) {
            console.log('⚠️ Detected UUID as drop target, looking up column status...');
            const targetLead = leads.find(l => l.id === newStatus);
            if (targetLead) {
                newStatus = targetLead.status;
                console.log(`✅ Mapped UUID to status: ${newStatus}`);
            } else {
                console.error('❌ Could not find lead with UUID:', newStatus);
                toast.error('Chyba: Neplatný cieľ presunu');
                return;
            }
        }

        // Find the lead being moved
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        // Don't move if already in that column
        if (lead.status === newStatus) {
            console.log('ℹ️ Lead already in this column, skipping');
            return;
        }

        // Debug logging
        const columnLeadCount = leads.filter(l => l.status === newStatus).length;
        console.log('🎯 Dragging lead to column:', {
            leadId,
            leadName: lead.contact_name,
            oldStatus: lead.status,
            newStatus,
            newStatusIsUUID: newStatus.length > 10 && newStatus.includes('-'),
            currentLeadsInColumn: columnLeadCount,
        });

        // Update lead status
        updateLeadStatus.mutate(
            { leadId, status: newStatus as LeadStatus },
            {
                onSuccess: () => {
                    console.log('✅ Status update successful');
                    toast.success(`Lead presunutý do stĺpca "${LEAD_STATUSES.find(s => s.value === newStatus)?.label}"`);
                },
                onError: (error: any) => {
                    console.error('❌ Failed to update lead status:', {
                        error,
                        message: error?.message,
                        code: error?.code,
                        details: error?.details,
                        hint: error?.hint,
                    });
                    toast.error(`Nepodarilo sa: ${error?.message || 'Neznáma chyba'}`);
                },
            }
        );
    };

    const handleCardClick = (lead: Lead) => {
        setSelectedLead(lead);
        setDetailOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {LEAD_STATUSES.map((status) => (
                    <div key={status.value} className="flex-shrink-0 w-72">
                        <Skeleton className="h-[600px] rounded-lg" />
                    </div>
                ))}
            </div>
        );
    }

    // Group leads by status
    const leadsByStatus = LEAD_STATUSES.reduce((acc, status) => {
        acc[status.value] = leads.filter(lead => lead.status === status.value);
        return acc;
    }, {} as Record<string, Lead[]>);

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-1 overflow-x-auto pt-4 pr-4">
                    {LEAD_STATUSES.map((status) => (
                        <KanbanColumn
                            key={status.value}
                            status={status.value}
                            label={status.label}
                            color={status.color}
                            leads={leadsByStatus[status.value] || []}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeLead ? (
                        <div className="rotate-3">
                            <KanbanCard lead={activeLead} onClick={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {selectedLead && (
                <LeadDetailDialog
                    lead={selectedLead}
                    open={detailOpen}
                    onOpenChange={setDetailOpen}
                    statusLabels={statusLabels}
                    sourceLabels={sourceLabels}
                    getRegionName={() => ''}
                />
            )}
        </>
    );
}
