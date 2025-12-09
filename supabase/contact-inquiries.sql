-- お問い合わせフォーム用テーブル
-- デモ画面からのお問い合わせを保存

create table if not exists public.contact_inquiries (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  contact_name  text not null,
  email         text not null,
  message       text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_contact_inquiries_created_at on public.contact_inquiries(created_at desc);
create index if not exists idx_contact_inquiries_email on public.contact_inquiries(email);

-- RLS (Row Level Security) は設定しない（管理者のみアクセス可能な想定）

