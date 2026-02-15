import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Loader2 } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { SearchResults } from '@/components/layout/SearchResults';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
    className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const { results, isLoading } = useGlobalSearch(query);

    // Calculate total results for keyboard navigation
    const allResults = [
        ...results.leads,
        ...results.clients,
        ...results.quotes,
    ];
    const totalResults = allResults.length;

    // Keyboard shortcut: Ctrl/Cmd + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset state when closing
    const handleClose = useCallback(() => {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
    }, []);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(totalResults, 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev === 0 ? Math.max(totalResults - 1, 0) : prev - 1
                );
            } else if (e.key === 'Enter' && totalResults > 0) {
                e.preventDefault();
                const selected = allResults[selectedIndex];
                if (selected) {
                    window.location.href = selected.href;
                    handleClose();
                }
            } else if (e.key === 'Escape') {
                handleClose();
            }
        },
        [totalResults, selectedIndex, allResults, handleClose]
    );

    const handleSelect = useCallback(
        (result: any) => {
            window.location.href = result.href;
            handleClose();
        },
        [handleClose]
    );

    return (
        <>
            {/* Search trigger button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                    'bg-muted/50 hover:bg-muted transition-colors',
                    'border border-border',
                    'text-sm text-muted-foreground',
                    'w-full max-w-md',
                    className
                )}
            >
                <Search className="h-4 w-4" />
                <span>Hľadať leady, klientov, ponuky...</span>
                <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Search dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 gap-0">
                    <div className="flex items-center border-b px-4 py-3">
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-3" />
                        ) : (
                            <Search className="h-5 w-5 text-muted-foreground mr-3" />
                        )}
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Hľadať leady, klientov, ponuky..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0); // Reset selection on new query
                            }}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Vymazať
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {query.length < 2 ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Začnite písať pre vyhľadávanie...</p>
                                <p className="text-xs mt-1">Minimálne 2 znaky</p>
                            </div>
                        ) : totalResults === 0 && !isLoading ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Nenašli sa žiadne výsledky</p>
                                <p className="text-xs mt-1">Skúste iný výraz</p>
                            </div>
                        ) : (
                            <SearchResults
                                results={results}
                                isLoading={isLoading}
                                query={query}
                                selectedIndex={selectedIndex}
                                onSelect={handleSelect}
                            />
                        )}
                    </div>

                    <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted border">↑↓</kbd>
                                navigácia
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd>
                                otvoriť
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-muted border">Esc</kbd>
                            zavrieť
                        </span>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
