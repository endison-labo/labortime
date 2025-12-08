import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import type { Member, Organization, Unit } from '@/types/database'

/**
 * organization_slug から organization_id への変換
 */
export async function getOrganizationIdBySlug(organizationSlug: string): Promise<string | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_slug', organizationSlug)
      .single()

    if (error || !data) {
      return null
    }

    return data.id
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting organization ID by slug:', error)
    }
    return null
  }
}

/**
 * organization_id から organization 情報を取得
 */
export async function getOrganizationById(organizationId: string): Promise<Organization | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Organization
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting organization by ID:', error)
    }
    return null
  }
}

/**
 * unit_slug から unit_id への変換（organization_id が必要）
 */
export async function getUnitIdBySlug(
  organizationId: string,
  unitSlug: string
): Promise<string | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('units')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('unit_slug', unitSlug)
      .single()

    if (error || !data) {
      return null
    }

    return data.id
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting unit ID by slug:', error)
    }
    return null
  }
}

/**
 * unit_id から unit 情報を取得
 */
export async function getUnitById(unitId: string): Promise<Unit | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('id', unitId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Unit
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting unit by ID:', error)
    }
    return null
  }
}

/**
 * 現在のセッションからメンバー情報を取得
 * ユーザーが所属する organization のリストを返す
 */
export async function getCurrentMembers(): Promise<Member[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    // members テーブルからメンバー情報を取得（複数の organization に所属可能）
    const supabaseAdmin = getSupabaseAdmin()
    const { data: members, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('user_id', user.id)

    if (error || !members) {
      return []
    }

    return members as Member[]
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting current members:', error)
    }
    return []
  }
}

/**
 * 指定された organization に所属するメンバー情報を取得
 */
export async function getCurrentMember(organizationId: string): Promise<Member | null> {
  try {
    const members = await getCurrentMembers()
    return members.find(m => m.organization_id === organizationId) || null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting current member:', error)
    }
    return null
  }
}

/**
 * organization_slug から現在のユーザーのメンバー情報を取得
 */
export async function getCurrentMemberBySlug(organizationSlug: string): Promise<Member | null> {
  try {
    const organizationId = await getOrganizationIdBySlug(organizationSlug)
    if (!organizationId) {
      return null
    }

    return await getCurrentMember(organizationId)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting current member by slug:', error)
    }
    return null
  }
}

/**
 * ユーザーが指定された organization にアクセス権限があるかチェック
 */
export async function hasAccessToOrganization(organizationId: string): Promise<boolean> {
  const member = await getCurrentMember(organizationId)
  return member !== null
}

/**
 * ユーザーが指定された organization_slug にアクセス権限があるかチェック
 */
export async function hasAccessToOrganizationBySlug(organizationSlug: string): Promise<boolean> {
  const member = await getCurrentMemberBySlug(organizationSlug)
  return member !== null
}

/**
 * ユーザーがログインしているかチェック
 */
export async function isAuthenticated(): Promise<boolean> {
  const members = await getCurrentMembers()
  return members.length > 0
}

// ============================================================================
// 後方互換性のための関数（移行期間中のみ使用）
// ============================================================================

/**
 * @deprecated 後方互換性のため。getCurrentMemberBySlug を使用してください
 */
export async function getCurrentAdmin(): Promise<Member | null> {
  const members = await getCurrentMembers()
  // 最初のメンバーを返す（旧実装との互換性のため）
  return members.length > 0 ? members[0] : null
}
