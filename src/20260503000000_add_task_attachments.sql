-- Create task_attachments table
create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.task_attachments enable row level security;

-- Project members can view attachments for tasks in their projects
create policy "Members can view task attachments"
  on public.task_attachments for select
  using (
    exists (
      select 1 from public.tasks t
      join public.project_members pm on pm.project_id = t.project_id
      where t.id = task_attachments.task_id
        and pm.user_id = auth.uid()
    )
  );

-- Project members can upload attachments
create policy "Members can upload task attachments"
  on public.task_attachments for insert
  with check (
    auth.uid() = uploaded_by and
    exists (
      select 1 from public.tasks t
      join public.project_members pm on pm.project_id = t.project_id
      where t.id = task_attachments.task_id
        and pm.user_id = auth.uid()
    )
  );

-- Uploader or admin can delete attachments
create policy "Uploader or admin can delete attachments"
  on public.task_attachments for delete
  using (
    auth.uid() = uploaded_by or
    exists (
      select 1 from public.tasks t
      join public.project_members pm on pm.project_id = t.project_id
      where t.id = task_attachments.task_id
        and pm.user_id = auth.uid()
        and pm.role = 'admin'
    )
  );

-- Create storage bucket for task attachments
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  false,
  52428800, -- 50MB limit
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-zip-compressed',
    'video/mp4', 'video/webm'
  ]
)
on conflict (id) do nothing;

-- Storage policy: authenticated users can upload
create policy "Authenticated users can upload attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'task-attachments');

-- Storage policy: project members can view
create policy "Project members can view attachments"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'task-attachments');

-- Storage policy: uploader can delete
create policy "Uploader can delete attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'task-attachments' and auth.uid()::text = (storage.foldername(name))[1]);
