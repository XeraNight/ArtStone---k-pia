import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAllUsers } from '@/hooks/useSalespeople';
import { useUpdateDocument } from '@/hooks/useDocuments';
import type { Document, AppRole } from '@/types/database';
import { toast } from 'sonner';
import { Loader2, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentAccessDialogProps {
    document: Document | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ROLES: { id: AppRole; label: string }[] = [
    { id: 'admin', label: 'Admin' },
    { id: 'manager', label: 'Manažér' },
    { id: 'sales', label: 'Obchodník' },
];

export function DocumentAccessDialog({
    document,
    open,
    onOpenChange,
}: DocumentAccessDialogProps) {
    const { data: users, isLoading: isLoadingUsers } = useAllUsers();
    const updateDocument = useUpdateDocument();

    // State for permissions
    const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [accessType, setAccessType] = useState<'roles' | 'users'>('roles');

    // Initialize state when document opens
    useEffect(() => {
        if (document && open) {
            setSelectedRoles(document.allowed_roles || []);
            setSelectedUserIds(document.allowed_user_ids || []);

            // Determine initial tab based on existing permissions
            if (document.allowed_user_ids && document.allowed_user_ids.length > 0) {
                setAccessType('users');
            } else {
                setAccessType('roles');
            }
        }
    }, [document, open]);

    const handleSave = async () => {
        if (!document) return;

        try {
            await updateDocument.mutateAsync({
                id: document.id,
                allowed_roles: selectedRoles,
                allowed_user_ids: selectedUserIds,
            });
            toast.success('Prístup k dokumentu bol aktualizovaný');
            onOpenChange(false);
        } catch (error) {
            toast.error('Nepodarilo sa aktualizovať prístup');
            console.error(error);
        }
    };

    const toggleRole = (role: AppRole) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    if (!document) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Upraviť prístup</DialogTitle>
                    <DialogDescription>
                        Nastavte, kto môže vidieť dokument "{document.title}".
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={accessType} onValueChange={(v) => setAccessType(v as 'roles' | 'users')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="roles" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Podľa rolí
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Konkrétni ľudia
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 min-h-[300px]">
                        <TabsContent value="roles" className="space-y-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                Vyberte roly, ktoré budú mať prístup k tomuto dokumentu.
                                Admini majú prístup vždy.
                            </div>
                            <div className="space-y-2">
                                {ROLES.map((role) => (
                                    <div
                                        key={role.id}
                                        className={cn(
                                            "flex items-center space-x-3 p-3 border rounded-lg transition-colors",
                                            role.id === 'admin' ? "bg-muted/50 opacity-70" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={role.id === 'admin' ? true : selectedRoles.includes(role.id)}
                                            onCheckedChange={() => role.id !== 'admin' && toggleRole(role.id)}
                                            disabled={role.id === 'admin'}
                                        />
                                        <Label
                                            htmlFor={`role-${role.id}`}
                                            className={cn(
                                                "flex-1 font-medium",
                                                role.id === 'admin' ? "cursor-not-allowed line-through text-muted-foreground" : "cursor-pointer"
                                            )}
                                        >
                                            {role.label}
                                        </Label>
                                        {role.id === 'admin' && (
                                            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-muted-foreground/30">Admin</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="users">
                            <div className="text-sm text-muted-foreground mb-4">
                                Vyberte konkrétnych používateľov, ktorí uvidia tento dokument
                                bez ohľadu na ich rolu.
                            </div>

                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-2">
                                        {users?.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <Checkbox
                                                    id={`user-${user.id}`}
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onCheckedChange={() => toggleUser(user.id)}
                                                />
                                                <div className="flex flex-col flex-1">
                                                    <Label
                                                        htmlFor={`user-${user.id}`}
                                                        className="cursor-pointer font-medium"
                                                    >
                                                        {user.full_name || 'Neznámy používateľ'}
                                                    </Label>
                                                    <span className="text-xs text-muted-foreground">
                                                        {user.email} • {
                                                            ROLES.find(r => r.id === user.role)?.label || user.role
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Zrušiť
                    </Button>
                    <Button onClick={handleSave} disabled={updateDocument.isPending}>
                        {updateDocument.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Uložiť zmeny
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
