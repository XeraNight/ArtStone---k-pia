import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Mail, Phone, Users, FileText, TrendingUp, MoreHorizontal, UserPlus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useSalespeople } from '@/hooks/useSalespeople';
import { useRegions } from '@/hooks/useRegions';
import { SalespersonProfileDialog } from '@/components/salespeople/SalespersonProfileDialog';
import { SalespersonLeadsDialog } from '@/components/salespeople/SalespersonLeadsDialog';
import { SalespersonClientsDialog } from '@/components/salespeople/SalespersonClientsDialog';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrátor',
  manager: 'Manažér',
  sales: 'Obchodník',
};

export default function Salespeople() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [leadsOpen, setLeadsOpen] = useState(false);
  const [clientsOpen, setClientsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Create user state
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<AppRole>('sales');
  const [createRegion, setCreateRegion] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (user?.role === 'sales') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: salespeople, isLoading } = useSalespeople();
  const { data: regions } = useRegions();

  const isAdmin = user?.role === 'admin';
  const filteredSalespeople = isAdmin
    ? salespeople
    : salespeople?.filter((sp) => sp.region_id === user?.regionId);

  const avgConversion = filteredSalespeople?.length
    ? Math.round(
      filteredSalespeople.reduce((acc, sp) => acc + ((sp.stats as any)?.conversionRate || 0), 0) /
      filteredSalespeople.length
    )
    : 0;

  const totalQuotes = filteredSalespeople?.reduce((acc, sp) => acc + (sp.stats?.quotes || 0), 0) || 0;
  const totalClients = filteredSalespeople?.reduce((acc, sp) => acc + (sp.stats?.clients || 0), 0) || 0;

  const handleCreateUser = async () => {
    if (!createEmail || !createPassword || !createFullName) {
      toast.error('Vyplňte všetky povinné polia');
      return;
    }

    if (createPassword.length < 6) {
      toast.error('Heslo musí mať aspoň 6 znakov');
      return;
    }

    setCreating(true);
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Nie ste prihlásený');
        return;
      }

      // Call Edge Function to create user (doesn't affect current session)
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: createEmail,
          password: createPassword,
          full_name: createFullName,
          role: createRole,
          region_id: createRegion || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Nový používateľ bol úspešne vytvorený');
      setCreateDialogOpen(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateFullName('');
      setCreateRole('sales');
      setCreateRegion(undefined);

      // Refresh salespeople data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['salespeople'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      }, 500);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Nepodarilo sa vytvoriť používateľa');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      // Call RPC function to delete user from both profiles and auth.users
      const { error } = await supabase.rpc('delete_user_by_id', {
        user_id_to_delete: userToDelete.id
      });

      if (error) throw error;

      toast.success('Používateľ bol úspešne odstránený');
      setDeleteDialogOpen(false);
      setUserToDelete(null);

      // Refresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['salespeople'] });
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      }, 500);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Nepodarilo sa odstrániť používateľa');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Obchodníci">
      <div className="space-y-6 animate-fade-in">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-semibold tracking-tight">Tím obchodníkov</h2>
            <p className="text-muted-foreground mt-1">Prehľad výkonnosti a aktivít</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Pridať obchodníka
            </Button>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Celkom obchodníkov</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold">{filteredSalespeople?.length || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priemerná konverzia</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold">{avgConversion}%</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-info/10">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aktívne ponuky</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold">{totalQuotes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Celkom klientov</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold">{totalClients}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salespeople grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-soft">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSalespeople?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Žiadni obchodníci</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSalespeople?.map((person) => (
              <Card key={person.id} className="shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {person.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${person.is_active ? 'bg-success' : 'bg-muted-foreground'
                            }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{person.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{person.region?.name || 'Neurčený'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedPerson(person);
                          setProfileOpen(true);
                        }}>
                          Zobraziť profil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedPerson(person);
                          setLeadsOpen(true);
                        }}>
                          Zobraziť leady
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedPerson(person);
                          setClientsOpen(true);
                        }}>
                          Zobraziť klientov
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToDelete(person);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Odstrániť
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{person.email}</span>
                    </div>
                    {person.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{person.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 py-4 border-y border-border">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{person.stats?.leads || 0}</p>
                      <p className="text-xs text-muted-foreground">Leady</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{person.stats?.clients || 0}</p>
                      <p className="text-xs text-muted-foreground">Klienti</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{person.stats?.quotes || 0}</p>
                      <p className="text-xs text-muted-foreground">Ponuky</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Plnenie cieľa</span>
                      <span className="text-sm font-medium">{(person.stats as any)?.targetProgress || 0}%</span>
                    </div>
                    <Progress value={(person.stats as any)?.targetProgress || 0} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <Badge
                      variant={person.is_active ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {person.is_active ? 'Aktívny' : 'Neaktívny'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Konverzia: {(person.stats as any)?.conversionRate || 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SalespersonProfileDialog
        salesperson={selectedPerson}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      <SalespersonLeadsDialog
        salespersonId={selectedPerson?.id || null}
        salespersonName={selectedPerson?.full_name || ''}
        open={leadsOpen}
        onOpenChange={setLeadsOpen}
      />

      <SalespersonClientsDialog
        salespersonId={selectedPerson?.id || null}
        salespersonName={selectedPerson?.full_name || ''}
        open={clientsOpen}
        onOpenChange={setClientsOpen}
      />

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pridať nového obchodníka</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-fullname">Meno a priezvisko *</Label>
              <Input
                id="create-fullname"
                value={createFullName}
                onChange={(e) => setCreateFullName(e.target.value)}
                placeholder="Jan Novák"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="jan.novak@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Heslo *</Label>
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Min. 6 znakov"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Rola</Label>
              <Select value={createRole} onValueChange={(v) => setCreateRole(v as AppRole)}>
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-region">Región</Label>
              <Select value={createRegion || 'none'} onValueChange={(value) => setCreateRegion(value === 'none' ? undefined : value)}>
                <SelectTrigger id="create-region">
                  <SelectValue placeholder="Vyberte región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Žiadny región</SelectItem>
                  {regions?.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Zrušiť
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? 'Vytváram...' : 'Vytvoriť používateľa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ste si istý?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chcete odstrániť používateľa <strong>{userToDelete?.full_name}</strong>? Táto akcia je nevratná a odstráni všetky dáta spojené s týmto používateľom.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Zrušiť</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Odstraňujem...' : 'Odstrániť'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
