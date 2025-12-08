'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentMemberBySlug, getUnitIdBySlug } from '@/lib/auth/utils'
import { hashPin } from '@/lib/utils/pin'
import type { Employee, EmployeeInsert, EmployeeUpdate } from '@/types/database'
import { revalidatePath } from 'next/cache'

/**
 * unit に所属する従業員一覧を取得
 */
export async function getEmployees(
  organizationSlug: string,
  unitSlug: string
): Promise<{ employees?: Employee[]; error?: string }> {
  try {
    // アクセス権限チェック
    const member = await getCurrentMemberBySlug(organizationSlug)
    if (!member) {
      return { error: 'アクセス権限がありません' }
    }

    // memberからorganization_idを直接取得
    const organizationId = member.organization_id
    const unitId = await getUnitIdBySlug(organizationId, unitSlug)
    if (!unitId) {
      return { error: '拠点が見つかりません' }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching employees:', error)
      return { error: error.message || '従業員一覧の取得に失敗しました' }
    }

    return { employees: (data || []) as Employee[] }
  } catch (error) {
    console.error('Error in getEmployees:', error)
    return {
      error: error instanceof Error ? error.message : '従業員一覧の取得に失敗しました',
    }
  }
}

/**
 * 新規従業員を作成
 */
export async function createEmployee(
  organizationSlug: string,
  unitSlug: string,
  data: {
    name: string
    hourlyWage: number
    pin: string
    isActive?: boolean
  }
): Promise<{ employee?: Employee; error?: string }> {
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

    // PINのバリデーション
    if (!data.pin || data.pin.length !== 4 || !/^\d{4}$/.test(data.pin)) {
      return { error: 'PINは4桁の数字である必要があります' }
    }

    // memberからorganization_idを直接取得
    const organizationId = member.organization_id
    const unitId = await getUnitIdBySlug(organizationId, unitSlug)
    if (!unitId) {
      return { error: '拠点が見つかりません' }
    }

    // PINをハッシュ化
    const pinHash = await hashPin(data.pin)

    const supabaseAdmin = getSupabaseAdmin()
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .insert({
        unit_id: unitId,
        name: data.name.trim(),
        hourly_wage: data.hourlyWage,
        pin_hash: pinHash,
        is_active: data.isActive !== undefined ? data.isActive : true,
      })
      .select()
      .single()

    if (error || !employee) {
      console.error('Error creating employee:', error)
      return { error: error?.message || '従業員の作成に失敗しました' }
    }

    revalidatePath(`/org/${organizationSlug}/units/${unitSlug}/employees`, 'layout')
    return { employee: employee as Employee }
  } catch (error) {
    console.error('Error in createEmployee:', error)
    return {
      error: error instanceof Error ? error.message : '従業員の作成に失敗しました',
    }
  }
}

/**
 * 従業員情報を更新
 */
export async function updateEmployee(
  organizationSlug: string,
  unitSlug: string,
  employeeId: string,
  updates: {
    name?: string
    hourlyWage?: number
    isActive?: boolean
  }
): Promise<{ employee?: Employee; error?: string }> {
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

    // memberからorganization_idを直接取得
    const organizationId = member.organization_id
    const unitId = await getUnitIdBySlug(organizationId, unitSlug)
    if (!unitId) {
      return { error: '拠点が見つかりません' }
    }

    // 従業員がこのunitに属しているか確認
    const supabaseAdmin = getSupabaseAdmin()
    const { data: existingEmployee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('unit_id', unitId)
      .single()

    if (fetchError || !existingEmployee) {
      return { error: '従業員が見つかりません' }
    }

    // 更新データを準備
    const updateData: EmployeeUpdate = {}
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim()
    }
    if (updates.hourlyWage !== undefined) {
      updateData.hourly_wage = updates.hourlyWage
    }
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive
    }

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .eq('unit_id', unitId)
      .select()
      .single()

    if (error || !employee) {
      console.error('Error updating employee:', error)
      return { error: error?.message || '従業員情報の更新に失敗しました' }
    }

    revalidatePath(`/org/${organizationSlug}/units/${unitSlug}/employees`, 'layout')
    return { employee: employee as Employee }
  } catch (error) {
    console.error('Error in updateEmployee:', error)
    return {
      error: error instanceof Error ? error.message : '従業員情報の更新に失敗しました',
    }
  }
}

/**
 * 従業員のPINを再発行
 */
export async function resetEmployeePin(
  organizationSlug: string,
  unitSlug: string,
  employeeId: string,
  newPin: string
): Promise<{ error?: string }> {
  try {
    // アクセス権限チェック
    const member = await getCurrentMemberBySlug(organizationSlug)
    if (!member) {
      return { error: 'アクセス権限がありません' }
    }

    // owner または admin のみPIN再発行可能
    if (member.role !== 'owner' && member.role !== 'admin') {
      return { error: 'PIN再発行権限がありません' }
    }

    // PINのバリデーション
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return { error: 'PINは4桁の数字である必要があります' }
    }

    // memberからorganization_idを直接取得
    const organizationId = member.organization_id
    const unitId = await getUnitIdBySlug(organizationId, unitSlug)
    if (!unitId) {
      return { error: '拠点が見つかりません' }
    }

    // 従業員がこのunitに属しているか確認
    const supabaseAdmin = getSupabaseAdmin()
    const { data: existingEmployee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('unit_id', unitId)
      .single()

    if (fetchError || !existingEmployee) {
      return { error: '従業員が見つかりません' }
    }

    // PINをハッシュ化
    const pinHash = await hashPin(newPin)

    const { error } = await supabaseAdmin
      .from('employees')
      .update({ pin_hash: pinHash })
      .eq('id', employeeId)
      .eq('unit_id', unitId)

    if (error) {
      console.error('Error resetting PIN:', error)
      return { error: error.message || 'PINの再発行に失敗しました' }
    }

    revalidatePath(`/org/${organizationSlug}/units/${unitSlug}/employees`, 'layout')
    return {}
  } catch (error) {
    console.error('Error in resetEmployeePin:', error)
    return {
      error: error instanceof Error ? error.message : 'PINの再発行に失敗しました',
    }
  }
}

