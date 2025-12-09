# labortime.work DNS設定手順

handra.jpの設定を参考に、labortime.workのDNS設定を行います。

## 前提条件

- Cloudflareでlabortime.workのドメインを追加済み
- ネームサーバーがCloudflareに切り替わっている
- Vercelでlabortime.workをプロジェクトに追加済み（または追加予定）

## 運用方針

**現時点**: Xserverのメールサーバーのみを使用（Resendは使用しない）
- 理由: 収益が上がっていないため、Resend Pro（$20/月）は見送り
- メールフォームは将来的に実装予定だが、現時点ではLPも未完成

**将来の拡張**: 必要に応じてResendを追加可能

## DNS設定内容（Xserverのみ版）

### 1. Aレコード（ルートドメイン）

**設定値:**
- **Type**: A
- **Name**: `labortime.work` (または `@`)
- **IPv4 address**: `76.76.21.21`
- **Proxy status**: DNS only（プロキシ無効）
- **TTL**: Auto

**説明**: VercelのIPアドレス。ルートドメインをVercelに接続します。

---

### 2. CNAMEレコード（wwwサブドメイン）

**設定値:**
- **Type**: CNAME
- **Name**: `www`
- **Target**: `cname.vercel-dns.com.`
- **Proxy status**: DNS only（プロキシ無効）
- **TTL**: Auto

**説明**: wwwサブドメインをVercelに接続します。

---

### 3. MXレコード（メール受信）

**設定値:**
- **Type**: MX
- **Name**: `labortime.work` (または `@`)
- **Priority**: `10`
- **Mail server**: `sv16631.xserver.jp.`
- **TTL**: Auto

**説明**: Xserverでのメール受信設定

---

### 4. TXTレコード（SPFレコード）

**設定値:**
- **Type**: TXT
- **Name**: `labortime.work` (または `@`)
- **Content**: `v=spf1 +a:sv16631.xserver.jp +mx ~all`
- **TTL**: Auto

**説明**: Xserver用のSPFレコード（Resendは含まない）

**注意**: 現在設定されている `include:resend.com` は削除してください（Resend未使用のため）

---

## Cloudflareでの設定手順

### ステップ1: Cloudflareダッシュボードにログイン

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/)にログイン
2. labortime.workのドメインを選択

### ステップ2: DNSレコードの追加

1. 左メニューから「DNS」を選択
2. 「レコードを追加」をクリック

#### Aレコードの追加
- Type: `A` を選択
- Name: `@` または `labortime.work` を入力
- IPv4 address: `76.76.21.21` を入力
- Proxy status: **DNS only**（オレンジの雲アイコンをクリックしてグレーにする）
- 「保存」をクリック

#### CNAMEレコードの追加
- Type: `CNAME` を選択
- Name: `www` を入力
- Target: `cname.vercel-dns.com.` を入力（末尾のドットを忘れずに）
- Proxy status: **DNS only**
- 「保存」をクリック

#### MXレコードの追加
- Type: `MX` を選択
  - Name: `@` または `labortime.work`
  - Priority: `10`
  - Mail server: `sv16631.xserver.jp.`（末尾のドットを忘れずに）
  - Proxy status: DNS only（MXレコードは自動的にDNS only）
  - 「保存」をクリック

#### TXTレコードの追加
- Type: `TXT` を選択
  - Name: `@` または `labortime.work`
  - Content: `v=spf1 +a:sv16631.xserver.jp +mx ~all`
  - 「保存」をクリック

**⚠️ 既存のResend関連レコードの削除:**

現在設定されているResend関連のレコードは削除してください：
- `send.labortime.work` のMXレコード（Amazon SES用）
- `send.labortime.work` のTXTレコード（SPF）
- `resend._domainkey.labortime.work` のTXTレコード（DKIM）
- SPFレコードから `include:resend.com` を削除

**削除手順:**
1. Cloudflareダッシュボード → DNS
2. 上記のレコードを1つずつ選択
3. 「削除」をクリック

### ステップ3: Vercelでのドメイン設定

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Domains に移動
4. `labortime.work` と `www.labortime.work` を追加
5. DNS設定が正しく反映されるまで数分〜数時間待つ

---

## 設定確認

### DNS設定の確認

以下のコマンドでDNS設定を確認できます：

```bash
# Aレコードの確認
dig labortime.work A

# CNAMEレコードの確認
dig www.labortime.work CNAME

# MXレコードの確認
dig labortime.work MX

# TXTレコードの確認
dig labortime.work TXT
```

### 動作確認

1. **Webサイト**: `https://labortime.work` と `https://www.labortime.work` にアクセスしてVercelのサイトが表示されることを確認
2. **メール**: Xserverでメールエイリアスを設定し、Gmailでメールを受信できることを確認
3. **SPFレコード**: `dig labortime.work TXT` でSPFレコードが正しく設定されていることを確認（`include:resend.com` が含まれていないことを確認）

---

## メール運用方法

### メールエイリアス + Gmail転送

通常のメール（info@labortime.work など）は、Xserverのメールエイリアス機能を使ってGmailで取得する設定になっています。

**設定方法:**
1. Xserverのサーバーパネルにログイン
2. 「メール設定」→「メールアカウント設定」
3. メールエイリアスを作成（例: `info@labortime.work`）
4. 転送先にGmailアドレスを設定

**メリット:**
- Gmailの豊富な機能（検索、フィルタ、ラベルなど）を活用できる
- 複数のメールアドレスを1つのGmailアカウントで管理できる
- スマートフォンでもGmailアプリで簡単に確認できる

**メールフォーム実装時の考慮事項:**
- メールフォームからの送信も、XserverのSMTP経由でGmailに転送される
- 送信元アドレスは `noreply@labortime.work` や `contact@labortime.work` などを使用
- 受信先は `info@labortime.work` などのエイリアスに送信し、Gmailで受信

---

## 将来の拡張: Resendの追加（オプション）

メールフォーム機能を実装する際に、Resendを追加する場合は以下の設定を追加します：

1. **Resend Proプラン（$20/月）にアップグレード**
2. **Resendダッシュボードで `labortime.work` を追加**
3. **DNS設定を追加:**
   - SPFレコードに `include:resend.com` を追加
   - `resend._domainkey` のTXTレコードを追加（Resendダッシュボードから取得）
   - 必要に応じて `send.labortime.work` のMX/TXTレコードを追加

詳細は、Resendの公式ドキュメントを参照してください。

---

## 参考: handra.jpの設定

参考ファイル: `docs/handra.jp.txt`

---

## 注意事項

- DNS設定の反映には数分〜数時間かかる場合があります
- Proxy statusは「DNS only」に設定してください（メールとVercelの正常動作のため）
- MXレコードとTXTレコードは自動的に「DNS only」になります
- 現時点ではResendは使用しないため、Resend関連のレコードは削除してください
- メールフォーム機能を実装する際は、XserverのSMTP経由で送信するか、Resendを追加するかを検討してください

---

最終更新: 2025-12-09

