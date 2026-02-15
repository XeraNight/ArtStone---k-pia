import { useState, useEffect } from 'react';
import { useUpdateInventoryItem, useInventoryCategories } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InventoryItem } from '@/types/database';

interface EditInventoryItemDialogProps {
    item: InventoryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditInventoryItemDialog({ item, open, onOpenChange }: EditInventoryItemDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category_id: '',
        min_stock: '',
        purchase_price: '',
        sale_price: '',
        notes: '',
    });

    const updateItem = useUpdateInventoryItem();
    const { data: categories = [] } = useInventoryCategories();

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                sku: item.sku,
                category_id: item.category_id || '',
                min_stock: item.min_stock?.toString() || '',
                purchase_price: item.purchase_price?.toString() || '',
                sale_price: item.sale_price?.toString() || '',
                notes: item.notes || '',
            });
        }
    }, [item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!item) return;

        if (!formData.name) {
            toast.error('Názov položky je povinný');
            return;
        }

        if (!formData.sku) {
            toast.error('SKU je povinné');
            return;
        }

        try {
            await updateItem.mutateAsync({
                id: item.id,
                name: formData.name,
                sku: formData.sku,
                category_id: formData.category_id || null,
                min_stock: formData.min_stock ? parseInt(formData.min_stock, 10) : 0,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
                notes: formData.notes || null,
            });

            toast.success('Položka bola úspešne upravená');
            onOpenChange(false);
        } catch (error: any) {
            console.error('Update inventory item error:', error);
            toast.error(error.message || 'Nepodarilo sa upraviť položku');
            if (error.details) {
                toast.error(error.details);
            }
        }
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upraviť položku</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Názov *</Label>
                            <Input
                                id="edit-name"
                                placeholder="Brúsený kameň"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-sku">SKU *</Label>
                            <Input
                                id="edit-sku"
                                placeholder="BRT-001"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-category">Kategória</Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vyberte kategóriu" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Dostupné zásoby</Label>
                            <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground">
                                {item.qty_available} ks
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Použite "Pridať zásoby" na zmenu množstva
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-min-stock">Minimálne zásoby (ks)</Label>
                            <Input
                                id="edit-min-stock"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.min_stock}
                                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-purchase-price">Nákupná cena (€)</Label>
                            <Input
                                id="edit-purchase-price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-sale-price">Predajná cena (€)</Label>
                            <Input
                                id="edit-sale-price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Poznámka</Label>
                        <Textarea
                            id="edit-notes"
                            placeholder="Interné poznámky..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateItem.isPending}
                        >
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={updateItem.isPending}>
                            {updateItem.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ukladám...
                                </>
                            ) : (
                                'Uložiť zmeny'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
