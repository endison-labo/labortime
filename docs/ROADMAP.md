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
  - [x] `/` - サービス紹介ページ（LP）とお問い合わせフォーム
  - [x] `/org/:org_slug/login` - 管理者ログインページ
  - [x] `/org/:org_slug/dashboard` - ダッシュボード
  - [x] `/org/:org_slug/units` - 拠点一覧
  - [x] `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
  - [x] `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- [x] ログアウト機能の実装
- [x] デモアカウント機能の実装
  - [x] デモ組織（`demo`）の設定
  - [x] 認証なしで閲覧可能なデモダッシュボード
  - [x] デモアカウント作成スクリプト
- [x] お問い合わせフォームの実装
  - [x] `contact_inquiries` テーブルの作成
  - [x] `components/contact/ContactForm.tsx` の実装
  - [x] `app/actions/contact.ts` の実装
  - [x] LPへの統合
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
- [x] 組織レイアウト・ナビゲーションの実装
  - [x] ルートグループによる画面分離（`(auth)` / `(app)`）
  - [x] `components/org/SideNav.tsx` - 左サイドメニュー（大手勤怠SaaSパターン）
  - [x] `components/org/OrgHeader.tsx` - 上部ヘッダー（組織名・ユーザー情報・ログアウト）
  - [x] `components/org/OrgLayoutClient.tsx` - レイアウトクライアントコンポーネント
  - [x] メニュー構成（ダッシュボード、勤怠管理、シフト管理、スタッフ管理、集計・出力、設定）
  - [x] レスポンシブ対応（モバイル用ハンバーガーメニュー）
  - [x] ログイン画面の分離（シンプルな中央配置レイアウト）

#### 4.2 ダッシュボード

- [x] `/org/:org_slug/dashboard` ページの基本実装
  - [x] 組織情報の表示
  - [x] プラン情報の表示
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

- [x] `/org/:org_slug/units` ページの基本実装
  - [x] 拠点一覧表示
  - [ ] 新規拠点作成フォーム（unit_slug 入力含む）
  - [x] 拠点編集フォーム（基本実装済み）
  - [ ] 拠点削除機能（プラン制限チェック含む）
- [x] Server Actions の基本実装
  - [x] `getUnits` / `getUnitsByOrganizationId`
  - [x] `getUnitBySlug`
  - [x] `updateUnit`
  - [ ] `createUnit`
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

- [x] UI/UX改善: 大手勤怠SaaSパターンへの統一
  - [x] 左サイドメニュー + 上部ヘッダーの実装
  - [x] レスポンシブ対応（モバイル用ハンバーガーメニュー）
  - [x] ログイン画面とアプリ画面の分離（ルートグループ）
  - [ ] フィルターバーの実装（勤怠一覧ページ）
  - [ ] テーブル構造の改善（横スクロール対応、固定列）
  - [ ] 「予定」と「実績」の横並び表示
- [ ] RLS（Row Level Security）の設定・最適化
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善
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

## 医療特化戦略版フェーズ構成

**Labor Time** は「医療・クリニック・整骨院特化」を差別化ポイントとして、以下のフェーズ構成で開発を進めます。

### 機能分類

1. **①共通コア機能** - 医療・他業種共通・必須ライン
2. **②医療特化で差別化する機能** - クリニック・整骨院の現場ニーズに特化
3. **③他業種にも効く拡張機能** - 汎用性を保ちつつ後付け可能な機能

---

### Phase A: コアMVP 🎯

**目標**: 「紙のタイムカード＋Excel」からの卒業を実現

**完了条件**: 小規模クリニックの1院長が「これだけあれば十分」と感じるライン

#### タスク

- [ ] **勤怠一覧**（Phase 4.3）
  - [ ] `/org/:org_slug/units/:unit_slug/attendances` ページの実装
  - [ ] フィルター機能（日付・月・従業員）
  - [ ] 実打刻時刻 & 丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
  - [ ] Server Action: `getAttendances`

- [ ] **勤怠詳細・修正**（Phase 4.4）
  - [ ] `/org/:org_slug/units/:unit_slug/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 管理者による手動修正フォーム（出勤/退勤時刻）
  - [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

- [ ] **サマリダッシュボード（最低限）**（Phase 4.2最小版）
  - [ ] `/org/:org_slug/dashboard` ページの実装
  - [ ] 今日の出勤状況（誰が出てるか）
  - [ ] 月次の総労働時間（院全体／従業員別）
  - [ ] Server Action: `getDashboardSummary`

- [ ] **従業員・拠点管理**（Phase 4.1 + 4.5）
  - [x] 従業員の登録/編集（Phase 4.1完了）
  - [ ] 複数拠点管理（Phase 4.5）
  - [ ] 拠点一覧表示
  - [ ] 新規拠点作成フォーム
  - [ ] 拠点編集・削除機能

- [ ] **CSV出力（最低限）**（Phase 5の一部）
  - [ ] `/org/:org_slug/units/:unit_slug/reports` ページの実装
  - [ ] 月次勤怠データのCSV出力
  - [ ] 給与計算ソフトに載せられるレベルのCSV
  - [ ] Server Action: `exportAttendancesCsv`

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: 「紙のタイムカード＋Excel」からの卒業が実現できるライン

---

### Phase B: 医療テンプレ第一弾（差別化コア） 🏥

**目標**: クリニック・整骨院の現場ニーズに特化した機能を実装

**完了条件**: この時点で「クリニック専用」を名乗れる

#### タスク

- [ ] **勤務パターンマスタ**
  - [ ] `work_patterns` テーブルの作成
  - [ ] パターン登録（早番/遅番/日勤/準夜/深夜/当直など）
  - [ ] 1パターンに「開始/終了」「休憩」「想定時間」を紐づけ
  - [ ] 管理画面でのCRUD機能
  - [ ] Server Actions: `getWorkPatterns`, `createWorkPattern`, `updateWorkPattern`, `deleteWorkPattern`

- [ ] **日跨ぎ（24:00をまたぐ勤務）の扱い**
  - [ ] 日跨ぎフラグの実装（`work_patterns.is_overnight`）
  - [ ] 夜勤 21:00〜翌9:00 などを素直に扱える計算ロジック
  - [ ] その日の実働時間・翌日の扱いが自動計算される
  - [ ] 勤怠レコードの日付判定ロジックの実装

- [ ] **所定労働時間＆残業計算**
  - [ ] 従業員ごとの所定労働時間設定（`employees.scheduled_hours_per_day`）
  - [ ] 勤務パターンに紐づけた所定時間の自動設定
  - [ ] 残業時間の自動計算（`attendances.overtime_minutes`）
  - [ ] 残業時間の表示（勤怠一覧・詳細）

- [ ] **休日・祝日設定**
  - [ ] `holidays` テーブルの作成
  - [ ] 週休日の設定（例：土日）
  - [ ] 祝日カレンダーの管理
  - [ ] 休日出勤の自動判定
  - [ ] 管理画面での設定機能

**依存関係**: Phase A

**完了条件**: クリニック・整骨院の現場ニーズに特化した機能が実装される

---

### Phase C: 医療法人向け拡張 🏥💼

**目標**: 小〜中規模の医療法人にも刺さる機能を実装

#### タスク

- [ ] **職種・資格マスタ＋手当マスタ**
  - [ ] `job_types` テーブルの作成
  - [ ] 職種登録（正看護師／准看護師／医療事務／柔整師など）
  - [ ] 手当マスタ（夜勤手当、当直手当、日祝手当 等）
  - [ ] 従業員に職種を紐づけ（`employees.job_type_id`）
  - [ ] 手当率の設定（`job_types.night_shift_rate`, `holiday_rate` 等）
  - [ ] 管理画面でのCRUD機能

- [ ] **シフト予定 vs 実績の比較表示**
  - [ ] `shifts` テーブルの作成
  - [ ] シフト表への勤務パターン割り当て
  - [ ] 実績（`attendances`）との自動紐づけ
  - [ ] 遅刻/早退/欠勤の自動検出
  - [ ] シフト表画面の実装
  - [ ] 予定 vs 実績の差分表示

- [ ] **部署／診療科単位の集計**
  - [ ] `departments` テーブルの作成（診療科・部署マスタ）
  - [ ] 従業員に部署を紐づけ（`employees.department_id`）
  - [ ] 部署単位での勤怠集計機能
  - [ ] ダッシュボードに部署別集計を追加

**依存関係**: Phase B

**完了条件**: 小〜中規模の医療法人にも刺さる機能が実装される

---

### Phase D: 休暇・申請ワークフロー＆汎用拡張 🔄

**目標**: 休暇管理とカスタマイズ性を実装

#### タスク

- [ ] **有給・休暇管理**
  - [ ] `leave_types` テーブルの作成（有給、病欠、私用休暇など）
  - [ ] `leaves` テーブルの作成（休暇申請・記録）
  - [ ] 有給休暇の付与・使用管理
  - [ ] 残日数の自動計算
  - [ ] 管理画面での休暇管理機能

- [ ] **申請フロー（休暇、打刻修正）**
  - [ ] `requests` テーブルの作成（申請マスタ）
  - [ ] 休暇申請フォーム
  - [ ] 打刻修正申請フォーム
  - [ ] 承認ワークフロー（将来拡張）

- [ ] **カスタム項目、カスタムCSVテンプレ**
  - [ ] `custom_fields` テーブルの作成
  - [ ] 従業員・勤怠レコードに追加フィールド
  - [ ] CSV出力テンプレートのカスタマイズ機能
  - [ ] 病院ごとの既存Excelフォーマットに合わせられる

- [ ] **API / Webhook（将来のフルスクラッチ連動用）**
  - [ ] REST API の実装
  - [ ] Webhook イベント（打刻、承認など）
  - [ ] 外部システム連携の基盤

**依存関係**: Phase C

**完了条件**: 休暇管理とカスタマイズ性が実装される

---

## 管理画面メニュー構成（医療特化版）

UIとしては、管理画面のメニューも「医療の現場感」で命名：

```
/org/:org_slug/
├── dashboard                    # ダッシュボード
├── attendances/                 # 勤怠
│   ├── daily                    # 日別一覧
│   └── monthly                  # 月別一覧
├── shifts/                      # シフト
│   ├── schedule                 # シフト表（予定）
│   └── patterns                 # 勤務パターン
├── staff/                       # スタッフ
│   ├── list                     # スタッフ一覧
│   └── job-types                # 職種・資格マスタ
├── reports/                     # 集計・レポート
│   ├── summary                  # 月次集計
│   └── export                   # CSV出力
└── settings/                    # 設定
    ├── work-hours               # 所定労働時間
    ├── holidays                 # 休日・祝日
    └── units                    # 拠点設定
```

---

## データベーススキーマ拡張計画

### Phase B で追加するテーブル

```sql
-- 勤務パターンマスタ
CREATE TABLE work_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- '早番', '遅番', '夜勤', '当直' など
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  scheduled_hours DECIMAL(4,2) NOT NULL,
  is_overnight BOOLEAN DEFAULT FALSE, -- 日跨ぎフラグ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 休日・祝日マスタ
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL, -- '元日', 'クリスマス' など
  is_recurring BOOLEAN DEFAULT FALSE, -- 毎年繰り返すか
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (unit_id, date)
);

-- attendances テーブルに追加
ALTER TABLE attendances ADD COLUMN overtime_minutes INTEGER DEFAULT 0;
ALTER TABLE attendances ADD COLUMN work_pattern_id UUID REFERENCES work_patterns(id);
```

### Phase C で追加するテーブル

```sql
-- 職種・資格マスタ
CREATE TABLE job_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- '正看護師', '准看護師', '医療事務' など
  allowance_rate DECIMAL(3,2) DEFAULT 1.0, -- 基本手当率
  night_shift_rate DECIMAL(3,2) DEFAULT 1.25, -- 夜勤手当率
  holiday_rate DECIMAL(3,2) DEFAULT 1.35, -- 休日手当率
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- シフト予定
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  work_pattern_id UUID REFERENCES work_patterns(id),
  scheduled_clock_in TIMESTAMPTZ,
  scheduled_clock_out TIMESTAMPTZ,
  attendance_id UUID REFERENCES attendances(id), -- 実績との紐づけ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 部署・診療科マスタ
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- '整形外科', '内科', 'リハビリ' など
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- employees テーブルに追加
ALTER TABLE employees ADD COLUMN job_type_id UUID REFERENCES job_types(id);
ALTER TABLE employees ADD COLUMN department_id UUID REFERENCES departments(id);
ALTER TABLE employees ADD COLUMN scheduled_hours_per_day DECIMAL(4,2) DEFAULT 8.0;
```

### Phase D で追加するテーブル

```sql
-- 休暇種別マスタ
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- '有給休暇', '病欠', '私用休暇' など
  is_paid BOOLEAN DEFAULT FALSE, -- 有給かどうか
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 休暇申請・記録
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(4,2) NOT NULL, -- 日数
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 申請マスタ
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'leave', 'attendance_correction' など
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  content JSONB, -- 申請内容（型によって異なる）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- カスタムフィールド
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'number', 'date' など
  target_table TEXT NOT NULL, -- 'employees', 'attendances' など
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理（Phase Dで実装予定）
* 休日・祝日設定（Phase Bで実装予定）
* シフト管理（予定 vs 実績）（Phase Cで実装予定）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応
* enterprise 階層の追加（3階層への拡張）
* プラン管理・課金機能
* 複数 organization への所属管理UI
* グラフ・可視化機能（後回し）
* AI によるシフト自動生成
* アラート機能（残業超過、36協定超過など）
* Web申請フロー（休暇申請、打刻修正申請）（Phase Dで実装予定）
* 外部サービス連携（Googleカレンダー、LINE通知など）

---

## 進捗管理

### 現在のフェーズ

**Phase 2: 認証・基本設定の再実装** - 完了（ルーティング構造・unit設定ページ・organization設定ページ実装完了）
**Phase 3: タブレット打刻機能（MVP）** - 完了（unit_id/employee_id対応済み）
**Phase 4.1: 従業員管理** - 完了
**Phase A: コアMVP** - 進行中（4.1完了、4.2-4.5未実装）

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

### 次のマイルストーン（医療特化戦略版）

1. ✅ Phase 1 の完了（DBスキーマ再設計・移行）
2. ✅ Phase 2 の完了（認証・基本設定の再実装）
3. ✅ Phase 3 の完了（MVP: 打刻機能）
4. ✅ Phase 4.1 の完了（従業員管理）
5. 🔄 **Phase A: コアMVP** - 進行中
   - 勤怠一覧（4.3）
   - 勤怠詳細・修正（4.4）
   - サマリダッシュボード（4.2最小版）
   - 拠点管理（4.5）
   - CSV出力（最低限）
6. ⏳ Phase B: 医療テンプレ第一弾（差別化コア）
7. ⏳ Phase C: 医療法人向け拡張
8. ⏳ Phase D: 休暇・申請ワークフロー＆汎用拡張

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する
* 旧設計から新設計への移行時は、既存データの整合性に注意する
* **医療特化戦略版**: Phase A（コアMVP）を最優先に実装し、「紙のタイムカード＋Excel」からの卒業を実現
* Phase B以降は医療・クリニック・整骨院の現場ニーズに特化した差別化機能として実装

---

最終更新: 2025-12-09（医療特化戦略版フェーズ構成追加、Phase A-B-C-D定義完了）
