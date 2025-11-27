# 勤怠管理＋簡易支給額システム

小規模クリニック向けの勤怠管理システムです。タブレットでの PIN 打刻、勤怠データ管理、支給額の自動計算、レポート出力機能を提供します。

## 概要

* **対象**: 小規模クリニック（パート職員の勤怠管理）
* **主な機能**:
  * タブレットでの PIN 打刻（出勤/退勤）
  * 実打刻時刻と丸め後時刻の分離管理
  * 時給 × 労働時間による支給額計算
  * 管理者による勤怠修正・スタッフ管理
  * CSV/PDF レポート出力

## 技術スタック

* **フロントエンド**: Next.js (App Router, TypeScript), React, Tailwind CSS
* **バックエンド/DB**: Supabase (PostgreSQL, Auth, Storage)
* **デプロイ**: Vercel
* **日時処理**: date-fns または dayjs

## セットアップ

### 前提条件

* Node.js 18.x 以上
* npm または yarn
* Supabase アカウント（Free プランで可）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd simple-attendance-system
```

### 2. 依存関係のインストール

```bash
npm install
# または
yarn install
```

### 3. Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) にログイン
2. 新しいプロジェクトを作成
3. プロジェクトの URL と API キーを取得

### 4. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5. データベーススキーマの適用

Supabase Dashboard の SQL Editor で、`outline.md` の「4. ドメインモデル & DB スキーマ」セクションに記載されている SQL を実行してください。

必要なテーブル：
* `clinics`
* `staffs`
* `admins`
* `attendances`
* `attendance_logs`

### 6. 初期データの投入

初回セットアップ時は、`clinics` テーブルにクリニック情報を登録してください：

```sql
INSERT INTO public.clinics (name, timezone, rounding_unit, rounding_mode)
VALUES ('よねだ鍼灸整骨院', 'Asia/Tokyo', 5, 'nearest');
```

### 7. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

### 管理者ログイン

1. `/admin/login` にアクセス
2. Supabase Auth で登録した Email/Password でログイン
3. 初回ログイン後、`admins` テーブルに管理者情報を登録する必要があります

### タブレット打刻

1. `/terminal` にアクセス（タブレットで常設）
2. スタッフの PIN を入力
3. 「出勤する」または「退勤する」ボタンをタップ
4. 打刻完了後、自動的に PIN 入力画面に戻ります

### スタッフ管理

1. `/admin/staffs` にアクセス
2. 「新規作成」でスタッフを追加
3. 氏名、時給、PIN を設定
4. PIN は平文で入力（サーバ側でハッシュ化されます）

### 勤怠データの確認・修正

1. `/admin/attendances` にアクセス
2. 日付・月・スタッフでフィルター
3. 各レコードをクリックして詳細表示・修正

### レポート出力

1. `/admin/reports` にアクセス
2. 対象期間・スタッフを指定
3. CSV または PDF 形式でダウンロード

## プロジェクト構造

```
simple-attendance-system/
├── app/                    # Next.js App Router
│   ├── terminal/          # タブレット打刻画面
│   ├── admin/             # 管理画面
│   └── api/               # API ルート
├── components/             # React コンポーネント
├── lib/                   # ユーティリティ・ヘルパー
│   ├── supabase/          # Supabase クライアント
│   └── utils/             # 共通関数
├── types/                  # TypeScript 型定義
└── outline.md             # 設計書
```

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ✅ |

## デプロイ

### Vercel へのデプロイ

1. [Vercel](https://vercel.com) にログイン
2. プロジェクトをインポート
3. 環境変数を設定
4. デプロイ

## 注意事項

* PIN は平文で保存されません（ハッシュ化されます）
* 支給額は「総支給ベース」であり、控除計算は行いません
* 給与ソフト連携を前提とした設計です
* 詳細な仕様は `outline.md` を参照してください

## ライセンス

[ライセンス情報を記載]

## 関連ドキュメント

* [設計書](./outline.md)
* [ロードマップ](./ROADMAP.md)


