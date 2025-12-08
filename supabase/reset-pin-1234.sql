-- PIN再設定用SQLスクリプト（PIN: 1234）
-- Supabase SQL Editor で実行してください
-- 
-- このスクリプトは、bcryptjsで生成されたハッシュを使用します
-- PostgreSQLのcrypt関数とは互換性がありません

-- 山田太郎のPINを1234に設定（bcryptjsで生成されたハッシュを使用）
UPDATE public.staffs 
SET pin_hash = '$2b$10$cAqVtJ4eBxYq93aIWiB9h./ywmBpyCFEupQ6QlTcl8fSv8uQD8vxa'
WHERE name = '山田太郎';

-- 確認用クエリ
SELECT id, name, is_active, created_at 
FROM public.staffs 
WHERE name = '山田太郎';

