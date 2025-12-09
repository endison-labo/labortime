-- デモ用の組織とユーザーを作成するSQL
-- Supabase SQL Editor で実行してください
-- 
-- このスクリプトは以下を作成します:
-- 1. デモ用の組織（organization_slug: 'demo'）
-- 2. デモ用のユーザー（メールアドレスとパスワード）
-- 3. メンバーとして組織に紐付け

-- ============================================
-- 1. デモ用の組織を作成（既に存在する場合はスキップ）
-- ============================================
INSERT INTO public.organizations (organization_slug, name, plan)
VALUES ('demo', 'デモアカウント', 'multi')
ON CONFLICT (organization_slug) DO NOTHING;

-- ============================================
-- 2. デモ用のユーザーを作成
-- ============================================
-- メールアドレスとパスワードを変更してください
DO $$
DECLARE
  demo_org_id uuid;
  demo_user_id uuid;
  demo_email text := 'demo@labortime.work';  -- メールアドレスを変更してください
  demo_password text := 'demo1234';           -- パスワードを変更してください
BEGIN
  -- 組織IDを取得
  SELECT id INTO demo_org_id
  FROM public.organizations
  WHERE organization_slug = 'demo';

  IF demo_org_id IS NULL THEN
    RAISE EXCEPTION 'デモ用の組織が見つかりません。先に組織を作成してください。';
  END IF;

  -- Supabase Authでユーザーを作成
  -- 注意: Supabase SQL Editorでは直接auth.usersにINSERTできないため、
  -- Supabase Dashboardの「Authentication」→「Users」から手動で作成するか、
  -- スクリプト（npx tsx scripts/create-user.ts）を使用してください

  -- 既存のユーザーIDを指定する場合（Supabase Dashboardでユーザーを作成後）
  -- demo_user_id := 'ユーザーIDをここに貼り付け';

  -- メンバーとして登録（ユーザーIDを取得した後）
  -- INSERT INTO public.members (organization_id, user_id, role)
  -- VALUES (demo_org_id, demo_user_id, 'owner')
  -- ON CONFLICT (organization_id, user_id) DO NOTHING;

  RAISE NOTICE 'デモ用の組織が作成されました。';
  RAISE NOTICE 'ユーザーを作成するには、以下のいずれかの方法を使用してください:';
  RAISE NOTICE '1. Supabase Dashboard → Authentication → Users でユーザーを作成';
  RAISE NOTICE '2. スクリプトを実行: npx tsx scripts/create-user.ts demo % %', demo_email, demo_password;
END $$;

-- ============================================
-- 3. 既存のユーザーをデモ組織に追加する場合
-- ============================================
-- 以下のSQLで、既存のユーザーIDをデモ組織に追加できます
-- 
-- INSERT INTO public.members (organization_id, user_id, role)
-- SELECT 
--   (SELECT id FROM public.organizations WHERE organization_slug = 'demo'),
--   'ユーザーIDをここに貼り付け',
--   'owner'
-- ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- 4. 作成された組織とメンバーを確認
-- ============================================
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

