了解しました。
Cursor 向けの設計書を以下にまとめます。

---

# 勤怠管理＋簡易支給額システム 設計書（Supabase / Next.js）

## 0. 概要

* 対象：小規模クリニック（よねだ鍼灸整骨院を想定）
* 機能：

  * パート職員の勤怠打刻（タブレット常設）
  * 勤怠データ管理（管理画面）
  * 支給額（総支給ベース）の自動計算
  * 簡易統計・レポート（期間集計・CSV/PDF 出力）
* 特徴：

  * タブレットに PIN を入力して出勤/退勤
  * 「実打刻時刻」と「丸め後の計算用時刻」を分離して保存
  * 税・社保・年末調整等は扱わない（給与ソフト連携前提）

---

## 1. スコープ

### 1.1 In scope

* パート職員の勤怠管理
* 出勤 / 退勤 打刻（タブレット）
* PIN によるスタッフ識別
* 実打刻／丸め後打刻／労働時間の保存
* スタッフ別の時給登録
* 支給額（時給 × 労働時間）の算出
* 月次・期間集計
* CSV / PDF 出力（管理画面からダウンロード）
* 管理者（院長）による勤怠修正・スタッフ管理

### 1.2 Out of scope

* 源泉所得税、社会保険料等の控除計算
* 年末調整、賞与、退職金
* 電子申請（e-Gov 等）
* マイナンバー情報管理

---

## 2. 技術スタック

* フロントエンド / API

  * Next.js (App Router, TypeScript)
  * React
  * Tailwind CSS
* BaaS / DB

  * Supabase Free プラン
  * PostgreSQL
  * Supabase Auth（管理者のみ）
  * Supabase Storage（レポートファイル格納）
* デプロイ

  * Vercel（Next.js）
* 日時・ユーティリティ

  * date-fns もしくは dayjs（どちらでも良い）

---

## 3. アーキテクチャ概要

* Next.js から Supabase JS SDK 経由で DB へアクセス
* 管理者ログイン：Supabase Auth
* スタッフ打刻：PIN 認証（自前ロジック、DB 参照）
* App Router で

  * `/terminal` … タブレット用打刻画面
  * `/admin/*` … 管理画面
* ビジネスロジックは基本 Server Actions または route handler (`app/api/**/route.ts`) に集約

---

## 4. ドメインモデル & DB スキーマ

Supabase の `public` スキーマに定義。

### 4.1 clinics（将来の多テナントを見据えて導入）

```sql
create table public.clinics (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  timezone      text not null default 'Asia/Tokyo',
  rounding_unit integer not null default 5,   -- 丸め単位（分）: 5, 10, 15...
  rounding_mode text not null default 'nearest', -- 'floor' | 'ceil' | 'nearest'
  created_at    timestamptz not null default now()
);
```

※ 当面 1 医院のみだが、将来拡張を考慮。

---

### 4.2 staff（パート職員）

```sql
create table public.staffs (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics(id) on delete cascade,
  name          text not null,
  hourly_wage   numeric(10,2) not null default 0, -- 時給
  pin_hash      text not null,                   -- PIN のハッシュ（平文は保存しない）
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on public.staffs (clinic_id);
```

---

### 4.3 admins（管理者メタ情報）

Supabase Auth の `auth.users` と紐付ける。

```sql
create table public.admins (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  user_id    uuid not null, -- auth.users.id
  role       text not null default 'owner', -- 拡張余地
  created_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);
```

---

### 4.4 attendances（勤怠レコード）

```sql
create type public.attendance_source as enum ('tablet', 'admin');
create type public.attendance_status as enum ('open', 'closed');

create table public.attendances (
  id                      uuid primary key default gen_random_uuid(),
  clinic_id               uuid not null references public.clinics(id) on delete cascade,
  staff_id                uuid not null references public.staffs(id) on delete cascade,

  work_date               date not null, -- 勤務日（ローカル日付）

  -- 実打刻（サーバ時刻をそのまま保持）
  clock_in_actual         timestamptz,
  clock_out_actual        timestamptz,

  -- 丸め後（計算用）
  clock_in_effective      timestamptz,
  clock_out_effective     timestamptz,

  clock_in_source         attendance_source,
  clock_out_source        attendance_source,

  status                  attendance_status not null default 'open', -- open=出勤中, closed=退勤済み
  work_minutes_effective  integer not null default 0, -- 丸め後の労働時間（分）
  has_manual_correction   boolean not null default false,
  note                    text,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index on public.attendances (clinic_id, work_date);
create index on public.attendances (staff_id, work_date);
```

---

### 4.5 attendance_logs（修正履歴）

```sql
create type public.attendance_log_type as enum ('create', 'clock_in', 'clock_out', 'edit');

create table public.attendance_logs (
  id                uuid primary key default gen_random_uuid(),
  attendance_id     uuid not null references public.attendances(id) on delete cascade,
  clinic_id         uuid not null references public.clinics(id) on delete cascade,
  staff_id          uuid not null references public.staffs(id) on delete cascade,

  log_type          attendance_log_type not null,

  -- 変更前後（必要に応じて null 可）
  before_clock_in_effective  timestamptz,
  after_clock_in_effective   timestamptz,
  before_clock_out_effective timestamptz,
  after_clock_out_effective  timestamptz,

  triggered_by_admin_user_id uuid, -- auth.users.id（タブレット打刻時は null）
  created_at                 timestamptz not null default now()
);
create index on public.attendance_logs (attendance_id);
```

---

## 5. 認証・認可

### 5.1 管理者

* Supabase Auth（Email + Password）
* ログイン後、`admins` テーブルを参照し、紐づく `clinic_id` を取得してコンテキストに保持。

### 5.2 スタッフ（タブレット打刻）

* Supabase Auth は使わない。
* `/terminal` 画面から PIN を受け取り、Server Action / API 経由で `staffs.pin_hash` を検証。
* セッション管理はシンプルで良い（PIN 入力 → そのリクエストのみ有効）。

### 5.3 RLS（Row Level Security）

* `clinics` / `staffs` / `attendances` / `attendance_logs` には RLS を有効化。
* パブリックキーでの直接アクセスは行わず、Next.js のサーバ側（service role key）で処理する構成にしても良い。

  * シンプルにする場合：`service_role` キーを Next.js サーバ側のみで利用し、フロントからは Server Actions 経由でのみ DB 操作。
  * その場合、RLS は緩めでも安全性は担保される。

---

## 6. 時刻・丸めロジック

### 6.1 保存ルール

* Supabase（PostgreSQL）の `timestamptz` は UTC で保存。
* アプリケーション上は `clinic.timezone`（デフォルト `Asia/Tokyo`）に従ってローカル時間に変換。
* `work_date` はローカル日付で算出。

### 6.2 丸めパラメータ（clinics）

* `rounding_unit`：5 / 10 / 15 分単位など
* `rounding_mode`：

  * `floor`   … 切り捨て
  * `ceil`    … 切り上げ
  * `nearest` … 四捨五入

### 6.3 勤務時間計算

1. 打刻時に `clock_in_actual` / `clock_out_actual` を記録。
2. 同時に、`clinic` 設定に基づいて丸め後の `clock_in_effective` / `clock_out_effective` を算出。
3. 勤務時間（分）＝ `clock_out_effective - clock_in_effective`。
4. 休憩控除が必要であれば後段ロジックで追加（仕様を詰めるなら、`clinics` に休憩ルールを持たせる）。

`work_minutes_effective` に保存。

---

## 7. 支給額算出ロジック

* 支給額ベース = `staff.hourly_wage * (work_minutes_effective / 60.0)`
* 月次集計等では SUM を取る。
* あくまで「総支給ベース」であり、控除は行わない。

---

## 8. UI / 画面設計

### 8.1 `/terminal`（タブレット打刻）

目的：
院内タブレットからスタッフが PIN 入力 → 出勤 or 退勤。

要素：

* 数字キーパッド
* PIN 入力フィールド（マスク表示）
* 「確定」ボタン
* 認証後、現在状態に応じてボタンを出し分け：

  * 未出勤 → 「出勤する」
  * 出勤中 → 「退勤する」
* 打刻完了後、以下を表示：

  * 氏名
  * 打刻種別（出勤 / 退勤）
  * 実打刻時刻
  * 丸め後時刻（小さく表示しても良い）
* 一定時間（例：5〜10秒）で PIN 入力画面へ戻る。

### 8.2 `/admin/login`

* Supabase Auth の Email/Password ログイン画面。
* ログイン成功後、`/admin/dashboard` へリダイレクト。

### 8.3 `/admin/dashboard`

* 指定月のサマリー表示：

  * 総労働時間（クリニック合計）
  * スタッフ別の労働時間ランキング
  * 支給額概算
* 今日の勤怠状況（出勤中のスタッフ一覧）

### 8.4 `/admin/staffs`

* スタッフ一覧

  * 氏名
  * 時給
  * アクティブ/非アクティブ
* 新規作成 / 編集

  * 氏名、時給
  * PIN 初期設定（平文入力 → サーバ側でハッシュ化して保存）
  * 再発行機能

### 8.5 `/admin/attendances`

* 日付・月・スタッフでフィルター可能な一覧

  * 氏名
  * 日付
  * 出勤／退勤（丸め時刻）
  * 実打刻との差異（必要ならツールチップ表示）
  * 労働時間（分・時間）
  * 支給額ベース
  * 手修正フラグ

* CSV ダウンロード

* PDF レポート出力（後述）

### 8.6 `/admin/attendances/[id]`（詳細・修正）

* 対象レコードの詳細表示：

  * 実打刻／丸め後
  * 勤務時間
  * 支給額
  * 修正履歴（`attendance_logs`）
* 管理者による手修正：

  * 出勤／退勤の丸め後時刻（ローカル時刻入力）
  * `has_manual_correction = true`
  * `attendance_logs` への追記

### 8.7 `/admin/settings`

* クリニック設定：

  * タイムゾーン
  * 丸め単位
  * 丸めモード
  * 休憩ルール（必要であれば後から追加）

### 8.8 `/admin/reports`

* 対象期間・スタッフ指定でレポート生成

  * 期間：月単位 or 任意の日付範囲
  * 出力形式：CSV / PDF
* CSV：単純に `attendances` JOIN `staffs` の結果を流す。
* PDF：サーバ側で HTML → PDF 生成（ライブラリは任意）。

---

## 9. API / Server Action 概要

App Router を前提に、概念的なエンドポイントを列挙。

### 9.1 タブレット関連

* `clockInByPin(pin: string): Promise<ClockResult>`
* `clockOutByPin(pin: string): Promise<ClockResult>`

内部処理：

1. `staffs` から `pin_hash` を照合。
2. 当日 `status='open'` の `attendances` があるか判定。
3. 出勤 or 退勤ロジックを実行。
4. 丸め計算・`work_minutes_effective` 更新。
5. `attendance_logs` にレコード追加。

### 9.2 管理者関連

* `getDashboardSummary(clinicId, month)`
* `getStaffs(clinicId)`
* `createStaff(data)`
* `updateStaff(id, data)`
* `resetStaffPin(staffId, newPlainPin)`
* `getAttendances(filters)`
* `updateAttendance(attendanceId, payload)`
* `exportAttendancesCsv(filters)`
* `generateReportPdf(filters)`
* `getClinicSettings(clinicId)`
* `updateClinicSettings(clinicId, payload)`

実装方式（Server Actions or route handler）は Cursor 側で最適化すればよい。

---

## 10. 環境変数

Next.js プロジェクト `.env` 想定：

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

* フロントからは基本的に「自前の API / Server Action」を叩き、直接 Supabase JS を使うのはサーバ側に限定した方がシンプル。

---

## 11. 今後の拡張余地（コメントレベル）

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 多医院対応（`clinics` をフル活用）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応

---

以上が、Cursor に引き継ぐための設計書です。
この内容を前提に、Next.js + Supabase プロジェクトを生成し、DB スキーマ → API → 画面実装の順に進めれば実装可能です。
