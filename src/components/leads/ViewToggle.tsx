import { LayoutGrid, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
    view: 'table' | 'kanban';
    onViewChange: (view: 'table' | 'kanban') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="inline-flex rounded-lg border border-border bg-background p-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('table')}
                className={cn(
                    'gap-2 rounded-md px-3',
                    view === 'table' && 'bg-muted shadow-sm'
                )}
            >
                <Table className="h-4 w-4" />
                <span className="hidden sm:inline">Tabuľka</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('kanban')}
                className={cn(
                    'gap-2 rounded-md px-3',
                    view === 'kanban' && 'bg-muted shadow-sm'
                )}
            >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
            </Button>
        </div>
    );
}
