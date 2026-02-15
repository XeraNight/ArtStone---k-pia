import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateInventoryItemDialog } from '@/components/inventory/CreateInventoryItemDialog';
import { EditInventoryItemDialog } from '@/components/inventory/EditInventoryItemDialog';
import { InventoryReservationsDialog } from '@/components/inventory/InventoryReservationsDialog';
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog';
import { DeleteInventoryItemDialog } from '@/components/inventory/DeleteInventoryItemDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Package, AlertTriangle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useInventoryItems, useInventoryCategories, useDeleteInventoryItem, useAdjustStock } from '@/hooks/useInventory';
import { toast } from 'sonner';
import type { InventoryItem } from '@/types/database';

export default function Inventory() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [reservationsItem, setReservationsItem] = useState<InventoryItem | null>(null);
  const [adjustStockItem, setAdjustStockItem] = useState<InventoryItem | null>(null);
  const [deleteItemToConfirm, setDeleteItemToConfirm] = useState<InventoryItem | null>(null);
  const [affectedQuotes, setAffectedQuotes] = useState<string[]>([]);
  const [affectedInvoices, setAffectedInvoices] = useState<string[]>([]);

  const { data: categories, isLoading: categoriesLoading } = useInventoryCategories();
  const { data: items, isLoading: itemsLoading } = useInventoryItems({
    categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchQuery || undefined,
  });
  const deleteItemMutation = useDeleteInventoryItem();
  const adjustStock = useAdjustStock();

  const isAdmin = user?.role === 'admin';
  const isLoading = categoriesLoading || itemsLoading;

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const getStockStatus = (item: InventoryItem) => {
    const available = item.qty_available - item.qty_reserved;
    if (available <= 0) return 'out';
    if (available < item.min_stock) return 'low';
    return 'ok';
  };

  const lowStockItems = items?.filter(
    (item) => getStockStatus(item) === 'low' || getStockStatus(item) === 'out'
  ) || [];

  const totalValue = items?.reduce(
    (acc, item) => acc + item.qty_available * (item.sale_price || 0),
    0
  ) || 0;

  const totalReserved = items?.reduce((acc, i) => acc + i.qty_reserved, 0) || 0;

  const handleDeleteClick = async (item: InventoryItem) => {
    // First check for references without actually deleting
    try {
      // Query for references instead of attempting delete
      const { data: quoteRefs, error: quoteError } = await supabase
        .from('quote_items')
        .select('quote_id')
        .eq('inventory_item_id', item.id);

      const { data: invoiceRefs, error: invoiceError } = await supabase
        .from('invoice_items')
        .select('invoice_id')
        .eq('inventory_item_id', item.id);

      if (quoteError || invoiceError) {
        throw new Error('Nepodarilo sa skontrolovať referencie');
      }

      // Get unique quote and invoice IDs
      const affectedQuoteIds: string[] = [...new Set((quoteRefs || []).map(r => r.quote_id as string))];
      const affectedInvoiceIds: string[] = [...new Set((invoiceRefs || []).map(r => r.invoice_id as string))];

      // Always show dialog, with or without references
      setDeleteItemToConfirm(item);
      setAffectedQuotes(affectedQuoteIds);
      setAffectedInvoices(affectedInvoiceIds);
    } catch (error: any) {
      console.error('Delete check error:', error);
      toast.error('Nepodarilo sa skontrolovať možnosť vymazania');
    }
  };

  const handleDeleteConfirm = async (forceDelete: boolean) => {
    if (!deleteItemToConfirm) return;

    try {
      await deleteItemMutation.mutateAsync({
        id: deleteItemToConfirm.id,
        forceDelete
      });
      toast.success('Položka vymazaná');
      setDeleteItemToConfirm(null);
      setAffectedQuotes([]);
      setAffectedInvoices([]);
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error?.message || 'Nepodarilo sa vymazať položku';
      toast.error(errorMessage);
    }
  };

  const handleAdjustStockInstead = () => {
    if (deleteItemToConfirm) {
      setAdjustStockItem(deleteItemToConfirm);
      setDeleteItemToConfirm(null);
      setAffectedQuotes([]);
      setAffectedInvoices([]);
    }
  };

  const handleAddStock = (item: InventoryItem) => {
    setAdjustStockItem(item);
  };

  return (
    <AppLayout title="Sklad">
      <div className="space-y-6 animate-fade-in">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hľadať podľa názvu, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Kategória" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(isAdmin || user?.role === 'manager') && <CreateInventoryItemDialog />}
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Položky na sklade</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold">{items?.length || 0}</p>
                  )}
                </div>
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Hodnota skladu</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Rezervované</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold">{totalReserved} ks</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className={`shadow-soft ${lowStockItems.length > 0 ? 'border-warning' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nízke zásoby</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-warning">{lowStockItems.length}</p>
                  )}
                </div>
                {lowStockItems.length > 0 && (
                  <AlertTriangle className="h-8 w-8 text-warning" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory table */}
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Položka</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kategória</TableHead>
                  <TableHead className="text-center">Dostupné</TableHead>
                  <TableHead className="text-center">Rezervované</TableHead>
                  <TableHead className="text-right">Predajná cena</TableHead>
                  <TableHead>Stav zásob</TableHead>
                  {(isAdmin || user?.role === 'manager') && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      {(isAdmin || user?.role === 'manager') && <TableCell><Skeleton className="h-5 w-8" /></TableCell>}
                    </TableRow>
                  ))
                ) : items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={(isAdmin || user?.role === 'manager') ? 8 : 7} className="p-0">
                      <EmptyState
                        icon={<Package className="h-full w-full" />}
                        title="Sklad je prázdny"
                        description="Pridajte produkty a materiály do skladu pre lepšiu evidenciu."
                        action={{
                          label: "Pridať položku",
                          onClick: () => setCreateDialogOpen(true),
                          icon: <Plus className="h-4 w-4" />,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items?.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const available = item.qty_available - item.qty_reserved;
                    const stockPercent = Math.min(100, (available / item.min_stock) * 100);

                    return (
                      <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <span className="font-medium text-foreground">{item.name}</span>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {item.sku}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category?.name || '-'}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {item.qty_available} ks
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {item.qty_reserved} ks
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.sale_price)}
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-xs font-medium ${stockStatus === 'out'
                                  ? 'text-destructive'
                                  : stockStatus === 'low'
                                    ? 'text-warning'
                                    : 'text-success'
                                  }`}
                              >
                                {stockStatus === 'out'
                                  ? 'Vypredané'
                                  : stockStatus === 'low'
                                    ? 'Nízke'
                                    : 'OK'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {available} ks
                              </span>
                            </div>
                            <Progress
                              value={stockPercent}
                              className={`h-1.5 ${stockStatus === 'out'
                                ? '[&>div]:bg-destructive'
                                : stockStatus === 'low'
                                  ? '[&>div]:bg-warning'
                                  : '[&>div]:bg-success'
                                }`}
                            />
                          </div>
                        </TableCell>
                        {(isAdmin || user?.role === 'manager') && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditItem(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Upraviť
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddStock(item)}>
                                  Pridať zásoby
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setReservationsItem(item)}>Zobraziť rezervácie</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(item)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Vymazať
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <EditInventoryItemDialog
          item={editItem}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
        />
        <InventoryReservationsDialog
          item={reservationsItem}
          open={!!reservationsItem}
          onOpenChange={(open) => !open && setReservationsItem(null)}
        />
        <AdjustStockDialog
          open={!!adjustStockItem}
          onOpenChange={(open) => !open && setAdjustStockItem(null)}
          itemId={adjustStockItem?.id || ''}
          itemName={adjustStockItem?.name || ''}
          currentStock={adjustStockItem?.qty_available || 0}
        />
        <DeleteInventoryItemDialog
          open={!!deleteItemToConfirm}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteItemToConfirm(null);
              setAffectedQuotes([]);
              setAffectedInvoices([]);
            }
          }}
          itemName={deleteItemToConfirm?.name || ''}
          affectedQuotes={affectedQuotes}
          affectedInvoices={affectedInvoices}
          onConfirm={handleDeleteConfirm}
          onAdjustStockInstead={handleAdjustStockInstead}
          isDeleting={deleteItemMutation.isPending}
        />
      </div>
    </AppLayout>
  );
}
