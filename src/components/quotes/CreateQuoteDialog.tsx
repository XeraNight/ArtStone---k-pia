import { useState, useMemo } from 'react';
import { useCreateQuote } from '@/hooks/useQuotes';
import { useClients } from '@/hooks/useClients';
import { useInventoryItems } from '@/hooks/useInventory';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2, Calculator } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    inventory_item_id?: string;
}

interface CreateQuoteDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultClientId?: string;
}

export function CreateQuoteDialog({ open: controlledOpen, onOpenChange, defaultClientId }: CreateQuoteDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = (value: boolean) => {
        if (onOpenChange) {
            onOpenChange(value);
        } else {
            setInternalOpen(value);
        }
    };
    const [clientId, setClientId] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<QuoteItem[]>([]);

    // New fields
    const [discount, setDiscount] = useState(0);
    const [shipping, setShipping] = useState(0);

    // Item form state
    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('custom');
    const [itemDescription, setItemDescription] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemPrice, setItemPrice] = useState(0);

    const createQuote = useCreateQuote();
    const { data: clients = [] } = useClients();
    const { data: inventory = [] } = useInventoryItems();

    // Set client if defaultClientId provided
    useMemo(() => {
        if (defaultClientId && clients.length > 0) {
            const client = clients.find(c => c.id === defaultClientId);
            if (client) {
                setClientId(defaultClientId);
            }
        }
    }, [defaultClientId, clients, open]);

    // Check for leadId in URL to pre-fill client
    useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const leadId = params.get('leadId');
        const action = params.get('action');

        if (leadId && action === 'new' && clients.length > 0) {
            const client = clients.find(c => c.lead_origin_id === leadId);
            if (client) {
                setClientId(client.id);
                setOpen(true);
            } else {
                // Optional: Toast warning that lead is not converted to client yet
            }
        }
    }, [clients]);

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items]);

    // Totals calculation
    const taxableBase = Math.max(0, subtotal - discount + shipping);
    const taxAmount = taxableBase * 0.2;
    const total = taxableBase + taxAmount;

    const handleInventorySelect = (itemId: string) => {
        setSelectedInventoryId(itemId);
        if (itemId === 'custom') {
            setItemDescription('');
            setItemPrice(0);
        } else {
            const item = inventory.find(i => i.id === itemId);
            if (item) {
                setItemDescription(item.name);
                setItemPrice(item.sale_price || 0);
            }
        }
    };

    const handleAddItem = () => {
        if (!itemDescription) {
            toast.error('Popis položky je povinný');
            return;
        }
        if (itemQuantity <= 0) {
            toast.error('Množstvo musí byť väčšie ako 0');
            return;
        }

        const newItem: QuoteItem = {
            id: Math.random().toString(36).substr(2, 9),
            description: itemDescription,
            quantity: itemQuantity,
            unit_price: itemPrice,
            inventory_item_id: selectedInventoryId === 'custom' ? undefined : selectedInventoryId,
        };

        setItems([...items, newItem]);

        // Reset form
        setSelectedInventoryId('custom');
        setItemDescription('');
        setItemQuantity(1);
        setItemPrice(0);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleSubmit = async () => {
        if (!clientId) {
            toast.error('Vyberte klienta');
            return;
        }
        if (items.length === 0) {
            toast.error('Pridajte aspoň jednu položku');
            return;
        }

        try {
            await createQuote.mutateAsync({
                client_id: clientId,
                valid_until: validUntil || undefined,
                notes: notes || undefined,
                discount,
                shipping,
                items: items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    inventory_item_id: i.inventory_item_id,
                })),
            });

            toast.success('Cenová ponuka vytvorená');
            setOpen(false);

            // Reset all state
            setClientId('');
            setValidUntil('');
            setNotes('');
            setItems([]);
            setDiscount(0);
            setShipping(0);

            // Clear URL params
            window.history.replaceState({}, '', window.location.pathname);

        } catch (error: any) {
            console.error('Create quote error:', error);
            toast.error(error.message || 'Nepodarilo sa vytvoriť cenovú ponuku');
            if (error.details) {
                toast.error(error.details);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Vytvoriť cenovú ponuku</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* General Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Klient *</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Vyberte klienta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.contact_name} {client.company_name ? `(${client.company_name})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Platnosť do</Label>
                            <Input
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                        {/* ... Table and Add Item Form are same ... */}
                        <div className="flex items-center gap-2 font-medium">
                            <Calculator className="h-4 w-4" />
                            Položky ponuky
                        </div>

                        {items.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Popis</TableHead>
                                        <TableHead className="w-[100px] text-right">Množstvo</TableHead>
                                        <TableHead className="w-[120px] text-right">Cena/ks</TableHead>
                                        <TableHead className="w-[120px] text-right">Spolu</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{item.unit_price.toFixed(2)} €</TableCell>
                                            <TableCell className="text-right">{(item.quantity * item.unit_price).toFixed(2)} €</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Add Item Form */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-card p-3 rounded border">
                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-xs">Predloha (Sklad)</Label>
                                <Select value={selectedInventoryId} onValueChange={handleInventorySelect}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Vlastná položka" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom">Vlastná položka</SelectItem>
                                        {inventory.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name} ({item.qty_available} ks)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <Label className="text-xs">Popis *</Label>
                                <Input
                                    className="h-8"
                                    value={itemDescription}
                                    onChange={(e) => setItemDescription(e.target.value)}
                                    placeholder="Názov položky alebo služby"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs">Množstvo *</Label>
                                <Input
                                    type="number"
                                    className="h-8"
                                    min="1"
                                    value={itemQuantity}
                                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs">Cena/ks (€)</Label>
                                <Input
                                    type="number"
                                    className="h-8"
                                    min="0"
                                    step="0.01"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Button size="sm" className="w-full h-8" onClick={handleAddItem}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Extra Costs & Totals */}
                        <div className="grid gap-4 pt-4 border-t">
                            <div className="flex justify-end gap-4 items-center">
                                <Label className="w-24 text-right">Zľava (€)</Label>
                                <Input
                                    type="number"
                                    className="w-32 h-8 text-right"
                                    min="0"
                                    step="0.01"
                                    value={discount}
                                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex justify-end gap-4 items-center">
                                <Label className="w-24 text-right">Doprava (€)</Label>
                                <Input
                                    type="number"
                                    className="w-32 h-8 text-right"
                                    min="0"
                                    step="0.01"
                                    value={shipping}
                                    onChange={e => setShipping(parseFloat(e.target.value) || 0)}
                                />
                            </div>

                            <div className="flex justify-end gap-8 pt-2 mt-2 border-t border-dashed">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Základ</p>
                                    <p className="font-medium">{subtotal.toFixed(2)} €</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Upravený základ</p>
                                    <p className="font-medium text-foreground">{(subtotal - discount + shipping).toFixed(2)} €</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">DPH (20%)</p>
                                    <p className="font-medium">{taxAmount.toFixed(2)} €</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Spolu s DPH</p>
                                    <p className="text-xl font-bold text-primary">{total.toFixed(2)} €</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Poznámka</Label>
                        <Textarea
                            placeholder="Interná poznámka k ponuke..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Zrušiť
                    </Button>
                    <Button onClick={handleSubmit} disabled={createQuote.isPending}>
                        {createQuote.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Vytváram...
                            </>
                        ) : (
                            'Vytvoriť ponuku'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
