
-- Create return status type
DO $$ BEGIN
  CREATE TYPE public.return_status AS ENUM ('requested', 'staff_verified', 'admin_approved', 'rejected', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Return requests table
CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_item_id uuid,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status return_status NOT NULL DEFAULT 'requested',
  staff_verified_by uuid,
  staff_verified_at timestamptz,
  admin_decided_by uuid,
  admin_decided_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_return_requests_user ON public.return_requests (user_id);
CREATE INDEX idx_return_requests_order ON public.return_requests (order_id);
CREATE INDEX idx_return_requests_status ON public.return_requests (status);

CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- Customer can view their own returns
CREATE POLICY "returns_self_read" ON public.return_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_staff(auth.uid()));

-- Customer can create returns for their own orders
CREATE POLICY "returns_self_insert" ON public.return_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Staff can update returns (for verification)
CREATE POLICY "returns_staff_update" ON public.return_requests
  FOR UPDATE TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- Admin can manage all returns
CREATE POLICY "returns_admin_all" ON public.return_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Return images table
CREATE TABLE public.return_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_return_images_return ON public.return_images (return_id);

ALTER TABLE public.return_images ENABLE ROW LEVEL SECURITY;

-- Owner and staff can view return images
CREATE POLICY "return_images_read" ON public.return_images
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.return_requests r
    WHERE r.id = return_images.return_id
    AND (r.user_id = auth.uid() OR is_staff(auth.uid()))
  ));

-- Owner can insert images for their return
CREATE POLICY "return_images_self_insert" ON public.return_images
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.return_requests r
    WHERE r.id = return_images.return_id
    AND r.user_id = auth.uid()
  ));

-- Staff can manage all return images
CREATE POLICY "return_images_staff_all" ON public.return_images
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- Storage bucket for return images (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('return-images', 'return-images', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload return images
CREATE POLICY "return_images_bucket_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'return-images');

-- Authenticated users can view return images
CREATE POLICY "return_images_bucket_auth_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'return-images');

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_self_read" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "notifications_self_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System (via triggers/functions) can insert notifications
CREATE POLICY "notifications_system_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Staff can manage all notifications
CREATE POLICY "notifications_staff_all" ON public.notifications
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to notify on return status change
CREATE OR REPLACE FUNCTION public.notify_return_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _staff_id uuid;
  _title text;
  _msg text;
  _link text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    _link := '/account/orders';
    _title := 'Return Request Update';
    _msg := 'Your return request status changed to ' || NEW.status::text;

    -- Notify the customer
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (NEW.user_id, 'return', _title, _msg, _link);

    -- Notify all staff and admins
    FOR _staff_id IN
      SELECT DISTINCT ur.user_id FROM public.user_roles ur
      WHERE ur.role IN ('admin', 'staff')
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (_staff_id, 'return', 'Return Request #' || left(NEW.id::text, 8),
              'Return status changed to ' || NEW.status::text, '/admin/returns');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_return_status_notify
  AFTER UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_return_status_change();
