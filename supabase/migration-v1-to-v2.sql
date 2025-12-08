-- 既存スキーマ（v1: clinics/staffs ベース）から新スキーマ（v2: organizations/units ベース）への移行スクリプト
-- 
-- 実行前に必ずバックアップを取得してください
-- このスクリプトは既存データを保持しながら新しいスキーマに移行します
--
-- 実行順序:
-- 1. schema-v2.sql を実行して新しいテーブルを作成
-- 2. この migration-v1-to-v2.sql を実行してデータを移行
-- 3. 動作確認後、旧テーブルを削除（オプション）

-- ============================================================================
-- 1. 既存テーブルに新しいカラムを追加（移行用）
-- ============================================================================

-- attendances テーブルに unit_id, employee_id を追加
alter table public.attendances 
  add column if not exists unit_id uuid references public.units(id) on delete cascade,
  add column if not exists employee_id uuid references public.employees(id) on delete cascade;

-- attendance_logs テーブルに unit_id, employee_id を追加
alter table public.attendance_logs 
  add column if not exists unit_id uuid references public.units(id) on delete cascade,
  add column if not exists employee_id uuid references public.employees(id) on delete cascade;

-- ============================================================================
-- 2. 既存データの移行
-- ============================================================================
-- 2.1 clinics → organizations + units
-- 各 clinic を 1つの organization と 1つの unit に分割
-- 一時テーブルでマッピングを保持
create temp table if not exists clinic_mapping (
  clinic_id uuid primary key,
  organization_id uuid not null,
  unit_id uuid not null
);

do $$
declare
  clinic_record record;
  new_org_id uuid;
  new_org_slug text;
  new_unit_id uuid;
  unit_slug_base text;
  v_unit_slug text;  -- 変数名を変更して衝突を回避
  slug_counter integer;
  slug_exists boolean;
begin
  for clinic_record in select * from public.clinics order by created_at loop
    -- organization_slug を生成（ランダム英字20-24桁）
    -- ユニークチェック付き
    loop
      new_org_slug := lower(substring(md5(random()::text || clinic_record.id::text || now()::text) from 1 for 22));
      -- 20-24桁の範囲に調整
      if length(new_org_slug) < 20 then
        new_org_slug := new_org_slug || lower(substring(md5(random()::text) from 1 for 20 - length(new_org_slug)));
      elsif length(new_org_slug) > 24 then
        new_org_slug := substring(new_org_slug from 1 for 24);
      end if;
      
      -- ユニークチェック
      select not exists (select 1 from public.organizations where organization_slug = new_org_slug) into slug_exists;
      exit when slug_exists;
    end loop;
    
    -- organization を作成
    insert into public.organizations (organization_slug, name, plan, created_at)
    values (
      new_org_slug,
      coalesce(nullif(trim(clinic_record.name), ''), 'Organization'),
      'single', -- 既存の clinic は単一拠点として扱う
      clinic_record.created_at
    )
    returning id into new_org_id;
    
    -- unit_slug を生成（clinic 名から、重複チェック付き）
    unit_slug_base := lower(regexp_replace(clinic_record.name, '[^a-z0-9]', '', 'g'));
    unit_slug_base := substring(unit_slug_base from 1 for 20); -- 最大20文字
    if length(unit_slug_base) < 2 then
      unit_slug_base := 'unit';
    end if;
    
    -- 重複チェック
    slug_counter := 0;
    v_unit_slug := unit_slug_base;
    loop
      select not exists (
        select 1 from public.units 
        where organization_id = new_org_id and unit_slug = v_unit_slug
      ) into slug_exists;
      exit when slug_exists;
      slug_counter := slug_counter + 1;
      v_unit_slug := unit_slug_base || '-' || slug_counter::text;
    end loop;
    
    -- unit を作成
    insert into public.units (
      organization_id,
      unit_slug,
      name,
      timezone,
      rounding_unit,
      rounding_mode,
      created_at
    )
    values (
      new_org_id,
      v_unit_slug,
      coalesce(nullif(trim(clinic_record.name), ''), 'Unit'),
      clinic_record.timezone,
      clinic_record.rounding_unit,
      clinic_record.rounding_mode,
      clinic_record.created_at
    )
    returning id into new_unit_id;
    
    -- マッピングを保存
    insert into clinic_mapping (clinic_id, organization_id, unit_id)
    values (clinic_record.id, new_org_id, new_unit_id);
  end loop;
end $$;

-- 2.2 admins → members
-- clinic_id を organization_id に変換（マッピングテーブルを使用）
insert into public.members (organization_id, user_id, role, created_at)
select distinct
  cm.organization_id,
  a.user_id,
  coalesce(a.role, 'owner')::text as role,
  a.created_at
from public.admins a
join clinic_mapping cm on a.clinic_id = cm.clinic_id
where not exists (
  select 1 from public.members m 
  where m.organization_id = cm.organization_id and m.user_id = a.user_id
);

-- 2.3 staffs → employees
-- clinic_id を unit_id に変換（マッピングテーブルを使用）
insert into public.employees (
  id,
  unit_id,
  name,
  hourly_wage,
  pin_hash,
  is_active,
  created_at
)
select 
  s.id,
  cm.unit_id,
  s.name,
  s.hourly_wage,
  s.pin_hash,
  s.is_active,
  s.created_at
from public.staffs s
join clinic_mapping cm on s.clinic_id = cm.clinic_id;

-- 2.4 attendances の更新
-- clinic_id → unit_id, staff_id → employee_id
update public.attendances a
set 
  unit_id = cm.unit_id,
  employee_id = e.id
from public.staffs s
join clinic_mapping cm on s.clinic_id = cm.clinic_id
join public.employees e on e.id = s.id -- staffs と employees は同じ id を使用
where a.clinic_id = cm.clinic_id and a.staff_id = s.id;

-- 2.5 attendance_logs の更新
-- clinic_id → unit_id, staff_id → employee_id
update public.attendance_logs al
set 
  unit_id = cm.unit_id,
  employee_id = e.id
from public.staffs s
join clinic_mapping cm on s.clinic_id = cm.clinic_id
join public.employees e on e.id = s.id -- staffs と employees は同じ id を使用
where al.clinic_id = cm.clinic_id and al.staff_id = s.id;

-- ============================================================================
-- 3. データ整合性チェック
-- ============================================================================

-- 移行が正しく完了したか確認するためのクエリ
-- 実行して、NULL が返らないことを確認してください

-- attendances の移行確認
select 
  'attendances with null unit_id' as check_name,
  count(*) as count
from public.attendances
where unit_id is null or employee_id is null;

-- attendance_logs の移行確認
select 
  'attendance_logs with null unit_id' as check_name,
  count(*) as count
from public.attendance_logs
where unit_id is null or employee_id is null;

-- ============================================================================
-- 4. 旧カラムの削除（オプション、慎重に実行）
-- ============================================================================

-- 移行が完了し、動作確認が取れた後に実行してください
-- 注意: この操作は不可逆です

-- alter table public.attendances drop column if exists clinic_id;
-- alter table public.attendances drop column if exists staff_id;
-- alter table public.attendance_logs drop column if exists clinic_id;
-- alter table public.attendance_logs drop column if exists staff_id;

-- ============================================================================
-- 5. 旧テーブルの削除（オプション、慎重に実行）
-- ============================================================================

-- 移行が完了し、動作確認が取れた後に実行してください
-- 注意: この操作は不可逆です

-- drop table if exists public.attendance_logs;
-- drop table if exists public.attendances;
-- drop table if exists public.staffs;
-- drop table if exists public.admins;
-- drop table if exists public.clinics;
-- drop table if exists clinic_mapping;

