/**
 * スタッフのPIN再設定スクリプト
 * 
 * 使用方法:
 * 1. .env.local に Supabase の環境変数を設定
 * 2. npx tsx scripts/reset-staff-pin.ts <スタッフ名> <新しいPIN>
 * 
 * 例:
 * npx tsx scripts/reset-staff-pin.ts "山田太郎" 1234
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// .env.localから環境変数を読み込む
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { hashPin } from '../lib/utils/pin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetStaffPin() {
  // コマンドライン引数の取得
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.error('使用方法: npx tsx scripts/reset-staff-pin.ts <スタッフ名> <新しいPIN>')
    console.error('例: npx tsx scripts/reset-staff-pin.ts "山田太郎" 1234')
    process.exit(1)
  }

  const staffName = args[0]
  const pin = args[1]

  // バリデーション
  if (!staffName || staffName.trim() === '') {
    console.error('エラー: スタッフ名が指定されていません')
    process.exit(1)
  }

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    console.error('エラー: PINは4桁の数字である必要があります')
    process.exit(1)
  }

  // スタッフを検索
  console.log(`スタッフ "${staffName}" を検索しています...`)
  const { data: staffs, error: searchError } = await supabase
    .from('staffs')
    .select('id, name, is_active')
    .eq('name', staffName.trim())
    .limit(1)

  if (searchError) {
    console.error('エラー: スタッフの検索に失敗しました', searchError.message)
    process.exit(1)
  }

  if (!staffs || staffs.length === 0) {
    console.error(`エラー: スタッフ "${staffName}" が見つかりません`)
    process.exit(1)
  }

  const staff = staffs[0]
  console.log(`スタッフが見つかりました: ${staff.name} (ID: ${staff.id})`)

  // PINをハッシュ化
  console.log('PINをハッシュ化しています...')
  const pinHash = await hashPin(pin)

  // PINを更新
  console.log('PINを更新しています...')
  const { data, error } = await supabase
    .from('staffs')
    .update({ pin_hash: pinHash })
    .eq('id', staff.id)
    .select('id, name, is_active')
    .single()

  if (error) {
    console.error('エラー:', error.message)
    process.exit(1)
  }

  console.log('\n✅ PINの更新が完了しました:')
  console.log(JSON.stringify({
    id: data.id,
    name: data.name,
    is_active: data.is_active
  }, null, 2))
  console.log(`\n新しいPIN: ${pin}`)
  console.log('⚠️  PINは安全に保管してください')
}

resetStaffPin()
  .then(() => {
    console.log('\n完了')
    process.exit(0)
  })
  .catch((error) => {
    console.error('エラーが発生しました:', error)
    process.exit(1)
  })

