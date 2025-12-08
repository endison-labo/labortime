'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Staff, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINでスタッフを検証
 */
async function verifyStaffByPin(pin: string): Promise<Staff | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブなスタッフを全件取得（PINハッシュは取得しない）
  const { data: staffs, error } = await supabaseAdmin
    .from('staffs')
    .select('id, clinic_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !staffs) {
    console.error('Error fetching staffs:', error)
    return null
  }

  // PINを検証
  console.log('verifyStaffByPin: Checking', staffs.length, 'staff members')
  for (const staff of staffs) {
    console.log('verifyStaffByPin: Checking staff:', staff.name, 'PIN hash length:', staff.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, staff.pin_hash)
      console.log('verifyStaffByPin: PIN verification result for', staff.name, ':', isValid)
      if (isValid) {
        console.log('verifyStaffByPin: PIN verified successfully for', staff.name)
        return staff as Staff
      }
    } catch (error) {
      console.error('verifyStaffByPin: Error verifying PIN for', staff.name, ':', error)
    }
  }

  console.log('verifyStaffByPin: No matching staff found for PIN')
  return null
}

/**
 * クリニック設定を取得
 */
async function getClinic(clinicId: string) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single()

  if (error || !data) {
    console.error('Error fetching clinic:', error)
    return null
  }

  return data
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  clinicId: string,
  staffId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('staff_id', staffId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 */
async function getTodayAttendanceAnyStatus(
  clinicId: string,
  staffId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('staff_id', staffId)
    .eq('work_date', workDate)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後のスタッフ状態を取得
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Staff found:', staff.name, 'ID:', staff.id)

    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      console.error('getStaffStatusByPin: Clinic not found for clinic_id:', staff.clinic_id)
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Clinic found:', clinic.name, 'timezone:', clinic.timezone)

    if (!clinic.timezone) {
      console.error('getStaffStatusByPin: Clinic timezone is missing')
      return {
        success: false,
        message: 'クリニックのタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), clinic.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(staff.clinic_id, staff.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status})` : 'not found')
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const status: StaffStatus = {
      staffId: staff.id,
      staffName: staff.name,
      clinicId: staff.clinic_id,
      hasAttendance: !!attendance && attendance.status === 'open',
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        clinic_id: staff.clinic_id,
        staff_id: staff.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}

