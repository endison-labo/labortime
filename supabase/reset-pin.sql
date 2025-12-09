-- PIN再設定用SQLスクリプト
-- Supabase SQL Editor で実行してください
-- 
-- 注意: このスクリプトはbcryptjsで生成されたハッシュを使用します
-- PostgreSQLのcrypt関数とは互換性がありません
-- 
-- 使用方法:
-- 1. まず、Node.jsでPINのハッシュを生成します:
--    node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('1234', 10).then(h => console.log(h))"
-- 
-- 2. 生成されたハッシュを以下の<HASH>の部分に置き換えて実行します

-- pgcrypto拡張機能を有効化（既に有効な場合はスキップ）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- スタッフのPINを更新（ハッシュを直接指定）
-- 例: 山田太郎のPINを1234に設定する場合
-- UPDATE public.staffs 
-- SET pin_hash = '<HASH>'  -- bcryptjsで生成されたハッシュをここに貼り付け
-- WHERE name = '山田太郎';

-- 注意: 上記の方法では、bcryptjsで生成されたハッシュを直接使用する必要があります
-- PostgreSQLのcrypt関数は使用しないでください（互換性の問題があります）

-- 確認用クエリ
-- SELECT id, name, is_active, created_at 
-- FROM public.staffs 
-- WHERE name = '山田太郎';



