-- 外出・戻り機能のためのフィールド追加
-- Supabase SQL Editor で実行してください

-- 1. attendancesテーブルに外出・戻り時刻のフィールドを追加
ALTER TABLE public.attendances
ADD COLUMN IF NOT EXISTS break_out_actual timestamptz,
ADD COLUMN IF NOT EXISTS break_out_effective timestamptz,
ADD COLUMN IF NOT EXISTS break_in_actual timestamptz,
ADD COLUMN IF NOT EXISTS break_in_effective timestamptz;

-- 2. attendance_log_type ENUMに外出・戻りを追加
DO $$ 
BEGIN
  -- break_out を追加（既に存在する場合はスキップ）
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'break_out' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'attendance_log_type')
  ) THEN
    ALTER TYPE public.attendance_log_type ADD VALUE 'break_out';
  END IF;
  
  -- break_in を追加（既に存在する場合はスキップ）
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'break_in' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'attendance_log_type')
  ) THEN
    ALTER TYPE public.attendance_log_type ADD VALUE 'break_in';
  END IF;
END $$;

