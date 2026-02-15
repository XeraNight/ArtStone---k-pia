-- Create storage bucket for documents if it doesn't exist
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload documents
create policy "Authenticated users can upload documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents');

-- Allow authenticated users to read documents
create policy "Authenticated users can read documents"
on storage.objects for select
to authenticated
using (bucket_id = 'documents');

-- Allow authenticated users to delete documents from storage
create policy "Authenticated users can delete documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'documents');

-- Create documents table if it doesn't exist
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('pricelist', 'manual', 'internal', 'marketing', 'legal')),
  file_name text,
  file_url text not null,
  file_type text,
  file_size text,
  storage_path text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on documents table
alter table documents enable row level security;

-- Policy: All authenticated users can read documents
create policy "Authenticated users can read documents"
on documents for select
to authenticated
using (true);

-- Policy: Authenticated users can create documents
create policy "Authenticated users can create documents"
on documents for insert
to authenticated
with check (auth.uid() = created_by);

-- Policy: Users can update their own documents
create policy "Users can update their own documents"
on documents for update
to authenticated
using (auth.uid() = created_by);

-- Policy: Users can delete their own documents
create policy "Users can delete their own documents"
on documents for delete
to authenticated
using (auth.uid() = created_by);

-- Create index for faster queries
create index if not exists idx_documents_category on documents(category);
create index if not exists idx_documents_created_by on documents(created_by);
create index if not exists idx_documents_created_at on documents(created_at desc);
