/**
 * 初期クリニックデータの投入スクリプト
 * 
 * 使用方法:
 * 1. .env.local に Supabase の環境変数を設定
 * 2. npx tsx scripts/init-clinic.ts を実行
 * 
 * または、Supabase Dashboard の SQL Editor で直接実行:
 * INSERT INTO public.clinics (name, timezone, rounding_unit, rounding_mode)
 * VALUES ('よねだ鍼灸整骨院', 'Asia/Tokyo', 5, 'nearest');
 */

import { createClient } from '@supabase/supabase-js'

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

async function initClinic() {
  console.log('初期クリニックデータの投入を開始します...')

  const { data, error } = await supabase
    .from('clinics')
    .insert({
      name: 'よねだ鍼灸整骨院',
      timezone: 'Asia/Tokyo',
      rounding_unit: 5,
      rounding_mode: 'nearest'
    })
    .select()
    .single()

  if (error) {
    console.error('エラー:', error.message)
    process.exit(1)
  }

  console.log('クリニックデータの投入が完了しました:')
  console.log(JSON.stringify(data, null, 2))
}

initClinic()
  .then(() => {
    console.log('完了')
    process.exit(0)
  })
  .catch((error) => {
    console.error('エラーが発生しました:', error)
    process.exit(1)
  })









