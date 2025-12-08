// Database type definitions
// Supabase の型定義をここに記述
// v2: organization/unit ベースのスキーマ

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AttendanceSource = 'tablet' | 'admin'
export type AttendanceStatus = 'open' | 'closed'
export type AttendanceLogType = 'create' | 'clock_in' | 'clock_out' | 'break_out' | 'break_in' | 'edit'
export type RoundingMode = 'floor' | 'ceil' | 'nearest'
export type OrganizationPlan = 'single' | 'multi'
export type MemberRole = 'owner' | 'admin' | 'manager' | 'staff'

// ============================================================================
// Organizations
// ============================================================================

export interface Organization {
  id: string
  organization_slug: string
  name: string
  plan: OrganizationPlan
  created_at: string
  updated_at: string
}

export interface OrganizationInsert {
  organization_slug: string
  name: string
  plan?: OrganizationPlan
}

export interface OrganizationUpdate {
  name?: string
  plan?: OrganizationPlan
}

// ============================================================================
// Units
// ============================================================================

export interface Unit {
  id: string
  organization_id: string
  unit_slug: string
  name: string
  timezone: string
  rounding_unit: number
  rounding_mode: RoundingMode
  created_at: string
  updated_at: string
}

export interface UnitInsert {
  organization_id: string
  unit_slug: string
  name: string
  timezone?: string
  rounding_unit?: number
  rounding_mode?: RoundingMode
}

export interface UnitUpdate {
  name?: string
  timezone?: string
  rounding_unit?: number
  rounding_mode?: RoundingMode
}

// ============================================================================
// Members (ユーザーとorganizationの中間概念)
// ============================================================================

export interface Member {
  id: string
  organization_id: string
  user_id: string
  role: MemberRole
  created_at: string
  updated_at: string
}

export interface MemberInsert {
  organization_id: string
  user_id: string
  role?: MemberRole
}

export interface MemberUpdate {
  role?: MemberRole
}

// ============================================================================
// Employees (旧 Staffs を汎用化)
// ============================================================================

export interface Employee {
  id: string
  unit_id: string
  name: string
  hourly_wage: number
  pin_hash: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmployeeInsert {
  unit_id: string
  name: string
  hourly_wage: number
  pin_hash: string
  is_active?: boolean
}

export interface EmployeeUpdate {
  name?: string
  hourly_wage?: number
  pin_hash?: string
  is_active?: boolean
}

// ============================================================================
// Attendances
// ============================================================================

export interface Attendance {
  id: string
  unit_id: string
  employee_id: string
  work_date: string // YYYY-MM-DD
  clock_in_actual: string | null
  clock_out_actual: string | null
  break_out_actual: string | null
  break_in_actual: string | null
  clock_in_effective: string | null
  clock_out_effective: string | null
  break_out_effective: string | null
  break_in_effective: string | null
  clock_in_source: AttendanceSource | null
  clock_out_source: AttendanceSource | null
  status: AttendanceStatus
  work_minutes_effective: number
  has_manual_correction: boolean
  note: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceInsert {
  unit_id: string
  employee_id: string
  work_date: string
  clock_in_actual?: string | null
  clock_out_actual?: string | null
  break_out_actual?: string | null
  break_in_actual?: string | null
  clock_in_effective?: string | null
  clock_out_effective?: string | null
  break_out_effective?: string | null
  break_in_effective?: string | null
  clock_in_source?: AttendanceSource | null
  clock_out_source?: AttendanceSource | null
  status?: AttendanceStatus
  work_minutes_effective?: number
  has_manual_correction?: boolean
  note?: string | null
}

export interface AttendanceUpdate {
  clock_in_actual?: string | null
  clock_out_actual?: string | null
  break_out_actual?: string | null
  break_in_actual?: string | null
  clock_in_effective?: string | null
  clock_out_effective?: string | null
  break_out_effective?: string | null
  break_in_effective?: string | null
  clock_in_source?: AttendanceSource | null
  clock_out_source?: AttendanceSource | null
  status?: AttendanceStatus
  work_minutes_effective?: number
  has_manual_correction?: boolean
  note?: string | null
}

// ============================================================================
// Attendance Logs
// ============================================================================

export interface AttendanceLog {
  id: string
  attendance_id: string
  unit_id: string
  employee_id: string
  log_type: AttendanceLogType
  before_clock_in_effective: string | null
  after_clock_in_effective: string | null
  before_clock_out_effective: string | null
  after_clock_out_effective: string | null
  triggered_by_admin_user_id: string | null
  created_at: string
}

export interface AttendanceLogInsert {
  attendance_id: string
  unit_id: string
  employee_id: string
  log_type: AttendanceLogType
  before_clock_in_effective?: string | null
  after_clock_in_effective?: string | null
  before_clock_out_effective?: string | null
  after_clock_out_effective?: string | null
  triggered_by_admin_user_id?: string | null
}

// ============================================================================
// 後方互換性のための型エイリアス（移行期間中のみ使用）
// ============================================================================

/** @deprecated 後方互換性のため。Organization を使用してください */
export type Clinic = Organization

/** @deprecated 後方互換性のため。OrganizationUpdate を使用してください */
export type ClinicUpdate = OrganizationUpdate

/** @deprecated 後方互換性のため。Employee を使用してください */
export type Staff = Employee

/** @deprecated 後方互換性のため。Member を使用してください */
export type Admin = Member
