# 実装ロードマップ

汎用勤怠管理SaaSシステムの実装計画と進捗管理用ドキュメントです。

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。そのため、organization を「絶対的な最上位」とは決めつけない設計にします。

### 主要概念

- **organization**: 1つの契約（プラン）を持つアカウント単位
  - 単拠点プラン → unit は 1件まで
  - 複数拠点プラン → unit を複数作成可能
  - 業種は固定しない（会社単位・事業単位のどちらでも運用可能）

- **unit**: 勤怠をまとめる実務上の単位
  - 例）店舗、クリニック、工場、支店、部署など
  - 組織内での集計・管理単位として扱う
  - 業種に依存した名前（clinic 等）は使わない

### Slug 方針

#### organization_slug
- **完全自動生成**
- **ランダム英字 20〜24 桁程度**（Supabase の org slug と同じノリ）
- 一度発行したら **変更不可（永続ID）**
- 人間が読めなくてよい（ユニーク性と安定性を最優先）

#### unit_slug
- **organization 内でユニーク** であればよい
- 管理者が **任意の文字列を入力**（英字・数字・ハイフン）
  - 例：`head-office`, `tenjin`, `shop-1` など
- URL に出ても問題ないが、SNSのような"見せる用"ではない前提

### ID と slug の関係

- すべての主要エンティティ（organization, unit, user, employee 等）は、**内部的には UUID などの主キー（id）で管理** する
- **slug はあくまで「外向きの識別子／URL用」** として扱う
- アプリ内部の参照・リレーションは **id 基本**、slug は補助的

### URL 構造

org・unit ともに **slug を URL に使う前提** で設計：

- 例：`/org/:org_slug/...`
- 拠点を絡めるなら：`/org/:org_slug/units/:unit_slug/...`

---

## 実装フェーズ

### Phase 1: プロジェクト基盤・DBスキーマ再設計 🔄

**目標**: 汎用システム向けにDBスキーマを再設計・移行

#### タスク

- [x] 新しいDBスキーマの設計
  - [x] `organizations` テーブルの作成
  - [x] `units` テーブルの作成
  - [x] `members` テーブルの作成（ユーザーとorganizationの中間概念）
  - [x] `employees` テーブルの作成（旧 `staffs` を汎用化）
  - [x] `attendances` テーブルの更新（カラム追加）
  - [x] `attendance_logs` テーブルの更新（カラム追加）
  - [x] 必要な ENUM 型の作成
  - [x] インデックスの作成
- [x] 既存データの移行スクリプト
  - [x] `clinics` → `organizations` + `units` への移行
  - [x] `staffs` → `employees` への移行
  - [x] `admins` → `members` への移行
  - [x] `attendances` / `attendance_logs` のデータ移行
- [x] TypeScript 型定義の更新
- [x] organization_slug 生成ロジックの実装

**依存関係**: なし

**完了条件**: 新しいDBスキーマが適用され、既存データが移行される

---

### Phase 2: 認証・基本設定の再実装 🔄

**目標**: organization/unit ベースの認証と設定機能の実装

#### タスク

- [x] Supabase Auth の設定確認
- [x] 認証・認可の実装
  - [x] `organization_slug` から `organization_id` への変換ロジック
  - [x] `unit_slug` から `unit_id` への変換ロジック
  - [x] ユーザーが所属する organization の取得
  - [x] ユーザーの role に基づくアクセス制御
- [x] セッション管理・認証ミドルウェアの更新
- [x] Server Actions の実装
  - [x] `app/actions/organization.ts` - organization の CRUD
  - [x] `app/actions/unit.ts` - unit の CRUD
  - [x] `app/actions/auth.ts` - organization ベースのログイン/ログアウト
- [x] ルーティング構造の実装
  - [ ] `/` - サービス紹介ページ（LP）（未実装、現在は打刻画面）
  - [x] `/org/:org_slug/login` - 管理者ログインページ
  - [x] `/org/:org_slug/dashboard` - ダッシュボード
  - [x] `/org/:org_slug/units` - 拠点一覧
  - [x] `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
  - [x] `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- [x] organization 設定ページの実装
  - [x] `/org/:org_slug/settings` - 組織設定ページ
  - [x] 組織名・プランの設定
- [x] unit 設定ページの実装
  - [x] タイムゾーン、丸め単位、丸めモードの設定

**依存関係**: Phase 1

**完了条件**: 管理者がログインでき、organization/unit 設定を変更できる

---

### Phase 3: タブレット打刻機能（MVP） 📱

**目標**: PIN 認証による出勤/退勤打刻機能の実装

#### タスク

- [x] `/org/:org_slug/units/:unit_slug/terminal` ページの実装
  - [x] PIN 入力画面（数字キーパッド）
  - [x] PIN マスク表示
  - [x] 認証後の状態表示
- [x] PIN ハッシュ化・検証ロジック
- [x] 時刻丸めロジックの実装
  - [x] `rounding_unit` / `rounding_mode` に基づく計算
  - [x] タイムゾーン変換処理
- [x] 出勤打刻機能（Server Action）
  - [x] `clockInByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_in_actual` / `clock_in_effective` の記録
  - [x] `attendance_logs` への記録
- [x] 退勤打刻機能（Server Action）
  - [x] `clockOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_out_actual` / `clock_out_effective` の記録
  - [x] `work_minutes_effective` の計算・更新
  - [x] `attendance_logs` への記録
- [x] 外出・戻り打刻機能（Server Action）
  - [x] `breakOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `breakInByPin` の実装（unit_id/employee_id対応済み）
- [x] 打刻完了後の自動リセット（リンクボタンでのみ戻る）

**依存関係**: Phase 1, Phase 2

**完了条件**: PIN 入力で出勤/退勤打刻ができ、丸め後の時刻が正しく記録される

---

### Phase 4: 管理画面（基本機能） 📋

**目標**: 従業員管理と勤怠データの確認機能

#### 4.1 従業員管理

- [x] `/org/:org_slug/units/:unit_slug/employees` ページの実装
  - [x] 従業員一覧表示
  - [x] 新規従業員作成フォーム
  - [x] 従業員編集フォーム
  - [x] PIN 再発行機能
  - [x] アクティブ/非アクティブ切り替え
- [x] Server Actions の実装
  - [x] `getEmployees`
  - [x] `createEmployee`
  - [x] `updateEmployee`
  - [x] `resetEmployeePin`

#### 4.2 ダッシュボード

- [ ] `/org/:org_slug/dashboard` ページの実装
  - [ ] 指定月のサマリー表示（全 unit 合計）
  - [ ] 総労働時間（organization 合計）
  - [ ] unit 別労働時間
  - [ ] 従業員別労働時間ランキング
  - [ ] 支給額概算
  - [ ] 今日の勤怠状況（出勤中従業員一覧）
- [ ] `/org/:org_slug/units/:unit_slug/dashboard` ページの実装
  - [ ] unit 単位のサマリー表示
- [ ] Server Action: `getDashboardSummary`

#### 4.3 勤怠一覧

- [ ] `/org/:org_slug/units/:unit_slug/attendances` ページの実装
  - [ ] フィルター機能（日付・月・従業員）
  - [ ] 勤怠データ一覧表示
  - [ ] 実打刻/丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
- [ ] Server Action: `getAttendances`

#### 4.4 勤怠詳細・修正

- [ ] `/org/:org_slug/units/:unit_slug/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 手修正フォーム（出勤/退勤時刻）
- [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

#### 4.5 拠点管理

- [ ] `/org/:org_slug/units` ページの実装
  - [ ] 拠点一覧表示
  - [ ] 新規拠点作成フォーム（unit_slug 入力含む）
  - [ ] 拠点編集フォーム
  - [ ] 拠点削除機能（プラン制限チェック含む）
- [ ] Server Actions の実装
  - [ ] `getUnits`
  - [ ] `createUnit`
  - [ ] `updateUnit`
  - [ ] `deleteUnit`

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: 従業員の追加・編集ができ、勤怠データの確認・修正ができる

---

### Phase 5: レポート・出力機能 📊

**目標**: CSV/PDF レポート出力機能の実装

#### タスク

- [ ] `/org/:org_slug/units/:unit_slug/reports` ページの実装
  - [ ] 期間選択（月単位 or 日付範囲）
  - [ ] 従業員選択（複数選択可）
  - [ ] 出力形式選択（CSV / PDF）
- [ ] CSV 出力機能
  - [ ] Server Action: `exportAttendancesCsv`
  - [ ] `attendances` JOIN `employees` のデータ取得
  - [ ] CSV フォーマット変換
  - [ ] ダウンロード処理
- [ ] PDF 出力機能
  - [ ] PDF 生成ライブラリの選定・導入（例: puppeteer, jsPDF）
  - [ ] Server Action: `generateReportPdf`
  - [ ] HTML テンプレートの作成
  - [ ] PDF レイアウトの実装
  - [ ] ダウンロード処理
- [ ] organization 単位のレポート機能（全 unit 合計）

**依存関係**: Phase 4

**完了条件**: 指定期間・従業員の勤怠データを CSV/PDF で出力できる

---

### Phase 6: 拡張機能・最適化 🚀

**目標**: UI/UX の改善とパフォーマンス最適化

#### タスク

- [ ] RLS（Row Level Security）の設定・最適化
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善
- [ ] レスポンシブデザインの調整
- [ ] アクセシビリティの向上
- [ ] テストの追加（オプション）
- [ ] パフォーマンス最適化
- [ ] organization_slug 生成ロジックの実装
  - [ ] ランダム英字20-24桁の生成
  - [ ] ユニークチェック
  - [ ] 永続性の保証

**依存関係**: Phase 1-5

**完了条件**: システムが安定して動作し、ユーザビリティが向上している

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応
* enterprise 階層の追加（3階層への拡張）
* プラン管理・課金機能
* 複数 organization への所属管理UI

---

## 進捗管理

### 現在のフェーズ

**Phase 2: 認証・基本設定の再実装** - 完了（ルーティング構造・unit設定ページ・organization設定ページ実装完了）
**Phase 3: タブレット打刻機能（MVP）** - バックエンド対応完了（unit_id/employee_id対応済み）

### 完了済みタスク

- Phase 1（旧）: プロジェクト基盤・DBスキーマ（2025-11-27）
  - Next.js プロジェクトの初期化（TypeScript, Tailwind CSS）
  - Supabase クライアントのセットアップ
  - DB スキーマ SQL ファイルの作成（旧設計）
  - TypeScript 型定義の作成（旧設計）

- Phase 2（旧）: 認証・基本設定（2025-11-27）
  - Supabase Auth の設定とログイン機能
  - `/admin/login` ページの実装
  - 認証ミドルウェアの実装
  - `/admin/settings` ページの実装
  - クリニック設定の取得・更新機能

- Phase 1（新）: DBスキーマ再設計・移行（2025-12-08）
  - 新しいDBスキーマの作成（`supabase/schema-v2.sql`）
  - 既存データの移行スクリプト（`supabase/migration-v1-to-v2.sql`）
  - TypeScript型定義の更新（`types/database.ts`）

- Phase 2（新）: 認証・基本設定の再実装（2025-12-08）
  - 認証ユーティリティの更新（`lib/auth/utils.ts`）
  - Server Actions実装（`app/actions/organization.ts`, `app/actions/unit.ts`, `app/actions/auth.ts`）
  - 認証ミドルウェアの更新（`middleware.ts`）
  - ルーティング構造の実装（`/org/:org_slug/*`）
  - unit設定ページの実装（`UnitSettingsForm`コンポーネント）
  - organization設定ページの実装（`OrganizationSettingsForm`コンポーネント）

- Phase 3（新）: タブレット打刻機能のバックエンド対応（2025-12-08）
  - `app/actions/attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応
  - 打刻画面のルーティング構造への配置（`/org/:org_slug/units/:unit_slug/terminal`）

> **注意**: 旧設計（clinic/staff ベース）から新設計（organization/unit ベース）への移行が完了しました。

### 次のマイルストーン

1. Phase 1 の完了（DBスキーマ再設計・移行）
2. Phase 2 の完了（認証・基本設定の再実装）
3. Phase 3 の完了（MVP: 打刻機能）
4. Phase 4 の完了（管理画面基本機能）
5. Phase 5 の完了（レポート出力）

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する
* 旧設計から新設計への移行時は、既存データの整合性に注意する

---

最終更新: 2025-12-08（Phase 1完了、Phase 2完了、Phase 3バックエンド対応完了、Phase 4.1従業員管理完了）
