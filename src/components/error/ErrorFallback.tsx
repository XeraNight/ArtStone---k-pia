import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
    error?: Error | null;
    resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    const handleGoHome = () => {
        resetErrorBoundary();
        // Use window.location instead of useNavigate since ErrorBoundary is outside Router
        window.location.href = '/dashboard';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(40,25%,92%)] dark:bg-background">
            <Card className="max-w-lg w-full vintage-card shadow-lg">
                <CardContent className="pt-8 pb-6 text-center">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 rounded-full bg-destructive/10 border-2 border-destructive/20">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-display font-semibold text-foreground mb-3">
                        Niečo sa pokazilo
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Vyskytla sa neočakávaná chyba pri načítavaní tejto stránky.
                        Skúste to znova alebo sa vráťte na hlavnú stránku.
                    </p>

                    {/* Error Details (Dev Mode Only) */}
                    {import.meta.env.DEV && error && (
                        <details className="mb-6 text-left bg-muted/50 rounded-lg p-4 border border-border">
                            <summary className="cursor-pointer text-sm font-medium text-foreground mb-2 hover:text-primary">
                                Technické detaily (len v dev móde)
                            </summary>
                            <div className="mt-3 space-y-2">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Chyba:</p>
                                    <p className="text-sm text-destructive font-mono">{error.message}</p>
                                </div>
                                {error.stack && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Stack trace:</p>
                                        <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-48 text-foreground/80 font-mono">
                                            {error.stack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </details>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={resetErrorBoundary} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Skúsiť znova
                        </Button>
                        <Button variant="outline" onClick={handleGoHome} className="gap-2">
                            <Home className="h-4 w-4" />
                            Späť na hlavnú stránku
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
