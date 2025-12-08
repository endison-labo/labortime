'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import {
  getCurrentMemberBySlug,
  getOrganizationIdBySlug,
  getUnitIdBySlug,
} from '@/lib/auth/utils'
import type { Unit, UnitInsert, UnitUpdate } from '@/types/database'
import { revalidatePath } from 'next/cache'

/**
 * organization に所属する unit 一覧を取得
 */
export async function getUnitsByOrganization(
  organizationSlug: string
): Promise<{ units?: Unit[]; error?: string }> {
  try {
    // アクセス権限チェック
    const member = await getCurrentMemberBySlug(organizationSlug)
    if (!member) {
      return { error: 'アクセス権限がありません' }
    }

    const organizationId = await getOrganizationIdBySlug(organizationSlug)
    if (!organizationId) {
      return { error: '組織が見つかりません' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: units, error } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching units:', error)
      return { error: error.message || '拠点の取得に失敗しました' }
    }

    return { units: (units || []) as Unit[] }
  } catch (error) {
    console.error('Error in getUnitsByOrganization:', error)
    return { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' }
  }
}

/**
 * unit_slug から unit 情報を取得
 */
export async function getUnitBySlug(
  organizationSlug: string,
  unitSlug: string
): Promise<{ unit?: Unit; error?: string }> {
  try {
    // アクセス権限チェック
    const member = await getCurrentMemberBySlug(organizationSlug)
    if (!member) {
      return { error: 'アクセス権限がありません' }
    }

    const organizationId = await getOrganizationIdBySlug(organizationSlug)
    if (!organizationId) {
      return { error: '組織が見つかりません' }
    }

    const unitId = await getUnitIdBySlug(organizationId, unitSlug)
    if (!unitId) {
      return { error: '拠点が見つかりません' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: unit, error } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('id', unitId)
      .single()

    if (error || !unit) {
      console.error('Error fetching unit:', error)
      return { error: error?.message || '拠点の取得に失敗しました' }
    }

    return { unit: unit as Unit }
  } catch (error) {
    console.error('Error in getUnitBySlug:', error)
    return { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' }
  }
}

/**
 * 新しい unit を作成
 */
export async function createUnit(
  organizationSlug: string,
  data: UnitInsert
): Promise<{ unit?: Unit; error?: string }> {
  try {
    // アクセス権限チェック
    const member = await getCurrentMemberBySlug(organizationSlug)
    if (!member) {
      return { error: 'アクセス権限がありません' }
    }

    // owner または admin のみ作成可能
    if (member.role !== 'owner' && member.role !== 'admin') {
      return { error: '作成権限がありません' }
    }

    const organizationId = await getOrganizationIdBySlug(organizationSlug)
    if (!organizationId) {
      return { error: '組織が見つかりません' }
    }

    // unit_slug の重複チェック
    const existingUnitId = await getUnitIdBySlug(organizationId, data.unit_slug)
    if (existingUnitId) {
      return { error: 'この unit_slug は既に使用されています' }
    }

    // プラン制限チェック（single プランの場合は unit が1件まで）
    const supabaseAdmin = getSupabaseAdmin()
    const { data: organization } = await supabaseAdmin
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single()

    if (organization?.plan === 'single') {
      const { data: existingUnits } = await supabaseAdmin
        .from('units')
        .select('id')
        .eq('organization_id', organizationId)

      if (existingUnits && existingUnits.length > 0) {
        return { error: '単拠点プランでは、拠点は1件まで作成できます' }
      }
    }

    const { data: unit, error } = await supabaseAdmin
      .from('units')
      .insert({
        organization_id: organizationId,
        unit_slug: data.unit_slug,
        name: data.name,
        timezone: data.timezone || 'Asia/Tokyo',
        rounding_unit: data.rounding_unit || 5,
        rounding_mode: data.rounding_mode || 'nearest',
      })
      .select()
      .single()

    if (error || !unit) {
      console.error('Error creating unit:', error)
      return { error: error?.message || '拠点の作成に失敗しました' }
    }

    revalidatePath(`/org/${organizationSlug}/units`, 'layout')
    return { unit: unit as Unit }
  } catch (error) {
    console.error('Error in createUnit:', error)
    return { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' }
  }
}

/**
 * unit 情報を更新
 */
export async function updateUnit(
  organizationSlug: string,
  unitSlug: string,
  updates: UnitUpdate
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

    const organizationId = await getOrganizationIdBySlug(organizationSlug)
    if (!organizationId) {
      return { error: '組織が見つかりません' }
    }

    const unitId = await getUnitIdBySlug(organizationId, unitSlug)
    if (!unitId) {
      return { error: '拠点が見つかりません' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('units')
      .update(updates)
      .eq('id', unitId)

    if (error) {
      console.error('Error updating unit:', error)
      return { error: error.message || '拠点の更新に失敗しました' }
    }

    revalidatePath(`/org/${organizationSlug}/units/${unitSlug}`, 'layout')
    return {}
  } catch (error) {
    console.error('Error in updateUnit:', error)
    return { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' }
  }
}

/**
 * unit を削除
 */
export async function deleteUnit(
  organizationSlug: string,
  unitSlug: string
): Promise<{ error?: string }> {
  try {
    // アクセス権限チェック
    const member = await getCurrentMemberBySlug(organizationSlug)
    if (!member) {
      return { error: 'アクセス権限がありません' }
    }

    // owner のみ削除可能
    if (member.role !== 'owner') {
      return { error: '削除権限がありません' }
    }

    const organizationId = await getOrganizationIdBySlug(organizationSlug)
    if (!organizationId) {
      return { error: '組織が見つかりません' }
    }

    const unitId = await getUnitIdBySlug(organizationId, unitSlug)
    if (!unitId) {
      return { error: '拠点が見つかりません' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from('units').delete().eq('id', unitId)

    if (error) {
      console.error('Error deleting unit:', error)
      return { error: error.message || '拠点の削除に失敗しました' }
    }

    revalidatePath(`/org/${organizationSlug}/units`, 'layout')
    return {}
  } catch (error) {
    console.error('Error in deleteUnit:', error)
    return { error: error instanceof Error ? error.message : '予期しないエラーが発生しました' }
  }
}

