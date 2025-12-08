'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentMembers, getOrganizationIdBySlug } from '@/lib/auth/utils'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * ログイン（organization_slug を指定）
 */
export async function signIn(
  organizationSlug: string,
  email: string,
  password: string
): Promise<{ error?: string }> {
  try {
    // organization の存在確認
    const organizationId = await getOrganizationIdBySlug(organizationSlug)
    if (!organizationId) {
      return { error: '組織が見つかりません' }
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: `ログインエラー: ${error.message}` }
    }

    if (!data.user) {
      return { error: 'ログインに失敗しました: ユーザー情報が取得できませんでした' }
    }

    // ユーザーがこの organization の members テーブルに登録されているか確認
    const supabaseAdmin = getSupabaseAdmin()
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('organization_id', organizationId)
      .single()

    if (memberError || !member) {
      return {
        error: 'ログインエラー: この組織のメンバーとして登録されていません。',
      }
    }

    revalidatePath('/', 'layout')
    redirect(`/org/${organizationSlug}/dashboard`)
  } catch (err) {
    // Next.js の redirect() は NEXT_REDIRECT というエラーとしてスローされる。
    // これは正常な挙動なので、そのまま再スローして Next.js に処理を任せる。
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err
    }

    console.error('Sign in error:', err)
    return {
      error: `予期しないエラーが発生しました: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`,
    }
  }
}

/**
 * ログアウト
 */
export async function signOut(organizationSlug?: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')

  if (organizationSlug) {
    redirect(`/org/${organizationSlug}/login`)
  } else {
    redirect('/')
  }
}

/**
 * 現在のユーザーが所属する organization 一覧を取得
 */
export async function getUserOrganizations(): Promise<
  Array<{ organization_slug: string; name: string; role: string }>
> {
  try {
    const members = await getCurrentMembers()
    if (members.length === 0) {
      return []
    }

    const supabaseAdmin = getSupabaseAdmin()
    const organizationIds = members.map(m => m.organization_id)

    const { data: organizations, error } = await supabaseAdmin
      .from('organizations')
      .select('id, organization_slug, name')
      .in('id', organizationIds)

    if (error || !organizations) {
      return []
    }

    // member の role と organization 情報を結合
    return organizations.map(org => {
      const member = members.find(m => m.organization_id === org.id)
      return {
        organization_slug: org.organization_slug,
        name: org.name,
        role: member?.role || 'staff',
      }
    })
  } catch (error) {
    console.error('Error getting user organizations:', error)
    return []
  }
}

// 開発用: パスワードリセット機能
export async function resetPassword(organizationSlug: string, email: string) {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'この機能は開発環境でのみ利用できます' }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      }/org/${organizationSlug}/reset-password`,
    })

    if (error) {
      return { error: `パスワードリセットエラー: ${error.message}` }
    }

    return { success: true, message: 'パスワードリセットメールを送信しました' }
  } catch (err) {
    return { error: `予期しないエラー: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}
