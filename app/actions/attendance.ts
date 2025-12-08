'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
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
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後の従業員状態を取得
 * フロントエンドとの後方互換性のため、StaffStatusインターフェースを返す
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Employee found:', employee.name, 'ID:', employee.id)

    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      console.error('getStaffStatusByPin: Unit not found for unit_id:', employee.unit_id)
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Unit found:', unit.name, 'timezone:', unit.timezone)

    if (!unit.timezone) {
      console.error('getStaffStatusByPin: Unit timezone is missing')
      return {
        success: false,
        message: '拠点のタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), unit.timezone)
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
      attendance = await getTodayAttendanceAnyStatus(employee.unit_id, employee.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
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

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    // 後方互換性のため、StaffStatusインターフェースを使用（clinicIdはunitIdを返す）
    const status: StaffStatus = {
      staffId: employee.id,
      staffName: employee.name,
      clinicId: employee.unit_id, // 後方互換性のため、unit_idをclinicIdとして返す
      hasAttendance,
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
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        unit_id: employee.unit_id,
        employee_id: employee.id,
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
      unit_id: employee.unit_id,
      employee_id: employee.id,
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
      staffName: employee.name,
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
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
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
      unit_id: employee.unit_id,
      employee_id: employee.id,
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
      staffName: employee.name,
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
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

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
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
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
      unit_id: employee.unit_id,
      employee_id: employee.id,
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
      staffName: employee.name,
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
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

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
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
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
      unit_id: employee.unit_id,
      employee_id: employee.id,
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
      staffName: employee.name,
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

