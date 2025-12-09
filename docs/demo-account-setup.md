# デモアカウントのセットアップ方法

デモ用の組織とユーザーを作成する方法を説明します。

## 重要: Supabaseの認証システムについて

Supabaseでは、`auth.users`テーブルに直接SQLでINSERTすることはできません（セキュリティ上の理由）。
そのため、ユーザー作成には以下のいずれかの方法を使用する必要があります。

## 方法1: Supabase Web UIから作成（推奨・本番環境対応）

### ステップ1: Supabase Web UIにアクセス

1. ブラウザで https://supabase.com にアクセス
2. ログイン（labortimeプロジェクトの所有者アカウントで）
3. プロジェクト一覧から **labortime** プロジェクトを選択
4. 左メニューから **「Authentication」** をクリック
5. **「Users」** タブをクリック
6. **「Add user」** ボタンをクリック

### ステップ2: ユーザー情報を入力

- **Email**: `demo@labortime.work`（任意のメールアドレス）
- **Password**: `demo1234`（任意のパスワード）
- **Auto Confirm User**: ✅ チェックを入れる（重要）

**「Create user」** をクリック

### ステップ3: ユーザーIDを取得

作成されたユーザーをクリックして、**UUID**（例: `123e4567-e89b-12d3-a456-426614174000`）をコピー

### ステップ4: デモ用の組織を作成

Supabase SQL Editor（左メニュー → **「SQL Editor」**）で以下を実行:

```sql
INSERT INTO public.organizations (organization_slug, name, plan)
VALUES ('demo', 'デモアカウント', 'multi')
ON CONFLICT (organization_slug) DO NOTHING;
```

### ステップ5: ユーザーをデモ組織に紐付け

コピーしたユーザーIDを使って、Supabase SQL Editorで以下を実行:

```sql
INSERT INTO public.members (organization_id, user_id, role)
SELECT 
  (SELECT id FROM public.organizations WHERE organization_slug = 'demo'),
  'ここにユーザーIDを貼り付け',  -- ステップ3でコピーしたUUID
  'owner'
ON CONFLICT (organization_id, user_id) DO NOTHING;
```

## 方法2: スクリプトで作成（開発環境）

ターミナルで以下を実行:

```bash
npx tsx scripts/create-user.ts demo demo@labortime.work demo1234
```

**注意**: このスクリプトは `SUPABASE_SERVICE_ROLE_KEY` が必要です。本番環境では環境変数の管理に注意してください。

## ログイン情報

作成後、以下の情報でログインできます:

- **URL**: `/org/demo/login`
- **メールアドレス**: 作成時に指定したメールアドレス
- **パスワード**: 作成時に指定したパスワード

## 確認方法

Supabase SQL Editorで以下を実行して、作成された組織とメンバーを確認できます:

```sql
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
```

