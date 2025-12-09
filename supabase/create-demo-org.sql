-- デモ用の組織とユーザーを作成するSQL
-- Supabase SQL Editor で実行してください

-- 1. デモ用の組織を作成（既に存在する場合はスキップ）
INSERT INTO public.organizations (organization_slug, name, plan)
VALUES ('demo', 'デモアカウント', 'multi')
ON CONFLICT (organization_slug) DO NOTHING;

-- 2. デモ用のユーザーを作成する場合は、以下のコマンドを実行してください:
-- npx tsx scripts/create-user.ts demo admin@example.com password123

-- または、既存のユーザーをデモ組織に追加する場合:
-- INSERT INTO public.members (organization_id, user_id, role)
-- SELECT 
--   (SELECT id FROM public.organizations WHERE organization_slug = 'demo'),
--   'ユーザーID',
--   'owner';

