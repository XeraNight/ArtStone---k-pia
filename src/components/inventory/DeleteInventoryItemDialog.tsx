import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Receipt, Settings } from 'lucide-react';

interface DeleteInventoryItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    affectedQuotes?: string[];
    affectedInvoices?: string[];
    onConfirm: (forceDelete: boolean) => void;
    onAdjustStockInstead?: () => void;
    isDeleting?: boolean;
}

export function DeleteInventoryItemDialog({
    open,
    onOpenChange,
    itemName,
    affectedQuotes = [],
    affectedInvoices = [],
    onConfirm,
    onAdjustStockInstead,
    isDeleting = false,
}: DeleteInventoryItemDialogProps) {
    const [forceDelete, setForceDelete] = useState(false);
    const hasReferences = affectedQuotes.length > 0 || affectedInvoices.length > 0;

    const handleConfirm = () => {
        onConfirm(forceDelete);
        setForceDelete(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
        setForceDelete(false);
    };

    const handleAdjustStock = () => {
        onOpenChange(false);
        setForceDelete(false);
        onAdjustStockInstead?.();
    };

    return (
        <AlertDialog open={open} onOpenChange={handleCancel}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <AlertDialogTitle>Vymazať skladovú položku</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left pt-4">
                        Naozaj chcete vymazať položku <strong className="text-foreground">"{itemName}"</strong>?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {hasReferences && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-warning bg-warning/10 p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-medium text-foreground">
                                        Položka je použitá v existujúcich dokumentoch
                                    </p>

                                    {affectedQuotes.length > 0 && (
                                        <div className="text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <FileText className="h-4 w-4" />
                                                <span className="font-medium">Cenové ponuky:</span>
                                            </div>
                                            <div className="ml-6 space-y-1">
                                                {affectedQuotes.map((quoteNum) => (
                                                    <div key={quoteNum} className="text-foreground">
                                                        {quoteNum}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {affectedInvoices.length > 0 && (
                                        <div className="text-sm mt-2">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                <Receipt className="h-4 w-4" />
                                                <span className="font-medium">Faktúry:</span>
                                            </div>
                                            <div className="ml-6 space-y-1">
                                                {affectedInvoices.map((invNum) => (
                                                    <div key={invNum} className="text-foreground">
                                                        {invNum}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                            <Checkbox
                                id="force-delete"
                                checked={forceDelete}
                                onCheckedChange={(checked) => setForceDelete(checked === true)}
                                disabled={isDeleting}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="force-delete"
                                    className="text-sm font-medium cursor-pointer text-foreground"
                                >
                                    Vynútené vymazanie
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Položka bude odstránená zo všetkých cenových ponúk a faktúr.
                                    Táto akcia je nevratná a ovplyvní historické záznamy.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!hasReferences && (
                    <AlertDialogDescription className="text-left">
                        Táto akcia je nevratná a položka bude trvalo odstránená zo skladu.
                    </AlertDialogDescription>
                )}

                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel disabled={isDeleting} onClick={handleCancel}>
                        Zrušiť
                    </AlertDialogCancel>

                    {hasReferences && onAdjustStockInstead && (
                        <Button
                            variant="outline"
                            onClick={handleAdjustStock}
                            disabled={isDeleting}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Upraviť zásoby namiesto toho
                        </Button>
                    )}

                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isDeleting || (hasReferences && !forceDelete)}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Vymazávam...' : 'Vymazať'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
