// Database type definitions
// Supabase の型定義をここに記述

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

export interface Clinic {
  id: string
  name: string
  timezone: string
  rounding_unit: number
  rounding_mode: RoundingMode
  created_at: string
}

export interface Staff {
  id: string
  clinic_id: string
  name: string
  hourly_wage: number
  pin_hash: string
  is_active: boolean
  created_at: string
}

export interface Admin {
  id: string
  clinic_id: string
  user_id: string
  role: string
  created_at: string
}

export interface Attendance {
  id: string
  clinic_id: string
  staff_id: string
  work_date: string // YYYY-MM-DD
  clock_in_actual: string | null
  clock_out_actual: string | null
  clock_in_effective: string | null
  clock_out_effective: string | null
  clock_in_source: AttendanceSource | null
  clock_out_source: AttendanceSource | null
  break_out_actual: string | null
  break_out_effective: string | null
  break_in_actual: string | null
  break_in_effective: string | null
  status: AttendanceStatus
  work_minutes_effective: number
  has_manual_correction: boolean
  note: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceLog {
  id: string
  attendance_id: string
  clinic_id: string
  staff_id: string
  log_type: AttendanceLogType
  before_clock_in_effective: string | null
  after_clock_in_effective: string | null
  before_clock_out_effective: string | null
  after_clock_out_effective: string | null
  triggered_by_admin_user_id: string | null
  created_at: string
}

// Insert types (for creating new records)
export interface ClinicInsert {
  name: string
  timezone?: string
  rounding_unit?: number
  rounding_mode?: RoundingMode
}

export interface StaffInsert {
  clinic_id: string
  name: string
  hourly_wage: number
  pin_hash: string
  is_active?: boolean
}

export interface AdminInsert {
  clinic_id: string
  user_id: string
  role?: string
}

export interface AttendanceInsert {
  clinic_id: string
  staff_id: string
  work_date: string
  clock_in_actual?: string | null
  clock_out_actual?: string | null
  clock_in_effective?: string | null
  clock_out_effective?: string | null
  clock_in_source?: AttendanceSource | null
  clock_out_source?: AttendanceSource | null
  break_out_actual?: string | null
  break_out_effective?: string | null
  break_in_actual?: string | null
  break_in_effective?: string | null
  status?: AttendanceStatus
  work_minutes_effective?: number
  has_manual_correction?: boolean
  note?: string | null
}

export interface AttendanceLogInsert {
  attendance_id: string
  clinic_id: string
  staff_id: string
  log_type: AttendanceLogType
  before_clock_in_effective?: string | null
  after_clock_in_effective?: string | null
  before_clock_out_effective?: string | null
  after_clock_out_effective?: string | null
  triggered_by_admin_user_id?: string | null
}

// Update types (for updating existing records)
export interface StaffUpdate {
  name?: string
  hourly_wage?: number
  pin_hash?: string
  is_active?: boolean
}

export interface AttendanceUpdate {
  clock_in_actual?: string | null
  clock_out_actual?: string | null
  clock_in_effective?: string | null
  clock_out_effective?: string | null
  clock_in_source?: AttendanceSource | null
  clock_out_source?: AttendanceSource | null
  break_out_actual?: string | null
  break_out_effective?: string | null
  break_in_actual?: string | null
  break_in_effective?: string | null
  status?: AttendanceStatus
  work_minutes_effective?: number
  has_manual_correction?: boolean
  note?: string | null
}

export interface ClinicUpdate {
  name?: string
  timezone?: string
  rounding_unit?: number
  rounding_mode?: RoundingMode
}









