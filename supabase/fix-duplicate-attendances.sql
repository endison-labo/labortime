-- 重複している勤怠レコードを確認・削除するスクリプト
-- Supabase SQL Editor で実行してください

-- 1. 重複データの確認
SELECT 
  a.staff_id, 
  a.work_date, 
  COUNT(*) as count,
  array_agg(a.id) as attendance_ids,
  array_agg(a.status) as statuses,
  array_agg(a.created_at) as created_ats
FROM public.attendances a
GROUP BY a.staff_id, a.work_date
HAVING COUNT(*) > 1
ORDER BY a.work_date DESC, a.staff_id;

-- 2. 重複データの詳細確認（必要に応じて実行）
-- SELECT * 
-- FROM public.attendances
-- WHERE (staff_id, work_date) IN (
--   SELECT staff_id, work_date
--   FROM public.attendances
--   GROUP BY staff_id, work_date
--   HAVING COUNT(*) > 1
-- )
-- ORDER BY staff_id, work_date, created_at DESC;

-- 3. 重複データの削除（最新のもの以外を削除）
-- 注意: このクエリは、同じstaff_idとwork_dateの組み合わせで複数のレコードがある場合、
-- 最新のもの（created_atが最も新しいもの）以外を削除します
-- 
-- 削除前に必ず上記の確認クエリで重複データを確認してください
-- 
-- 削除されるレコードの確認（実行前に確認推奨）
SELECT 
  id,
  staff_id,
  work_date,
  status,
  clock_in_actual,
  clock_out_actual,
  created_at
FROM public.attendances
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY staff_id, work_date ORDER BY created_at DESC) as rn
    FROM public.attendances
  ) ranked
  WHERE rn > 1
)
ORDER BY staff_id, work_date, created_at;

-- 実際の削除（上記の確認結果を見てから実行）
DELETE FROM public.attendances
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY staff_id, work_date ORDER BY created_at DESC) as rn
    FROM public.attendances
  ) ranked
  WHERE rn > 1
);

-- 4. 削除後の確認（重複がなくなったことを確認）
SELECT 
  staff_id, 
  work_date, 
  COUNT(*) as count
FROM public.attendances
GROUP BY staff_id, work_date
HAVING COUNT(*) > 1;

-- 5. 削除が完了したら、add-unique-constraint-attendances.sql を実行してUNIQUE制約を追加してください

