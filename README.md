# 勤怠管理SaaSシステム

汎用性の高い勤怠管理SaaSシステムです。小規模事業から複数拠点を持つ企業まで、様々な業種・規模に対応できます。

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。

### 主要機能

- **PIN認証による打刻**: タブレット端末での簡単な出勤/退勤打刻
- **時刻丸め機能**: 設定可能な丸め単位・丸めモードによる労働時間計算
- **複数拠点対応**: 1つの organization で複数の unit（拠点）を管理可能
- **勤怠レポート**: CSV/PDF 形式での勤怠データ出力
- **柔軟な権限管理**: owner / admin / manager / staff の役割ベースアクセス制御

### 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **デプロイ**: Vercel

## セットアップ

### 必要な環境

- Node.js 18+
- npm または yarn
- Supabase アカウント

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
```

`.env.local` に以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### データベースセットアップ

1. Supabase プロジェクトを作成
2. `supabase/schema.sql` を Supabase SQL Editor で実行
3. 初期データの投入（必要に応じて）

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## プロジェクト構造

```
.
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   ├── org/              # organization ルート
│   │   └── [org_slug]/   # 動的ルーティング
│   └── ...
├── components/            # React コンポーネント
├── lib/                   # ユーティリティ
│   ├── auth/             # 認証関連
│   └── supabase/         # Supabase クライアント
├── types/                 # TypeScript 型定義
├── supabase/             # DB スキーマ SQL
└── scripts/              # 初期化スクリプト
```

## Slug 方針

### organization_slug
- **完全自動生成**
- **ランダム英字 20〜24 桁程度**
- 一度発行したら **変更不可（永続ID）**
- 例: `abc123def456ghi789jkl`

### unit_slug
- **organization 内でユニーク** であればよい
- 管理者が **任意の文字列を入力**（英字・数字・ハイフン）
- 例: `head-office`, `tenjin`, `shop-1`

## URL 構造

- `/` - サービス紹介ページ（LP）
- `/org/:org_slug/login` - 管理者ログイン
- `/org/:org_slug/dashboard` - ダッシュボード
- `/org/:org_slug/units` - 拠点一覧
- `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
- `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- `/org/:org_slug/units/:unit_slug/employees` - 従業員管理
- `/org/:org_slug/units/:unit_slug/attendances` - 勤怠一覧

## 開発

### コーディング規約

- TypeScript の strict モードを使用
- Server Actions は `app/actions/` に配置
- コンポーネントは `components/` に配置
- 型定義は `types/` に配置

### データベース変更

1. `supabase/` ディレクトリに SQL ファイルを作成
2. Supabase SQL Editor で実行
3. `types/database.ts` の型定義を更新

## ライセンス

[ライセンス情報を追加]

## 参考資料

- [ROADMAP.md](./ROADMAP.md) - 実装ロードマップ
- [loadmap_handra.md](./loadmap_handra.md) - handraプロジェクトの参考ロードマップ
