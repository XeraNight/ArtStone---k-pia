import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
    id: string;
    user_id: string;
    type: 'new_client' | 'new_lead';
    title: string;
    message: string | null;
    entity_type: 'client' | 'lead';
    entity_id: string | null;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

// Fetch user's notifications
export function useNotifications() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data as Notification[];
        },
        enabled: !!user,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

// Count unread notifications
export function useUnreadCount() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['notifications-unread-count', user?.id],
        queryFn: async () => {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        },
        enabled: !!user,
        refetchInterval: 30000,
    });
}

// Mark single notification as read
export function useMarkAsRead() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)
                .eq('user_id', user?.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });
}

// Mark all notifications as read
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user?.id)
                .eq('is_read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });
}

// Create notification (called from useClients/useLeads hooks)
export function useCreateNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'is_read'>) => {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    user_id: notification.user_id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    entity_type: notification.entity_type,
                    entity_id: notification.entity_id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            // Invalidate queries for the notified user
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });
}
