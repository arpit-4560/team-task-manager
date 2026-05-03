-- 1. Add 'manager' to the role enum in project_members
ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_role_check
  CHECK (role IN ('admin', 'manager', 'member'));

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'task_assigned' | 'task_overdue' | 'task_done' | 'member_added' | 'comment'
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  link_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  link_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Enable realtime on tasks and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 4. Function to auto-notify on task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  task_title text;
  project_name text;
BEGIN
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    SELECT t.title, p.name INTO task_title, project_name
    FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = NEW.id;

    INSERT INTO public.notifications (user_id, type, title, message, link_project_id, link_task_id)
    VALUES (
      NEW.assignee_id,
      'task_assigned',
      'New task assigned to you',
      'You have been assigned: "' || NEW.title || '" in ' || project_name,
      NEW.project_id,
      NEW.id
    );
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'done' THEN
    -- Notify task creator
    INSERT INTO public.notifications (user_id, type, title, message, link_project_id, link_task_id)
    VALUES (
      NEW.created_by,
      'task_done',
      'Task completed ✓',
      '"' || NEW.title || '" has been marked as done',
      NEW.project_id,
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_change ON public.tasks;
CREATE TRIGGER on_task_change
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignment();
