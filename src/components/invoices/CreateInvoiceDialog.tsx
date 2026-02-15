import { useState, useMemo, useEffect } from 'react';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { useInventoryItems } from '@/hooks/useInventory';
import { useQuotes, useQuote } from '@/hooks/useQuotes';
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
import { Plus, Trash2, Loader2, Calculator, FileText, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceItemForm {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    inventory_item_id?: string;
}

export function CreateInvoiceDialog() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'quote' | 'scratch'>('quote');
    const [selectedQuoteId, setSelectedQuoteId] = useState('');
    const [clientId, setClientId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [discount, setDiscount] = useState(0);
    const [shipping, setShipping] = useState(0);
    const [items, setItems] = useState<InvoiceItemForm[]>([]);

    // Item form state
    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('custom');
    const [itemDescription, setItemDescription] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemPrice, setItemPrice] = useState(0);

    const createInvoice = useCreateInvoice();
    const { data: clients = [] } = useClients();
    const { data: inventory = [] } = useInventoryItems();
    const { data: quotes = [] } = useQuotes({ status: 'accepted' });

    // Fetch complete quote details with items when one is selected
    const { data: selectedQuote } = useQuote(selectedQuoteId);

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items]);
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const totalBeforeTax = discountedSubtotal + shipping;
    const taxAmount = totalBeforeTax * 0.2;
    const total = totalBeforeTax + taxAmount;

    // Auto-populate form when complete quote is loaded
    useEffect(() => {
        if (selectedQuote && mode === 'quote') {
            // Set client and notes
            setClientId(selectedQuote.client_id);
            setNotes(selectedQuote.notes || '');
            setDiscount(selectedQuote.discount || 0);
            setShipping(selectedQuote.shipping || 0);

            // Import all quote items
            if (selectedQuote.items && selectedQuote.items.length > 0) {
                const quoteItems: InvoiceItemForm[] = selectedQuote.items.map((item: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    inventory_item_id: item.inventory_item_id,
                }));
                setItems(quoteItems);
            }
        }
    }, [selectedQuote, mode]);

    const handleQuoteSelect = (quoteId: string) => {
        setSelectedQuoteId(quoteId);
        // The useEffect above will handle the data population once quote is fetched
    };

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

        const newItem: InvoiceItemForm = {
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
            await createInvoice.mutateAsync({
                client_id: clientId,
                quote_id: mode === 'quote' && selectedQuoteId ? selectedQuoteId : undefined,
                due_date: dueDate || undefined,
                discount: discount,
                shipping: shipping,
                notes: notes || undefined,
                items: items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    inventory_item_id: i.inventory_item_id,
                })),
            });

            toast.success('Faktúra vytvorená');
            setOpen(false);

            // Reset all state
            setMode('quote');
            setSelectedQuoteId('');
            setClientId('');
            setDueDate('');
            setNotes('');
            setDiscount(0);
            setShipping(0);
            setItems([]);
        } catch (error: any) {
            console.error('Create invoice error:', error);
            toast.error(error.message || 'Nepodarilo sa vytvoriť faktúru');
            if (error.details) {
                toast.error(error.details);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gradient-primary shadow-glow hover:shadow-lg transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Nová faktúra
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Vytvoriť novú faktúru</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Mode Selection */}
                    <div className="flex gap-2 p-1 bg-muted rounded-lg">
                        <Button
                            type="button"
                            variant={mode === 'quote' ? 'default' : 'ghost'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setMode('quote')}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Z ponuky
                        </Button>
                        <Button
                            type="button"
                            variant={mode === 'scratch' ? 'default' : 'ghost'}
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                                setMode('scratch');
                                setSelectedQuoteId('');
                            }}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Od začiatku
                        </Button>
                    </div>

                    {/* Quote Selection (visible only in quote mode) */}
                    {mode === 'quote' && (
                        <div className="space-y-2">
                            <Label>Vyberte ponuku *</Label>
                            <Select value={selectedQuoteId} onValueChange={handleQuoteSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Vyberte akceptovanú ponuku" />
                                </SelectTrigger>
                                <SelectContent>
                                    {quotes.map(quote => (
                                        <SelectItem key={quote.id} value={quote.id}>
                                            {quote.quote_number} - {quote.client?.contact_name} ({quote.total.toFixed(2)} €)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {quotes.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Žiadne akceptované ponuky. Akceptujte ponuku alebo vytvorte faktúru od začiatku.
                                </p>
                            )}
                        </div>
                    )}
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
                            <Label>Splatnosť</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center gap-2 font-medium">
                            <Calculator className="h-4 w-4" />
                            Položky faktúry
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

                        {/* Totals */}
                        <div className="flex justify-end gap-8 pt-4 border-t">
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Základ (bez DPH)</p>
                                <p className="font-medium">{subtotal.toFixed(2)} €</p>
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

                    <div className="space-y-2">
                        <Label>Poznámka</Label>
                        <Textarea
                            placeholder="Interná poznámka k faktúre..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Zrušiť
                    </Button>
                    <Button onClick={handleSubmit} disabled={createInvoice.isPending}>
                        {createInvoice.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Vytváram...
                            </>
                        ) : (
                            'Vytvoriť faktúru'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
