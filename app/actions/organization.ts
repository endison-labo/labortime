'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentMemberBySlug, getOrganizationIdBySlug } from '@/lib/auth/utils'
import { generateOrganizationSlug } from '@/lib/utils/organization-slug'
import type { Organization, OrganizationInsert, OrganizationUpdate } from '@/types/database'
import { revalidatePath } from 'next/cache'

/**
 * organization_slug から organization 情報を取得
 * 最適化: organization_slugで直接取得（キャッシュ活用のため、organizationId経由ではなく直接取得）
 */
import { unstable_cache } from 'next/cache'

async function _getOrganizationBySlugUncached(
  organizationSlug: string
): Promise<Organization | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('organization_slug', organizationSlug)
      .single()

    if (error) {
      console.error('Error fetching organization:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        organizationSlug,
      })
      return null
    }

    if (!data) {
      console.error('Organization not found:', { organizationSlug })
      return null
    }

    return data as Organization
  } catch (error) {
    console.error('Error in getOrganizationBySlug:', {
      error: error instanceof Error ? error.message : String(error),
      organizationSlug,
    })
    return null
  }
}

export async function getOrganizationBySlug(
  organizationSlug: string
): Promise<Organization | null> {
  // 5分間キャッシュ（organization情報は変更頻度が低い）
  return unstable_cache(
    async () => _getOrganizationBySlugUncached(organizationSlug),
    ['organization', organizationSlug],
    { revalidate: 300 }
  )()
}

/**
 * 新しい organization を作成
 */
export async function createOrganization(
  data: Omit<OrganizationInsert, 'organization_slug'>
): Promise<{ organization?: Organization; error?: string }> {
  try {
    // organization_slug を生成（ユニークチェック付き）
    let organizationSlug = generateOrganizationSlug()
    const supabaseAdmin = getSupabaseAdmin()

    // ユニークチェック（最大10回試行）
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('organization_slug', organizationSlug)
        .single()

      if (!existing) {
        break // ユニークな slug が見つかった
      }

      organizationSlug = generateOrganizationSlug()
      attempts++
    }

    if (attempts >= 10) {
      return { error: 'organization_slug の生成に失敗しました。再試行してください。' }
    }

    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .insert({
        organization_slug: organizationSlug,
        name: data.name,
        plan: data.plan || 'single',
      })
      .select()
      .single()

    if (error || !organization) {
      console.error('Error creating organization:', error)
      return { error: error?.message || '組織の作成に失敗しました' }
    }

    revalidatePath('/', 'layout')
    return { organization: organization as Organization }
  } catch (error) {
    console.error('Error in createOrganization:', error)
    return { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' }
  }
}

/**
 * organization 情報を更新
 */
export async function updateOrganization(
  organizationSlug: string,
  updates: OrganizationUpdate
): Promise<{ error?: string }> {
  try {
    // アクセス権限チェック
    const member = await getCurrentMemberBySlug(organizationSlug)
    if (!member) {
      return { error: 'アクセス権限がありません' }
    }

    // owner または admin のみ更新可能
    if (member.role !== 'owner' && member.role !== 'admin') {
      return { error: '更新権限がありません' }
    }

    // memberからorganization_idを直接取得（追加のクエリ不要）
    const organizationId = member.organization_id

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)

    if (error) {
      console.error('Error updating organization:', error)
      return { error: error.message || '組織の更新に失敗しました' }
    }

    revalidatePath(`/org/${organizationSlug}`, 'layout')
    return {}
  } catch (error) {
    console.error('Error in updateOrganization:', error)
    return { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' }
  }
}

