'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/auth/utils'
import { hashPin } from '@/lib/utils/pin'
import type { Staff, StaffInsert, StaffUpdate } from '@/types/database'
import { revalidatePath } from 'next/cache'

/**
 * スタッフ一覧を取得
 */
export async function getStaffs(): Promise<{ success: boolean; staffs?: Staff[]; message?: string }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return {
        success: false,
        message: '認証が必要です',
      }
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('staffs')
      .select('*')
      .eq('clinic_id', admin.clinic_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staffs:', error)
      return {
        success: false,
        message: 'スタッフ一覧の取得に失敗しました',
      }
    }

    return {
      success: true,
      staffs: data as Staff[],
    }
  } catch (error) {
    console.error('getStaffs error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'スタッフ一覧の取得に失敗しました',
    }
  }
}

/**
 * 新規スタッフを作成
 */
export async function createStaff(
  name: string,
  hourlyWage: number,
  pin: string,
  isActive: boolean = true
): Promise<{ success: boolean; staff?: Staff; message?: string }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return {
        success: false,
        message: '認証が必要です',
      }
    }

    // PINのバリデーション
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    // PINをハッシュ化
    const pinHash = await hashPin(pin)

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('staffs')
      .insert({
        clinic_id: admin.clinic_id,
        name: name.trim(),
        hourly_wage: hourlyWage,
        pin_hash: pinHash,
        is_active: isActive,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating staff:', error)
      return {
        success: false,
        message: 'スタッフの作成に失敗しました',
      }
    }

    revalidatePath('/admin/staffs')
    return {
      success: true,
      staff: data as Staff,
    }
  } catch (error) {
    console.error('createStaff error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'スタッフの作成に失敗しました',
    }
  }
}

/**
 * スタッフ情報を更新
 */
export async function updateStaff(
  staffId: string,
  updates: { name?: string; hourlyWage?: number; isActive?: boolean }
): Promise<{ success: boolean; staff?: Staff; message?: string }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return {
        success: false,
        message: '認証が必要です',
      }
    }

    // スタッフがこのクリニックに属しているか確認
    const supabaseAdmin = getSupabaseAdmin()
    const { data: existingStaff, error: fetchError } = await supabaseAdmin
      .from('staffs')
      .select('*')
      .eq('id', staffId)
      .eq('clinic_id', admin.clinic_id)
      .single()

    if (fetchError || !existingStaff) {
      return {
        success: false,
        message: 'スタッフが見つかりません',
      }
    }

    // 更新データを準備
    const updateData: StaffUpdate = {}
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim()
    }
    if (updates.hourlyWage !== undefined) {
      updateData.hourly_wage = updates.hourlyWage
    }
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive
    }

    const { data, error } = await supabaseAdmin
      .from('staffs')
      .update(updateData)
      .eq('id', staffId)
      .eq('clinic_id', admin.clinic_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating staff:', error)
      return {
        success: false,
        message: 'スタッフ情報の更新に失敗しました',
      }
    }

    revalidatePath('/admin/staffs')
    return {
      success: true,
      staff: data as Staff,
    }
  } catch (error) {
    console.error('updateStaff error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'スタッフ情報の更新に失敗しました',
    }
  }
}

/**
 * スタッフのPINを再発行
 */
export async function resetStaffPin(
  staffId: string,
  newPin: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return {
        success: false,
        message: '認証が必要です',
      }
    }

    // PINのバリデーション
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    // スタッフがこのクリニックに属しているか確認
    const supabaseAdmin = getSupabaseAdmin()
    const { data: existingStaff, error: fetchError } = await supabaseAdmin
      .from('staffs')
      .select('*')
      .eq('id', staffId)
      .eq('clinic_id', admin.clinic_id)
      .single()

    if (fetchError || !existingStaff) {
      return {
        success: false,
        message: 'スタッフが見つかりません',
      }
    }

    // PINをハッシュ化
    const pinHash = await hashPin(newPin)

    const { error } = await supabaseAdmin
      .from('staffs')
      .update({ pin_hash: pinHash })
      .eq('id', staffId)
      .eq('clinic_id', admin.clinic_id)

    if (error) {
      console.error('Error resetting PIN:', error)
      return {
        success: false,
        message: 'PINの再発行に失敗しました',
      }
    }

    revalidatePath('/admin/staffs')
    return {
      success: true,
    }
  } catch (error) {
    console.error('resetStaffPin error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'PINの再発行に失敗しました',
    }
  }
}

