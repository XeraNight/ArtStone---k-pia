import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Database, TestTube } from 'lucide-react';
import { toast } from 'sonner';

export function DemoModeToggle() {
    const { isDemo } = useAuth();

    const toggleDemoMode = () => {
        const newDemoMode = !isDemo;

        if (newDemoMode) {
            localStorage.setItem('artstone-demo-mode', 'true');
            toast.info('Prepnuté na demo dáta');
        } else {
            localStorage.removeItem('artstone-demo-mode');
            toast.success('Prepnuté na reálne dáta z databázy');
        }

        // Reload to apply changes
        window.location.reload();
    };

    return (
        <Button
            onClick={toggleDemoMode}
            variant={isDemo ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
        >
            {isDemo ? (
                <>
                    <TestTube className="h-4 w-4" />
                    Demo režim
                </>
            ) : (
                <>
                    <Database className="h-4 w-4" />
                    Reálne dáta
                </>
            )}
        </Button>
    );
}
