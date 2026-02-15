import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Mail, Phone, Calendar, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types/database';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface KanbanCardProps {
    lead: Lead;
    onClick: () => void;
}

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lead.id,
        // Critical: Disable card as drop target - only columns should accept drops
        disabled: false,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'vintage-card p-4 mb-3 group',
                'cursor-grab active:cursor-grabbing',
                'hover:shadow-lg transition-all duration-200',
                'border-2 border-border bg-card',
                isDragging && 'opacity-50 shadow-2xl scale-105 cursor-grabbing'
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="flex items-start gap-3"
            >
                {/* Drag Handle */}
                <GripVertical
                    className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 flex-shrink-0 mt-0.5 transition-colors"
                />

                <div
                    className="flex-1 min-w-0"
                    onClick={onClick}
                >
                    {/* Lead Name */}
                    <h3 className="font-display font-bold text-foreground mb-1 line-clamp-1">
                        {lead.contact_name}
                    </h3>

                    {/* Company Name */}
                    {lead.company_name && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                            {lead.company_name}
                        </p>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-1.5 mb-3">
                        {lead.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{lead.email}</span>
                            </div>
                        )}
                        {lead.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span>{lead.phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer: Date */}
                    <div className="flex items-center justify-end pt-3 border-t border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(lead.created_at), 'd. M. yyyy', { locale: sk })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
