import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import { UserPlus, FileText, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Notification } from '@/hooks/useNotifications';
import { useMarkAsRead } from '@/hooks/useNotifications';

interface NotificationItemProps {
    notification: Notification;
    onClose?: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
    const navigate = useNavigate();
    const markAsRead = useMarkAsRead();

    const getIcon = () => {
        switch (notification.type) {
            case 'new_client':
                return <UserPlus className="h-4 w-4 text-blue-500" />;
            case 'new_lead':
                return <FileText className="h-4 w-4 text-green-500" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const handleClick = () => {
        // Mark as read
        if (!notification.is_read) {
            markAsRead.mutate(notification.id);
        }

        // Navigate to entity detail
        if (notification.entity_type && notification.entity_id) {
            const path = notification.entity_type === 'client'
                ? `/clients`
                : `/leads`;
            navigate(path);
            onClose?.();
        }
    };

    const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: sk,
    });

    return (
        <div
            onClick={handleClick}
            className={cn(
                'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                'hover:bg-accent',
                !notification.is_read && 'bg-primary/5'
            )}
        >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                        'text-sm font-medium',
                        !notification.is_read && 'text-foreground font-semibold'
                    )}>
                        {notification.title}
                    </p>
                    {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                </div>

                {notification.message && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                    </p>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo}
                </p>
            </div>

            {/* Read indicator */}
            {notification.is_read && (
                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            )}
        </div>
    );
}
