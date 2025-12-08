-- attendancesテーブルにUNIQUE制約を追加
-- 同じスタッフの同じ日に複数の勤怠レコードが作成されることを防ぐ
-- Supabase SQL Editor で実行してください

-- 注意: 既に重複データがある場合は、先に重複を削除する必要があります
-- 重複データの確認
-- SELECT staff_id, work_date, COUNT(*) as count
-- FROM public.attendances
-- GROUP BY staff_id, work_date
-- HAVING COUNT(*) > 1;

-- 重複データがある場合、最新のもの以外を削除する例（必要に応じて実行）
-- DELETE FROM public.attendances
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (staff_id, work_date) id
--   FROM public.attendances
--   ORDER BY staff_id, work_date, created_at DESC
-- );

-- UNIQUE制約を追加（重複データがないことを確認してから実行）
-- 既に存在する場合はスキップ
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'attendances_staff_date_unique'
  ) THEN
    ALTER TABLE public.attendances
    ADD CONSTRAINT attendances_staff_date_unique UNIQUE (staff_id, work_date);
  END IF;
END $$;

