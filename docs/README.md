# Labor Time（レイバータイム）

**Labor Time** は、汎用性の高い勤怠管理SaaSシステムです。小規模事業から複数拠点を持つ企業まで、様々な業種・規模に対応できます。

- **サービス名**: Labor Time（レイバータイム）
- **ドメイン**: [labortime.work](https://labortime.work)

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。

### 主要機能

- **PIN認証による打刻**: タブレット端末での簡単な出勤/退勤/外出/戻り打刻
- **時刻丸め機能**: 設定可能な丸め単位・丸めモードによる労働時間計算
- **複数拠点対応**: 1つの organization で複数の unit（拠点）を管理可能
- **従業員管理**: 従業員の追加・編集・PIN再発行機能
- **勤怠レポート**: CSV/PDF 形式での勤怠データ出力（未実装）
- **柔軟な権限管理**: owner / admin / manager / staff の役割ベースアクセス制御

### 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth

### インフラ・サービス

- **Hosting**: [Vercel](https://vercel.com/)
- **Security**: Google reCAPTCHA v2
- **Domain Registrar**: お名前.com（ドメイン管理・支払い）
- **DNS Management**: Cloudflare（実際のDNS設定は全てこちら）
- **Mail Server**: Xserver（エックスサーバー）
  - メールエイリアス機能でGmailに転送設定
  - 通常のメール（info@labortime.work等）はGmailで受信
- **Transactional Email**: 現時点では未使用（将来の拡張: Resend等を検討）
  - メールフォーム実装時はXserverのSMTP経由で送信予定
  - 送信先もメールエイリアス経由でGmailに転送
  - 必要に応じてResend Pro（$20/月）を追加検討
- **GitHub Organization**: [endison-labo](https://github.com/endison-labo)

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
2. `supabase/schema-v2.sql` を Supabase SQL Editor で実行
3. 既存データがある場合は `supabase/migration-v1-to-v2.sql` を実行して移行
4. 初期データの投入（必要に応じて）

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

### 公開ページ
- `/` - 打刻画面（PIN入力）

### 管理者ページ（認証必須）
- `/org/:org_slug/login` - 管理者ログイン
- `/org/:org_slug/dashboard` - ダッシュボード
- `/org/:org_slug/settings` - 組織設定
- `/org/:org_slug/units` - 拠点一覧
- `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
- `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- `/org/:org_slug/units/:unit_slug/employees` - 従業員管理
- `/org/:org_slug/units/:unit_slug/attendances` - 勤怠一覧（未実装）

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

## 実装状況

### 完了済み
- ✅ Phase 1: DBスキーマ再設計・移行
- ✅ Phase 2: 認証・基本設定の再実装
- ✅ Phase 3: タブレット打刻機能（MVP）
- ✅ Phase 4.1: 従業員管理

### 開発中
- 🔄 Phase 4.2: ダッシュボード
- 🔄 Phase 4.3: 勤怠一覧
- 🔄 Phase 4.4: 勤怠詳細・修正
- 🔄 Phase 4.5: 拠点管理

詳細は [ROADMAP.md](./ROADMAP.md) を参照してください。

## 参考資料

- [ROADMAP.md](./ROADMAP.md) - 実装ロードマップ
- [daily-report.md](./daily-report.md) - 日次開発レポート
