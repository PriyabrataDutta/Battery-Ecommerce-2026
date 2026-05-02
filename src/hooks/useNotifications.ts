import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listMyNotifications, markNotificationRead, markAllRead, type Notification } from "@/api/notifications";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", uid],
    queryFn: () => listMyNotifications(uid!),
    enabled: !!uid,
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel("notifications-" + uid)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [uid, qc]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
  });

  const markAll = useMutation({
    mutationFn: () => markAllRead(uid!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
  });

  return { notifications, unreadCount, markRead: markRead.mutate, markAllRead: markAll.mutate };
}
