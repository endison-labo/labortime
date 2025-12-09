-- デモ用のユーザーをデモ組織に追加するSQL
-- Supabase SQL Editor で実行してください
-- 
-- このスクリプトは、既に作成されたユーザーをデモ組織に紐付けます

-- ============================================
-- 1. デモ用の組織を作成（既に存在する場合はスキップ）
-- ============================================
INSERT INTO public.organizations (organization_slug, name, plan)
VALUES ('demo', 'デモアカウント', 'multi')
ON CONFLICT (organization_slug) DO NOTHING;

-- ============================================
-- 2. ユーザーをデモ組織に紐付け
-- ============================================
-- ユーザーID: d0068740-7bf8-489b-89ec-3638edb47705
INSERT INTO public.members (organization_id, user_id, role)
SELECT 
  (SELECT id FROM public.organizations WHERE organization_slug = 'demo'),
  'd0068740-7bf8-489b-89ec-3638edb47705',
  'owner'
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ============================================
-- 3. 確認
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

