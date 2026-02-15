import { User, Building, FileText, Mail, Phone, Receipt, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResults as SearchResultsType, SearchResult } from '@/types/search';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResultsProps {
    results: SearchResultsType;
    isLoading: boolean;
    query: string;
    selectedIndex: number;
    onSelect: (result: SearchResult) => void;
}

const entityIcons = {
    lead: User,
    client: Building,
    quote: FileText,
    invoice: Receipt,
    inventory: Package,
};

const entityLabels = {
    lead: 'Leady',
    client: 'Klienti',
    quote: 'Ponuky',
    invoice: 'Faktúry',
    inventory: 'Sklad',
};

function highlightMatch(text: string, query: string) {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 text-foreground">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}

export function SearchResults({
    results,
    isLoading,
    query,
    selectedIndex,
    onSelect,
}: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="px-4 py-4 space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const categories: Array<{
        key: keyof SearchResultsType;
        label: string;
        results: SearchResult[];
    }> = [
        { key: 'leads' as const, label: entityLabels.lead, results: results.leads },
        { key: 'clients' as const, label: entityLabels.client, results: results.clients },
        { key: 'quotes' as const, label: entityLabels.quote, results: results.quotes },
        { key: 'invoices' as const, label: entityLabels.invoice, results: results.invoices },
        { key: 'inventory' as const, label: entityLabels.inventory, results: results.inventory },
    ].filter((cat) => cat.results.length > 0);

    let currentIndex = 0;

    return (
        <div className="py-2">
            {categories.map((category) => {
                const categoryStartIndex = currentIndex;

                return (
                    <div key={category.key} className="mb-4 last:mb-0">
                        <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {category.label} ({category.results.length})
                        </div>
                        <div>
                            {category.results.map((result, idx) => {
                                const globalIndex = categoryStartIndex + idx;
                                const isSelected = globalIndex === selectedIndex;
                                currentIndex++;

                                const Icon = entityIcons[result.type];

                                return (
                                    <button
                                        key={result.id}
                                        onClick={() => onSelect(result)}
                                        className={cn(
                                            'w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left',
                                            isSelected && 'bg-muted'
                                        )}
                                    >
                                        <div className={cn(
                                            'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                            result.type === 'lead' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                            result.type === 'client' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                            result.type === 'quote' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                                            result.type === 'invoice' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                                            result.type === 'inventory' && 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                                        )}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-foreground">
                                                {highlightMatch(result.title, query)}
                                            </div>
                                            {result.subtitle && (
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {highlightMatch(result.subtitle, query)}
                                                </div>
                                            )}
                                            {result.metadata && (
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                    {result.metadata.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {highlightMatch(result.metadata.email, query)}
                                                        </span>
                                                    )}
                                                    {result.metadata.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {highlightMatch(result.metadata.phone, query)}
                                                        </span>
                                                    )}
                                                    {result.metadata.company && (
                                                        <span className="truncate">
                                                            {result.metadata.company}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
