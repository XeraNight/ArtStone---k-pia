import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Building2,
  Users,
  MapPin,
  Bell,
  Database,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  UserCog,
} from 'lucide-react';
import { useRegions } from '@/hooks/useRegions';
import { useAllUsers } from '@/hooks/useSalespeople';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserManagement } from '@/components/settings/UserManagement';

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  manager: 'Manažér',
  sales: 'Obchodník',
};

export default function Settings() {
  const { user, deleteAccount, refreshUser } = useAuth();
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newRole, setNewRole] = useState<AppRole>('sales');
  const [selectedUserRegion, setSelectedUserRegion] = useState<string>('');

  // Profile state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(''); // Need to fetch phone from profile if available, for now empty
  const [profileRegion, setProfileRegion] = useState(user?.regionId || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  // When user is selected, load their current role and region
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedPerson = allUsers?.find(u => u.id === userId);
    if (selectedPerson) {
      setNewRole(selectedPerson.role as AppRole);
      setSelectedUserRegion(selectedPerson.region_id || '');
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUserId || !newRole) {
      toast.error('Vyberte používateľa a rolu');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          region_id: selectedUserRegion || null
        })
        .eq('id', selectedUserId);

      if (error) throw error;
      toast.success('Používateľ bol aktualizovaný');
      setSelectedUserId('');
      setSelectedUserRegion('');

      // Refresh salespeople data
      window.location.reload();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Nepodarilo sa aktualizovať používateľa');
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    // Require region selection
    if (!profileRegion && user.role !== 'admin') {
      toast.error('Prosím, vyberte región');
      return;
    }

    try {
      const updates: any = {
        full_name: profileName,
        updated_at: new Date().toISOString(),
        region_id: profileRegion || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil bol úspešne aktualizovaný');
      // Refresh user context to update region name immediately
      await refreshUser();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Nepodarilo sa aktualizovať profil: ' + (error.message || 'Neznáma chyba'));
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error('Zadajte nové heslo');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success('Heslo bolo úspešne zmenené');
      setNewPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Nepodarilo sa zmeniť heslo');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleteLoading(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        toast.error(error);
      } else {
        toast.success('Váš účet bol úspešne zmazaný');
        // Redirect handled by AuthContext logout (state change)
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Nepodarilo sa zmazať účet');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppLayout title="Nastavenia">
      <div className="space-y-6 animate-fade-in">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="profile">
              <UserCog className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="company">
                  <Building2 className="h-4 w-4 mr-2" />
                  Firma
                </TabsTrigger>
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Používatelia
                </TabsTrigger>
                <TabsTrigger value="regions">
                  <MapPin className="h-4 w-4 mr-2" />
                  Regióny
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifikácie
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6"> {/* Wrapped in space-y-6 for vertical spacing */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Osobné údaje</CardTitle>
                    <CardDescription>
                      Spravujte svoje osobné informácie a nastavenia
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Meno a priezvisko</Label>
                      <Input
                        id="name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rola</Label>
                      <Input
                        id="role"
                        value={user?.role ? roleLabels[user.role] : ''}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Región</Label>
                      <Select
                        value={profileRegion}
                        onValueChange={setProfileRegion}
                        disabled={user?.role !== 'admin' && !!user?.regionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte región" />
                        </SelectTrigger>
                        <SelectContent>
                          {regionsLoading ? (
                            <div className="p-2">Načítavam...</div>
                          ) : (
                            regions?.map((region) => (
                              <SelectItem key={region.id} value={region.id}>
                                {region.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {user?.role !== 'admin' && (
                        <p className="text-xs text-muted-foreground">
                          Pre zmenu regiónu kontaktujte administrátora
                        </p>
                      )}
                    </div>
                    <Button onClick={handleProfileUpdate} className="w-full">
                      Uložiť zmeny
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Zmena hesla</CardTitle>
                    <CardDescription>
                      Zabezpečte svoj účet silným heslom
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Aktuálne heslo</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nové heslo</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Požiadavky na heslo:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                        <li>Minimálne 8 znakov</li>
                        <li>Aspoň jedno veľké písmeno</li>
                        <li>Aspoň jedno číslo</li>
                      </ul>
                    </div>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading || !newPassword}
                      className="w-full"
                    >
                      {passwordLoading ? 'Mením heslo...' : 'Zmeniť heslo'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Danger Zone */}
              <Card className="shadow-soft border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="font-display text-destructive flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Nebezpečná zóna
                  </CardTitle>
                  <CardDescription>
                    Tieto akcie sú nevratné. Zmazaním účtu prídete o všetky údaje.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        Zmazať môj účet
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ste si absolútne istý?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Táto akcia sa nedá vrátiť späť. Toto natrvalo zmaže váš účet
                          a odstráni vaše údaje z našich serverov.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Zrušiť</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteUser}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? 'Mažem...' : 'Áno, zmazať účet'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {isAdmin && (
            <>
              <TabsContent value="company">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Firemné údaje</CardTitle>
                    <CardDescription>
                      Základné informácie o vašej spoločnosti
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Názov spoločnosti</Label>
                        <Input id="companyName" defaultValue="ArtStone s.r.o." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ico">IČO</Label>
                        <Input id="ico" defaultValue="12345678" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dic">DIČ</Label>
                        <Input id="dic" defaultValue="2012345678" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icDph">IČ DPH</Label>
                        <Input id="icDph" defaultValue="SK2012345678" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Adresa</Label>
                        <Input id="address" defaultValue="Hlavná 123, 811 01 Bratislava" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefón</Label>
                        <Input id="phone" defaultValue="+421 2 1234 5678" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue="info@artstone.sk" />
                      </div>
                    </div>
                    <Separator />
                    <Button>Uložiť zmeny</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <UserManagement />
              </TabsContent>


              <TabsContent value="regions">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Regióny</CardTitle>
                    <CardDescription>
                      Definujte regióny pre segmentáciu dát
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {regionsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-8 w-16" />
                          </div>
                        ))
                      ) : (
                        regions?.map((region) => (
                          <div
                            key={region.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{region.name}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              Upraviť
                            </Button>
                          </div>
                        ))
                      )}
                      <Button variant="outline" className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        Pridať región
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Notifikácie</CardTitle>
                    <CardDescription>
                      Nastavte emailové a systémové notifikácie
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">Nový lead</p>
                          <p className="text-sm text-muted-foreground">
                            Notifikácia pri prijatí nového leadu
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">Prijatá ponuka</p>
                          <p className="text-sm text-muted-foreground">
                            Notifikácia pri prijatí cenovej ponuky
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">Nízke zásoby</p>
                          <p className="text-sm text-muted-foreground">
                            Upozornenie pri nízkych zásobách na sklade
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">Faktúra po splatnosti</p>
                          <p className="text-sm text-muted-foreground">
                            Upozornenie na nezaplatené faktúry
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations">
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="font-display">Integrácie</CardTitle>
                    <CardDescription>
                      Pripojte externé služby pre automatický import leadov
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <svg
                              className="h-6 w-6 text-blue-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Facebook Lead Ads</p>
                            <p className="text-sm text-muted-foreground">
                              Automatický import leadov z Facebook reklám
                            </p>
                          </div>
                        </div>
                        <Button variant="outline">Pripojiť</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-red-500/10 rounded-lg">
                            <svg
                              className="h-6 w-6 text-red-500"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Google Ads</p>
                            <p className="text-sm text-muted-foreground">
                              Import konverzií z Google Ads kampaní
                            </p>
                          </div>
                        </div>
                        <Button variant="outline">Pripojiť</Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-success/50 bg-success/5 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-success/10 rounded-lg">
                            <SettingsIcon className="h-6 w-6 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">Webový formulár</p>
                            <p className="text-sm text-muted-foreground">
                              Webhook pre príjem leadov z webstránky
                            </p>
                          </div>
                        </div>
                        <Button variant="secondary">Aktívne</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </AppLayout >
  );
}
