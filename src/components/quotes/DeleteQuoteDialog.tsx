import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteQuoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteNumber: string;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function DeleteQuoteDialog({
    open,
    onOpenChange,
    quoteNumber,
    onConfirm,
    isDeleting = false,
}: DeleteQuoteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <AlertDialogTitle>Vymazať cenovú ponuku</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left pt-4">
                        Naozaj chcete vymazať cenovú ponuku <strong className="text-foreground">"{quoteNumber}"</strong>?
                        <br />
                        <br />
                        Táto akcia je nevratná a ponuka bude trvalo odstránená vrátane všetkých položiek a rezervácií.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Zrušiť
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Vymazávam...' : 'Vymazať'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
