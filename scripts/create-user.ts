/**
 * ユーザーアカウント作成スクリプト（organizationベース）
 * 
 * 使用方法:
 * npx tsx scripts/create-user.ts <organization_slug> <email> <password>
 * 
 * 例:
 * npx tsx scripts/create-user.ts demo admin@example.com password123
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const organizationSlug = process.argv[2]
const email = process.argv[3]
const password = process.argv[4]

if (!organizationSlug || !email || !password) {
  console.error('使用方法: npx tsx scripts/create-user.ts <organization_slug> <email> <password>')
  console.error('例: npx tsx scripts/create-user.ts demo admin@example.com password123')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  console.log('ユーザーアカウントの作成を開始します...')
  console.log(`組織スラッグ: ${organizationSlug}`)
  console.log(`メールアドレス: ${email}`)

  // 1. organizationを取得
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('organization_slug', organizationSlug)
    .single()

  if (orgError || !organization) {
    console.error('エラー: 組織が見つかりません。')
    console.error(`組織スラッグ "${organizationSlug}" が存在するか確認してください。`)
    process.exit(1)
  }

  console.log(`組織ID: ${organization.id}`)
  console.log(`組織名: ${organization.name}`)

  // 2. Supabase Authでユーザーを作成（既存の場合は取得）
  let userId: string
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // メール確認をスキップ
  })

  if (authError) {
    // 既存ユーザーの場合
    if (authError.message.includes('already been registered')) {
      console.log('既存のユーザーが見つかりました。ユーザーIDを取得します...')
      // 既存ユーザーのIDを取得
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) {
        console.error('エラー: ユーザー一覧の取得に失敗しました:', listError.message)
        process.exit(1)
      }
      const existingUser = existingUsers.users.find(u => u.email === email)
      if (!existingUser) {
        console.error('エラー: 既存ユーザーが見つかりませんでした')
        process.exit(1)
      }
      userId = existingUser.id
      console.log(`既存ユーザーID: ${userId}`)
    } else {
      console.error('エラー: ユーザーの作成に失敗しました:', authError.message)
      process.exit(1)
    }
  } else {
    if (!authData.user) {
      console.error('エラー: ユーザー情報が取得できませんでした')
      process.exit(1)
    }
    userId = authData.user.id
    console.log(`新規ユーザーID: ${userId}`)
  }

  // 3. membersテーブルに登録（既に登録されている場合はスキップ）
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .insert({
      organization_id: organization.id,
      user_id: userId,
      role: 'owner',
    })
    .select()
    .single()

  if (memberError) {
    // 既に登録されている場合
    if (memberError.message.includes('duplicate') || memberError.code === '23505') {
      console.log('既にこの組織のメンバーとして登録されています。')
      // 既存のメンバー情報を取得
      const { data: existingMember } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('user_id', userId)
        .single()
      
      if (existingMember) {
        console.log('✅ 既存のメンバー情報を確認しました:')
        console.log(`   ロール: ${existingMember.role}`)
      }
    } else {
      console.error('エラー: メンバー情報の登録に失敗しました:', memberError.message)
      console.error(`手動で以下のSQLを実行してください:`)
      console.error(`INSERT INTO public.members (organization_id, user_id, role) VALUES ('${organization.id}', '${userId}', 'owner') ON CONFLICT (organization_id, user_id) DO NOTHING;`)
      process.exit(1)
    }
  } else {
    console.log('✅ メンバー情報を登録しました')
  }

  console.log('')
  console.log('✅ 処理が完了しました:')
  console.log(`   組織: ${organization.name} (${organizationSlug})`)
  console.log(`   メールアドレス: ${email}`)
  console.log(`   ユーザーID: ${userId}`)
  console.log(`   ロール: owner`)
  console.log('')
  console.log(`ログインURL: http://localhost:3000/org/${organizationSlug}/login`)
}

createUser()
  .then(() => {
    console.log('完了')
    process.exit(0)
  })
  .catch((error) => {
    console.error('予期しないエラー:', error)
    process.exit(1)
  })

