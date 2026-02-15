import { useState } from 'react';
import { useAdjustStock } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdjustStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemId: string;
    itemName: string;
    currentStock: number;
}

export function AdjustStockDialog({ open, onOpenChange, itemId, itemName, currentStock }: AdjustStockDialogProps) {
    const [quantity, setQuantity] = useState(1);
    const [mode, setMode] = useState<'add' | 'remove'>('add');
    const adjustStock = useAdjustStock();

    const handleSubmit = async () => {
        if (quantity <= 0) {
            toast.error('Množstvo musí byť väčšie ako 0');
            return;
        }

        const adjustment = mode === 'add' ? quantity : -quantity;

        try {
            await adjustStock.mutateAsync({ itemId, adjustment });
            toast.success(mode === 'add' ? 'Zásoby pridané' : 'Zásoby odobrané');
            onOpenChange(false);
            setQuantity(1);
            setMode('add');
        } catch (error: any) {
            console.error('Adjust stock error:', error);
            toast.error('Nepodarilo sa upraviť zásoby');
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setQuantity(1);
        setMode('add');
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upraviť zásoby</DialogTitle>
                    <DialogDescription>
                        {itemName}
                        <br />
                        <span className="text-sm">Aktuálny stav: <strong>{currentStock} ks</strong></span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Mode Selection */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={mode === 'add' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => setMode('add')}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Pridať
                        </Button>
                        <Button
                            type="button"
                            variant={mode === 'remove' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => setMode('remove')}
                        >
                            <Minus className="h-4 w-4 mr-2" />
                            Odobrať
                        </Button>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Množstvo (ks)</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            placeholder="Zadajte počet kusov"
                            autoFocus
                        />
                    </div>

                    {/* Preview */}
                    <div className="bg-muted p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Nový stav:</span>
                            <span className="text-lg font-bold">
                                {mode === 'add'
                                    ? currentStock + quantity
                                    : Math.max(0, currentStock - quantity)
                                } ks
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {mode === 'add' ? `+${quantity}` : `-${quantity}`} ks
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={adjustStock.isPending}>
                        Zrušiť
                    </Button>
                    <Button onClick={handleSubmit} disabled={adjustStock.isPending || quantity <= 0}>
                        {adjustStock.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upravujem...
                            </>
                        ) : (
                            mode === 'add' ? 'Pridať zásoby' : 'Odobrať zásoby'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
