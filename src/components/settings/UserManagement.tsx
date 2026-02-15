import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAllUsers } from '@/hooks/useSalespeople';
import { useRegions } from '@/hooks/useRegions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';
import { UserPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const roleLabels: Record<AppRole, string> = {
    admin: 'Administrátor',
    manager: 'Manažér',
    sales: 'Obchodník',
};

export function UserManagement() {
    const { data: allUsers, isLoading: usersLoading } = useAllUsers();
    const { data: regions } = useRegions();
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState<AppRole>('sales');
    const [newRegion, setNewRegion] = useState<string | undefined>(undefined);
    const [saving, setSaving] = useState(false);

    // Create user state
    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createFullName, setCreateFullName] = useState('');
    const [createRole, setCreateRole] = useState<AppRole>('sales');
    const [createRegion, setCreateRegion] = useState<string | undefined>(undefined);
    const [creating, setCreating] = useState(false);

    // Debug: Log when dialog state changes
    useEffect(() => {
        console.log('Dialog open state changed:', dialogOpen);
        console.log('Selected user:', selectedUser);
    }, [dialogOpen, selectedUser]);

    const handleEditClick = (user: any) => {
        console.log('=== EDIT BUTTON CLICKED ===');
        console.log('User data:', user);
        console.log('Current dialogOpen:', dialogOpen);

        setSelectedUser(user);
        setNewRole(user.role as AppRole);
        setNewRegion(user.region_id || undefined);

        // Use setTimeout to ensure state is set before opening dialog
        setTimeout(() => {
            setDialogOpen(true);
            console.log('Dialog opened');
        }, 0);
    };

    const handleSave = async () => {
        if (!selectedUser) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: newRole,
                    region_id: newRegion || null,
                })
                .eq('id', selectedUser.id);

            if (error) throw error;

            toast.success('Používateľ bol aktualizovaný');
            setDialogOpen(false);

            // Refresh data without full page reload
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                queryClient.invalidateQueries({ queryKey: ['salespeople'] });
            }, 500);
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Nepodarilo sa aktualizovať používateľa');
        } finally {
            setSaving(false);
        }
    };

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
            // Store current admin session before creating new user
            const { data: { session: adminSession } } = await supabase.auth.getSession();

            // Create user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: createEmail,
                password: createPassword,
                options: {
                    emailRedirectTo: `${window.location.origin}/`,
                    data: {
                        full_name: createFullName,
                        role: createRole,
                        region_id: createRegion || null,
                    },
                },
            });

            if (authError) throw authError;

            // Update profile with additional data
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        email: createEmail,
                        full_name: createFullName,
                        role: createRole,
                        region_id: createRegion || null,
                        updated_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.error('Profile update error:', profileError);
                    // Don't throw, user was created successfully
                }
            }

            // IMPORTANT: Sign out the newly created user and restore admin session
            await supabase.auth.signOut();

            // Restore the admin session
            if (adminSession) {
                await supabase.auth.setSession({
                    access_token: adminSession.access_token,
                    refresh_token: adminSession.refresh_token,
                });
            }

            toast.success('Nový používateľ bol úspešne vytvorený');
            setCreateDialogOpen(false);
            setCreateEmail('');
            setCreatePassword('');
            setCreateFullName('');
            setCreateRole('sales');
            setCreateRegion(undefined);

            // Refresh data without full page reload
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                queryClient.invalidateQueries({ queryKey: ['salespeople'] });
            }, 1000);
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Nepodarilo sa vytvoriť používateľa');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <Card className="shadow-soft">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-display">Správa používateľov</CardTitle>
                            <CardDescription>
                                Zoznam všetkých registrovaných používateľov
                            </CardDescription>
                        </div>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Pridať obchodníka
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {usersLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : !allUsers || allUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Žiadni používatelia
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allUsers.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{u.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{u.email}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-right">
                                            <p className="text-muted-foreground">Rola:</p>
                                            <p className="font-medium">{roleLabels[u.role as AppRole] || u.role}</p>
                                        </div>
                                        <div className="text-sm text-right">
                                            <p className="text-muted-foreground">Región:</p>
                                            <p className="font-medium">
                                                {u.region_id
                                                    ? regions?.find((r) => r.id === u.region_id)?.name || '—'
                                                    : '—'}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(u)}>
                                            Upraviť
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog key={selectedUser?.id || 'edit'} open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upraviť používateľa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                {selectedUser?.full_name || 'Načítavam...'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {selectedUser?.email || ''}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Rola</Label>
                            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                                <SelectTrigger id="role">
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
                            <Label htmlFor="region">Región</Label>
                            <Select value={newRegion || 'none'} onValueChange={(value) => setNewRegion(value === 'none' ? undefined : value)}>
                                <SelectTrigger id="region">
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
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                            Zrušiť
                        </Button>
                        <Button onClick={handleSave} disabled={!selectedUser || saving}>
                            {saving ? 'Ukladám...' : 'Uložiť'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create User Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pridať nového používateľa</DialogTitle>
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
        </>
    );
}
