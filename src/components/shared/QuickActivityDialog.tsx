import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateActivity } from '@/hooks/useActivities';
import { toast } from 'sonner';
import type { ActivityType } from '@/types/database';
import { Phone, Mail, StickyNote, Calendar, Loader2 } from 'lucide-react';

interface QuickActivityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entityType: 'lead' | 'client';
    entityId: string;
    entityName?: string;
    defaultType?: ActivityType;
    defaultContact?: {
        email?: string;
        phone?: string;
    };
}

const activityTypeLabels: Record<ActivityType, string> = {
    call: 'Telefonát',
    email: 'Email',
    meeting: 'Stretnutie',
    note: 'Poznámka',
    status_change: 'Zmena statusu',
};

const activityTypeIcons: Record<ActivityType, React.ReactNode> = {
    call: <Phone className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
    note: <StickyNote className="h-4 w-4" />,
    status_change: <StickyNote className="h-4 w-4" />,
};

export function QuickActivityDialog({
    open,
    onOpenChange,
    entityType,
    entityId,
    entityName,
    defaultType = 'note',
    defaultContact,
}: QuickActivityDialogProps) {
    const [activityType, setActivityType] = useState<ActivityType>(defaultType);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const createActivity = useCreateActivity();

    // Reset form when dialog opens/closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset on close
            setTitle('');
            setDescription('');
            setActivityType(defaultType);
        }
        onOpenChange(newOpen);
    };

    // Auto-fill title based on type and contact info
    const getDefaultTitle = (type: ActivityType): string => {
        switch (type) {
            case 'call':
                return defaultContact?.phone
                    ? `Telefonát na ${defaultContact.phone}`
                    : 'Telefonát';
            case 'email':
                return defaultContact?.email
                    ? `Email pre ${defaultContact.email}`
                    : 'Email';
            case 'meeting':
                return 'Stretnutie';
            case 'note':
                return 'Poznámka';
            default:
                return '';
        }
    };

    // Update title when activity type changes
    const handleTypeChange = (type: ActivityType) => {
        setActivityType(type);
        if (!title) {
            setTitle(getDefaultTitle(type));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Zadajte nadpis aktivity');
            return;
        }

        try {
            await createActivity.mutateAsync({
                entity_type: entityType,
                entity_id: entityId,
                activity_type: activityType,
                title: title.trim(),
                description: description.trim() || undefined,
            });

            toast.success('Aktivita bola pridaná', {
                description: `${activityTypeLabels[activityType]} pre ${entityName || 'kontakt'}`,
            });

            handleOpenChange(false);
        } catch (error: any) {
            toast.error('Chyba pri pridávaní aktivity', {
                description: error.message,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Pridať aktivitu</DialogTitle>
                        <DialogDescription>
                            Rýchle zaznamenanie aktivity pre {entityType === 'lead' ? 'lead' : 'klienta'} {entityName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Activity Type */}
                        <div className="space-y-2">
                            <Label htmlFor="activity-type">Typ aktivity</Label>
                            <Select
                                value={activityType}
                                onValueChange={(value) => handleTypeChange(value as ActivityType)}
                            >
                                <SelectTrigger id="activity-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="call">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span>Telefonát</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="email">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            <span>Email</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="meeting">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>Stretnutie</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="note">
                                        <div className="flex items-center gap-2">
                                            <StickyNote className="h-4 w-4" />
                                            <span>Poznámka</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Nadpis *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={getDefaultTitle(activityType)}
                                required
                                autoFocus
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Popis (voliteľné)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Pridajte poznámky alebo detaily..."
                                rows={4}
                                className="resize-none"
                            />
                        </div>

                        {/* Contact info hints */}
                        {(defaultContact?.email || defaultContact?.phone) && (
                            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                                <p className="font-medium text-muted-foreground">Kontaktné údaje:</p>
                                {defaultContact.phone && (
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Phone className="h-3 w-3" />
                                        <a href={`tel:${defaultContact.phone}`} className="hover:underline">
                                            {defaultContact.phone}
                                        </a>
                                    </div>
                                )}
                                {defaultContact.email && (
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Mail className="h-3 w-3" />
                                        <a href={`mailto:${defaultContact.email}`} className="hover:underline">
                                            {defaultContact.email}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={createActivity.isPending}
                        >
                            Zrušiť
                        </Button>
                        <Button type="submit" disabled={createActivity.isPending}>
                            {createActivity.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ukladám...
                                </>
                            ) : (
                                <>
                                    {activityTypeIcons[activityType]}
                                    <span className="ml-2">Pridať</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
