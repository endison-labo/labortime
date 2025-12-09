/**
 * 管理者アカウント作成スクリプト
 * 
 * 使用方法:
 * npx tsx scripts/create-admin.ts <email> <password>
 * 
 * 例:
 * npx tsx scripts/create-admin.ts admin@example.com password123
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('使用方法: npx tsx scripts/create-admin.ts <email> <password>')
  console.error('例: npx tsx scripts/create-admin.ts admin@example.com password123')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  console.log('管理者アカウントの作成を開始します...')
  console.log(`メールアドレス: ${email}`)

  // 1. クリニックIDを取得（最初のクリニックを使用）
  const { data: clinics, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .limit(1)

  if (clinicError || !clinics || clinics.length === 0) {
    console.error('エラー: クリニックが見つかりません。先に init-clinic.ts を実行してください。')
    process.exit(1)
  }

  const clinicId = clinics[0].id
  console.log(`クリニックID: ${clinicId}`)

  // 2. Supabase Authでユーザーを作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // メール確認をスキップ
  })

  if (authError) {
    console.error('エラー: ユーザーの作成に失敗しました:', authError.message)
    process.exit(1)
  }

  if (!authData.user) {
    console.error('エラー: ユーザー情報が取得できませんでした')
    process.exit(1)
  }

  console.log(`ユーザーID: ${authData.user.id}`)

  // 3. adminsテーブルに登録
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .insert({
      clinic_id: clinicId,
      user_id: authData.user.id,
      role: 'owner',
    })
    .select()
    .single()

  if (adminError) {
    console.error('エラー: 管理者情報の登録に失敗しました:', adminError.message)
    // ユーザーは作成されているので、手動でadminsテーブルに登録する必要がある
    console.error(`手動で以下のSQLを実行してください:`)
    console.error(`INSERT INTO public.admins (clinic_id, user_id, role) VALUES ('${clinicId}', '${authData.user.id}', 'owner');`)
    process.exit(1)
  }

  console.log('管理者アカウントの作成が完了しました:')
  console.log(JSON.stringify(adminData, null, 2))
  console.log('\nログイン情報:')
  console.log(`メールアドレス: ${email}`)
  console.log(`パスワード: ${password}`)
}

createAdmin()
  .then(() => {
    console.log('\n完了')
    process.exit(0)
  })
  .catch((error) => {
    console.error('エラーが発生しました:', error)
    process.exit(1)
  })



