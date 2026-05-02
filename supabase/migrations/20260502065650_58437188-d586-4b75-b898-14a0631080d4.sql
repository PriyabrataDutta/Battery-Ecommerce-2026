
DROP POLICY IF EXISTS "notifications_system_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_staff(auth.uid()));
