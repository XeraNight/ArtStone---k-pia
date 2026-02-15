import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useUnreadCount, useMarkAllAsRead } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { useState } from 'react';

export function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const { data: notifications = [], isLoading } = useNotifications();
    const { data: unreadCount = 0 } = useUnreadCount();
    const markAllAsRead = useMarkAllAsRead();

    const handleMarkAllAsRead = () => {
        markAllAsRead.mutate();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="font-semibold text-sm">Notifikácie</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {unreadCount} {unreadCount === 1 ? 'nová' : 'nové'}
                            </p>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={markAllAsRead.isPending}
                            className="h-8 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Označiť všetko
                        </Button>
                    )}
                </div>

                {/* Notifications list */}
                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Načítavam...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-medium">Žiadne notifikácie</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Zatiaľ nemáte žiadne nové správy
                            </p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onClose={() => setOpen(false)}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
