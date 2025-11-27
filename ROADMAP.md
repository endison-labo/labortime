# 実装ロードマップ

勤怠管理システムの実装計画と進捗管理用ドキュメントです。

## 実装フェーズ

### Phase 1: プロジェクト基盤・DBスキーマ ✅

**目標**: 開発環境の構築とデータベーススキーマの作成

#### タスク

- [ ] Next.js プロジェクトの初期化（TypeScript, Tailwind CSS）
- [ ] Supabase プロジェクトの作成・接続設定
- [ ] 環境変数の設定（`.env.local`）
- [ ] DB スキーマの作成
  - [ ] `clinics` テーブル
  - [ ] `staffs` テーブル
  - [ ] `admins` テーブル
  - [ ] `attendances` テーブル
  - [ ] `attendance_logs` テーブル
  - [ ] 必要な ENUM 型の作成
  - [ ] インデックスの作成
- [ ] Supabase クライアントのセットアップ
- [ ] TypeScript 型定義の作成（DB スキーマ対応）

**依存関係**: なし

**完了条件**: DB スキーマが適用され、Supabase への接続が確認できる

---

### Phase 2: 認証・基本設定 🔄

**目標**: 管理者認証とクリニック設定機能の実装

#### タスク

- [ ] Supabase Auth の設定
- [ ] `/admin/login` ページの実装
- [ ] 管理者ログイン機能（Server Action）
- [ ] セッション管理・認証ミドルウェア
- [ ] `/admin/settings` ページの実装
  - [ ] クリニック設定の取得
  - [ ] クリニック設定の更新（タイムゾーン、丸め単位、丸めモード）
- [ ] 初期クリニックデータの投入スクリプト

**依存関係**: Phase 1

**完了条件**: 管理者がログインでき、クリニック設定を変更できる

---

### Phase 3: タブレット打刻機能（MVP） 🔄

**目標**: PIN 認証による出勤/退勤打刻機能の実装

#### タスク

- [ ] `/terminal` ページの実装
  - [ ] PIN 入力画面（数字キーパッド）
  - [ ] PIN マスク表示
  - [ ] 認証後の状態表示
- [ ] PIN ハッシュ化・検証ロジック
- [ ] 時刻丸めロジックの実装
  - [ ] `rounding_unit` / `rounding_mode` に基づく計算
  - [ ] タイムゾーン変換処理
- [ ] 出勤打刻機能（Server Action）
  - [ ] `clockInByPin` の実装
  - [ ] `clock_in_actual` / `clock_in_effective` の記録
  - [ ] `attendance_logs` への記録
- [ ] 退勤打刻機能（Server Action）
  - [ ] `clockOutByPin` の実装
  - [ ] `clock_out_actual` / `clock_out_effective` の記録
  - [ ] `work_minutes_effective` の計算・更新
  - [ ] `attendance_logs` への記録
- [ ] 打刻完了後の自動リセット（5-10秒）

**依存関係**: Phase 1, Phase 2

**完了条件**: PIN 入力で出勤/退勤打刻ができ、丸め後の時刻が正しく記録される

---

### Phase 4: 管理画面（基本機能） 📋

**目標**: スタッフ管理と勤怠データの確認機能

#### 4.1 スタッフ管理

- [ ] `/admin/staffs` ページの実装
  - [ ] スタッフ一覧表示
  - [ ] 新規スタッフ作成フォーム
  - [ ] スタッフ編集フォーム
  - [ ] PIN 再発行機能
  - [ ] アクティブ/非アクティブ切り替え
- [ ] Server Actions の実装
  - [ ] `getStaffs`
  - [ ] `createStaff`
  - [ ] `updateStaff`
  - [ ] `resetStaffPin`

#### 4.2 ダッシュボード

- [ ] `/admin/dashboard` ページの実装
  - [ ] 指定月のサマリー表示
  - [ ] 総労働時間（クリニック合計）
  - [ ] スタッフ別労働時間ランキング
  - [ ] 支給額概算
  - [ ] 今日の勤怠状況（出勤中スタッフ一覧）
- [ ] Server Action: `getDashboardSummary`

#### 4.3 勤怠一覧

- [ ] `/admin/attendances` ページの実装
  - [ ] フィルター機能（日付・月・スタッフ）
  - [ ] 勤怠データ一覧表示
  - [ ] 実打刻/丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
- [ ] Server Action: `getAttendances`

#### 4.4 勤怠詳細・修正

- [ ] `/admin/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 手修正フォーム（出勤/退勤時刻）
- [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: スタッフの追加・編集ができ、勤怠データの確認・修正ができる

---

### Phase 5: レポート・出力機能 📊

**目標**: CSV/PDF レポート出力機能の実装

#### タスク

- [ ] `/admin/reports` ページの実装
  - [ ] 期間選択（月単位 or 日付範囲）
  - [ ] スタッフ選択（複数選択可）
  - [ ] 出力形式選択（CSV / PDF）
- [ ] CSV 出力機能
  - [ ] Server Action: `exportAttendancesCsv`
  - [ ] `attendances` JOIN `staffs` のデータ取得
  - [ ] CSV フォーマット変換
  - [ ] ダウンロード処理
- [ ] PDF 出力機能
  - [ ] PDF 生成ライブラリの選定・導入（例: puppeteer, jsPDF）
  - [ ] Server Action: `generateReportPdf`
  - [ ] HTML テンプレートの作成
  - [ ] PDF レイアウトの実装
  - [ ] ダウンロード処理

**依存関係**: Phase 4

**完了条件**: 指定期間・スタッフの勤怠データを CSV/PDF で出力できる

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

**依存関係**: Phase 1-5

**完了条件**: システムが安定して動作し、ユーザビリティが向上している

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 多医院対応（`clinics` をフル活用）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応

---

## 進捗管理

### 現在のフェーズ

**Phase 1: プロジェクト基盤・DBスキーマ** - 未着手

### 完了済みタスク

（実装開始後に更新）

### 次のマイルストーン

1. Phase 1 の完了
2. Phase 2 の完了（管理者ログイン可能）
3. Phase 3 の完了（MVP: 打刻機能）
4. Phase 4 の完了（管理画面基本機能）
5. Phase 5 の完了（レポート出力）

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する

---

最終更新: 2025-01-XX


