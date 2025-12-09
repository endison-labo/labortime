-- デモ用の組織とユーザーを作成する完全版SQL
-- Supabase SQL Editor で実行してください
-- 
-- 注意: auth.usersテーブルには直接INSERTできません。
-- このスクリプトは組織を作成し、ユーザー作成の手順を案内します。

-- ============================================
-- 1. デモ用の組織を作成
-- ============================================
INSERT INTO public.organizations (organization_slug, name, plan)
VALUES ('demo', 'デモアカウント', 'multi')
ON CONFLICT (organization_slug) DO NOTHING;

-- ============================================
-- 2. ユーザー作成の手順
-- ============================================
-- 
-- Supabaseでは、auth.usersテーブルに直接INSERTすることはできません。
-- 以下のいずれかの方法でユーザーを作成してください:
--
-- 【方法A】Supabase Web UIから作成（推奨）
--   1. https://supabase.com にログイン
--   2. labortimeプロジェクトを選択
--   3. 左メニューから「Authentication」をクリック
--   4. 「Users」タブをクリック
--   5. 「Add user」ボタンをクリック
--   6. メールアドレスとパスワードを入力
--   7. 「Auto Confirm User」にチェックを入れる
--   8. 「Create user」をクリック
--   9. 作成されたユーザーのIDをコピー
--
-- 【方法B】スクリプトで作成（開発環境）
--   ターミナルで実行:
--   npx tsx scripts/create-user.ts demo demo@labortime.work demo1234
--
-- 【方法C】Supabase Functionsを使用（上級者向け）
--   Supabase Edge Functionsでauth.admin.createUser()を呼び出す

-- ============================================
-- 3. ユーザーをデモ組織に紐付け（ユーザー作成後）
-- ============================================
-- 
-- 上記の方法でユーザーを作成した後、ユーザーIDを取得して以下を実行してください:
--
-- INSERT INTO public.members (organization_id, user_id, role)
-- SELECT 
--   (SELECT id FROM public.organizations WHERE organization_slug = 'demo'),
--   'ユーザーIDをここに貼り付け',  -- 例: '123e4567-e89b-12d3-a456-426614174000'
--   'owner'
-- ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- 4. ユーザーIDを取得する方法
-- ============================================
-- 
-- ユーザーIDは以下の方法で取得できます:
--
-- 【方法1】Supabase Web UIから
--   Authentication → Users → 作成したユーザーをクリック → UUIDをコピー
--
-- 【方法2】SQLで取得（メールアドレスが分かっている場合）
--   SELECT id, email FROM auth.users WHERE email = 'demo@labortime.work';

-- ============================================
-- 5. 一括で実行する場合の例（ユーザーIDを取得した後）
-- ============================================
-- 
-- 例: ユーザーIDが '123e4567-e89b-12d3-a456-426614174000' の場合
--
-- INSERT INTO public.members (organization_id, user_id, role)
-- SELECT 
--   (SELECT id FROM public.organizations WHERE organization_slug = 'demo'),
--   '123e4567-e89b-12d3-a456-426614174000',
--   'owner'
-- ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- 6. 確認クエリ
-- ============================================
-- 組織とメンバーの状態を確認
SELECT 
  o.organization_slug,
  o.name as organization_name,
  o.plan,
  m.role,
  au.email,
  m.created_at
FROM public.organizations o
LEFT JOIN public.members m ON m.organization_id = o.id
LEFT JOIN auth.users au ON au.id = m.user_id
WHERE o.organization_slug = 'demo';

