import { useState } from 'react';
import { useCreateInventoryItem, useInventoryCategories } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CreateInventoryItemDialog() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category_id: '',
        qty_available: '',
        min_stock: '',
        purchase_price: '',
        sale_price: '',
        notes: '',
    });

    const createItem = useCreateInventoryItem();
    const { data: categories = [] } = useInventoryCategories();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Názov položky je povinný');
            return;
        }

        if (!formData.sku) {
            toast.error('SKU je povinné');
            return;
        }

        try {
            await createItem.mutateAsync({
                name: formData.name,
                sku: formData.sku,
                category_id: formData.category_id || null,
                qty_available: formData.qty_available ? parseInt(formData.qty_available, 10) : 0,
                min_stock: formData.min_stock ? parseInt(formData.min_stock, 10) : 0,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
                notes: formData.notes || null,
            });

            toast.success('Položka bola úspešne vytvorená');
            setOpen(false);
            setFormData({
                name: '',
                sku: '',
                category_id: '',
                qty_available: '',
                min_stock: '',
                purchase_price: '',
                sale_price: '',
                notes: '',
            });
        } catch (error: any) {
            console.error('Create inventory item error:', error);
            toast.error(error.message || 'Nepodarilo sa vytvoriť položku');
            if (error.details) {
                toast.error(error.details);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {/* Mobile: Icon-only button */}
                <Button className="md:hidden min-h-[44px] min-w-[44px]" size="icon" title="Pridať položku">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogTrigger asChild>
                {/* Desktop: Full button */}
                <Button className="hidden md:flex">
                    <Plus className="h-4 w-4 mr-2" />
                    Pridať položku
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Vytvoriť novú položku</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Názov *</Label>
                            <Input
                                id="name"
                                placeholder="Brúsený kameň"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU *</Label>
                            <Input
                                id="sku"
                                placeholder="BRT-001"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kategória</Label>
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
                            <Label htmlFor="qty_available">Počiatočné množstvo (ks)</Label>
                            <Input
                                id="qty_available"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.qty_available}
                                onChange={(e) => setFormData({ ...formData, qty_available: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min_stock">Minimálne zásoby (ks)</Label>
                            <Input
                                id="min_stock"
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
                            <Label htmlFor="purchase_price">Nákupná cena (€)</Label>
                            <Input
                                id="purchase_price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sale_price">Predajná cena (€)</Label>
                            <Input
                                id="sale_price"
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
                        <Label htmlFor="notes">Poznámka</Label>
                        <Textarea
                            id="notes"
                            placeholder="Interné poznámky..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={createItem.isPending}
                        >
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={createItem.isPending}>
                            {createItem.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Vytváram...
                                </>
                            ) : (
                                'Vytvoriť položku'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
