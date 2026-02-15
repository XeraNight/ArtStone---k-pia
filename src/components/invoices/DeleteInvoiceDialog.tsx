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

interface DeleteInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoiceNumber: string;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function DeleteInvoiceDialog({
    open,
    onOpenChange,
    invoiceNumber,
    onConfirm,
    isDeleting = false,
}: DeleteInvoiceDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <AlertDialogTitle>Vymazať faktúru</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left pt-4">
                        Naozaj chcete vymazať faktúru <strong className="text-foreground">"{invoiceNumber}"</strong>?
                        <br />
                        <br />
                        Táto akcia je nevratná a faktúra bude trvalo odstránená vrátane všetkých položiek.
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
