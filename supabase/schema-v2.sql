-- 汎用勤怠管理SaaSシステム DB スキーマ v2
-- Supabase SQL Editor で実行してください
-- 
-- このスキーマは organization/unit ベースの2階層構造を実装します
-- 既存の clinics/staffs ベースから移行する場合は migration.sql を参照してください

-- 1. organizations（会社／事業単位のアカウント）
create table if not exists public.organizations (
  id                uuid primary key default gen_random_uuid(),
  organization_slug text not null unique, -- ランダム英字20-24桁、変更不可
  name              text not null,
  plan              text not null default 'single', -- 'single' | 'multi'
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_organizations_slug on public.organizations(organization_slug);

-- 2. units（拠点・店舗・クリニック・部署などの勤怠単位）
create table if not exists public.units (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  unit_slug         text not null, -- organization内でユニーク、管理者が任意入力
  name              text not null,
  timezone          text not null default 'Asia/Tokyo',
  rounding_unit     integer not null default 5,   -- 丸め単位（分）: 5, 10, 15...
  rounding_mode     text not null default 'nearest', -- 'floor' | 'ceil' | 'nearest'
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, unit_slug)
);

create index if not exists idx_units_organization_id on public.units(organization_id);
create index if not exists idx_units_slug on public.units(organization_id, unit_slug);

-- 3. members（ユーザーとorganizationの中間概念）
create table if not exists public.members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null, -- auth.users.id
  role            text not null default 'owner', -- 'owner' | 'admin' | 'manager' | 'staff'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_members_organization_id on public.members(organization_id);
create index if not exists idx_members_user_id on public.members(user_id);

-- 4. employees（従業員、旧 staffs を汎用化）
create table if not exists public.employees (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references public.units(id) on delete cascade,
  name          text not null,
  hourly_wage   numeric(10,2) not null default 0, -- 時給
  pin_hash      text not null,                   -- PIN のハッシュ（平文は保存しない）
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_employees_unit_id on public.employees(unit_id);

-- 5. ENUM 型の作成（既に存在する場合はスキップ）
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'attendance_source') then
    create type public.attendance_source as enum ('tablet', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type public.attendance_status as enum ('open', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_log_type') then
    create type public.attendance_log_type as enum ('create', 'clock_in', 'clock_out', 'break_out', 'break_in', 'edit');
  end if;
end $$;

-- 6. attendances（勤怠レコード）
-- 注意: 既存の attendances テーブルは migration-v1-to-v2.sql で更新されます
-- ここでは新しいテーブルのみ作成します

-- 7. attendance_logs（修正履歴）
-- 注意: 既存の attendance_logs テーブルは migration-v1-to-v2.sql で更新されます
-- ここでは新しいテーブルのみ作成します

-- 8. updated_at の自動更新トリガー
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- organizations テーブル用
drop trigger if exists update_organizations_updated_at on public.organizations;
create trigger update_organizations_updated_at
  before update on public.organizations
  for each row
  execute function public.update_updated_at_column();

-- units テーブル用
drop trigger if exists update_units_updated_at on public.units;
create trigger update_units_updated_at
  before update on public.units
  for each row
  execute function public.update_updated_at_column();

-- members テーブル用
drop trigger if exists update_members_updated_at on public.members;
create trigger update_members_updated_at
  before update on public.members
  for each row
  execute function public.update_updated_at_column();

-- employees テーブル用
drop trigger if exists update_employees_updated_at on public.employees;
create trigger update_employees_updated_at
  before update on public.employees
  for each row
  execute function public.update_updated_at_column();

-- attendances テーブル用（既存のトリガーを更新）
drop trigger if exists update_attendances_updated_at on public.attendances;
create trigger update_attendances_updated_at
  before update on public.attendances
  for each row
  execute function public.update_updated_at_column();

