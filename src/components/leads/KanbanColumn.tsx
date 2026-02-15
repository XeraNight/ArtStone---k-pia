import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/types/database';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
    status: string;
    label: string;
    color: string;
    leads: Lead[];
    onCardClick: (lead: Lead) => void;
}

const STATUS_CONFIG: Record<string, { borderColor: string; badgeVariant: any }> = {
    new: { borderColor: 'border-l-blue-500', badgeVariant: 'new' },
    contacted: { borderColor: 'border-l-purple-500', badgeVariant: 'contacted' },
    offer: { borderColor: 'border-l-orange-500', badgeVariant: 'offer' },
    won: { borderColor: 'border-l-emerald-500', badgeVariant: 'won' },
    lost: { borderColor: 'border-l-red-500', badgeVariant: 'default' },
    waiting: { borderColor: 'border-l-yellow-500', badgeVariant: 'default' },
};

export function KanbanColumn({ status, label, color, leads, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;

    return (
        <div className="flex-shrink-0 w-72">
            <div
                className={cn(
                    'vintage-card border-l-4 border-t-0 border-r-0 border-b-0 flex flex-col',
                    config.borderColor,
                    isOver && 'ring-2 ring-primary'
                )}
            >
                {/* Compact Sticky Header */}
                <div className="bg-card border-b border-border px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide truncate">
                            {label}
                        </h3>
                        <Badge
                            variant={config.badgeVariant}
                            className="shrink-0 h-6 min-w-[2rem] flex items-center justify-center font-semibold"
                        >
                            {leads.length}
                        </Badge>
                    </div>
                </div>

                {/* Cards Container */}
                <div
                    ref={setNodeRef}
                    className="flex-1 p-3 overflow-y-auto max-h-[calc(100vh-200px)]"
                >
                    <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                        {leads.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <p>Žiadne leady</p>
                                <p className="text-xs mt-1">Presuňte sem lead</p>
                            </div>
                        ) : (
                            leads.map((lead) => (
                                <KanbanCard
                                    key={lead.id}
                                    lead={lead}
                                    onClick={() => onCardClick(lead)}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            </div>
        </div>
    );
}
