import { useState, useEffect, useMemo } from 'react';
import { useUpdateInvoice } from '@/hooks/useInvoices';
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
import { Plus, Trash2, Loader2, Calculator, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import type { Invoice, InvoiceStatus } from '@/types/database';

interface InvoiceItemForm {
    id: string; // internal random id for UI key
    db_id?: string; // actual DB id if exists
    description: string;
    quantity: number;
    unit_price: number;
    inventory_item_id?: string;
}

interface EditInvoiceDialogProps {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<InvoiceStatus, string> = {
    draft: 'Návrh',
    sent: 'Odoslaná',
    paid: 'Zaplatená',
    overdue: 'Po splatnosti',
    cancelled: 'Zrušená',
};

export function EditInvoiceDialog({ invoice, open, onOpenChange }: EditInvoiceDialogProps) {
    const [clientId, setClientId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<InvoiceStatus>('draft');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<InvoiceItemForm[]>([]);

    // Item form state
    const [selectedInventoryId, setSelectedInventoryId] = useState<string>('custom');
    const [itemDescription, setItemDescription] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemPrice, setItemPrice] = useState(0);

    const updateInvoice = useUpdateInvoice();
    const { data: clients = [] } = useClients();
    const { data: inventory = [] } = useInventoryItems();

    useEffect(() => {
        if (invoice && open) {
            setClientId(invoice.client_id);
            setDueDate(invoice.due_date || '');
            setStatus(invoice.status);
            setNotes(invoice.notes || '');

            // Map existing items
            if (invoice.items) {
                setItems(invoice.items.map(i => ({
                    id: Math.random().toString(36).substr(2, 9),
                    db_id: i.id,
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    inventory_item_id: i.inventory_item_id,
                })));
            } else {
                setItems([]);
            }
        }
    }, [invoice, open]);


    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items]);
    const taxAmount = subtotal * 0.2;
    const total = subtotal + taxAmount;

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
        if (!invoice) return;
        if (!clientId) {
            toast.error('Vyberte klienta');
            return;
        }
        if (items.length === 0) {
            toast.error('Pridajte aspoň jednu položku');
            return;
        }

        try {
            await updateInvoice.mutateAsync({
                id: invoice.id,
                client_id: clientId,
                due_date: dueDate || undefined,
                status: status,
                notes: notes || undefined,
                items: items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    inventory_item_id: i.inventory_item_id,
                })),
            });

            toast.success('Faktúra bola aktualizovaná');
            onOpenChange(false);
        } catch (error: any) {
            console.error('Update invoice error:', error);
            toast.error(error.message || 'Nepodarilo sa aktualizovať faktúru');
        }
    };

    if (!invoice && open) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex flex-col items-center justify-center h-40 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Načítavam detaily faktúry...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detail faktúry {invoice?.invoice_number}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* General Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Klient</Label>
                            <Select value={clientId} onValueChange={setClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Vyberte klienta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.contact_name}
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
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v: InvoiceStatus) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center gap-2 font-medium">
                            <Calculator className="h-4 w-4" />
                            Položky faktúry
                        </div>

                        <div className="rounded-md border bg-card">
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
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                Žiadne položky
                                            </TableCell>
                                        </TableRow>
                                    )}
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
                        </div>

                        {/* Add Item Form */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-card p-3 rounded border">
                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-xs">Sklad</Label>
                                <Select value={selectedInventoryId} onValueChange={handleInventorySelect}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Vlastná položka" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom">Vlastná položka</SelectItem>
                                        {inventory.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <Label className="text-xs">Popis</Label>
                                <Input className="h-8" value={itemDescription} onChange={e => setItemDescription(e.target.value)} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs">Počet</Label>
                                <Input type="number" className="h-8" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs">Cena (€)</Label>
                                <Input type="number" className="h-8" value={itemPrice} onChange={e => setItemPrice(Number(e.target.value))} />
                            </div>
                            <div className="md:col-span-1">
                                <Button size="sm" className="w-full h-8" onClick={handleAddItem}><Plus className="h-4 w-4" /></Button>
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
                        <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <div className="flex-1 flex justify-start">
                        <Button variant="secondary" onClick={() => {
                            try {
                                if (!invoice) {
                                    toast.error("Chýbajú dáta faktúry");
                                    return;
                                }
                                // ensure we use current buffer items if needed, but generator uses invoice object
                                // Ideally generator should take 'items' from state to reflect unsaved changes?
                                // For now let's pass the ORIGINAL invoice object but maybe map items?
                                // The user expects to export what is on DB or what is in form? Usually saved state.
                                // Let's pass the prop invoice for now.
                                generateInvoicePDF(invoice);
                                toast.success("PDF sa generuje...");
                            } catch (e: any) {
                                console.error("PDF generation failed:", e);
                                toast.error("Chyba pri generovaní PDF: " + e.message);
                            }
                        }}>
                            <Download className="h-4 w-4 mr-2" />
                            Stiahnuť PDF
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
                    <Button onClick={handleSubmit} disabled={updateInvoice.isPending}>
                        {updateInvoice.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Uložiť zmeny'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
