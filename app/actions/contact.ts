'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ContactFormData {
  companyName: string
  contactName: string
  email: string
  message: string
}

export async function submitContactForm(
  data: ContactFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // バリデーション
    if (!data.companyName || !data.contactName || !data.email || !data.message) {
      return { success: false, error: 'すべての項目を入力してください' }
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return { success: false, error: '正しいメールアドレスを入力してください' }
    }

    // データベースに保存
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('contact_inquiries')
      .insert({
        company_name: data.companyName,
        contact_name: data.contactName,
        email: data.email,
        message: data.message,
      })

    if (error) {
      console.error('Error saving contact inquiry:', error)
      // テーブルが存在しない場合でも、エラーメッセージを返す
      if (error.code === '42P01') {
        return { success: false, error: 'お問い合わせ機能は準備中です。しばらくお待ちください。' }
      }
      return { success: false, error: '送信に失敗しました。もう一度お試しください。' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error in submitContactForm:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '送信に失敗しました',
    }
  }
}

