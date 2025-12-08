import { format, formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import type { RoundingMode } from '@/types/database'

/**
 * 時刻を丸める
 * @param date 丸める時刻（Dateオブジェクト）
 * @param roundingUnit 丸め単位（分）
 * @param roundingMode 丸めモード（floor/ceil/nearest）
 * @returns 丸め後の時刻（Dateオブジェクト）
 */
export function roundTime(
  date: Date,
  roundingUnit: number,
  roundingMode: RoundingMode
): Date {
  const minutes = date.getMinutes()
  let roundedMinutes: number

  switch (roundingMode) {
    case 'floor':
      // 切り捨て
      roundedMinutes = Math.floor(minutes / roundingUnit) * roundingUnit
      break
    case 'ceil':
      // 切り上げ
      roundedMinutes = Math.ceil(minutes / roundingUnit) * roundingUnit
      break
    case 'nearest':
      // 四捨五入
      roundedMinutes = Math.round(minutes / roundingUnit) * roundingUnit
      break
    default:
      roundedMinutes = minutes
  }

  const rounded = new Date(date)
  rounded.setMinutes(roundedMinutes)
  rounded.setSeconds(0)
  rounded.setMilliseconds(0)

  return rounded
}

/**
 * タイムゾーンを考慮してローカル時刻をUTCに変換
 * @param localDate ローカル時刻（Dateオブジェクト）
 * @param timezone タイムゾーン（例: 'Asia/Tokyo'）
 * @returns UTC時刻（Dateオブジェクト）
 */
export function localToUtc(localDate: Date, timezone: string): Date {
  // ローカル時刻を指定タイムゾーンとして解釈し、UTCに変換
  const zonedDate = fromZonedTime(localDate, timezone)
  return zonedDate
}

/**
 * UTC時刻をローカル時刻に変換
 * @param utcDate UTC時刻（Dateオブジェクト）
 * @param timezone タイムゾーン（例: 'Asia/Tokyo'）
 * @returns ローカル時刻（Dateオブジェクト）
 */
export function utcToLocal(utcDate: Date, timezone: string): Date {
  // UTC時刻を指定タイムゾーンのローカル時刻に変換
  const localDate = toZonedTime(utcDate, timezone)
  return localDate
}

/**
 * 日付をYYYY-MM-DD形式の文字列に変換（ローカル日付）
 * @param date 日付（Dateオブジェクト）
 * @param timezone タイムゾーン（例: 'Asia/Tokyo'）
 * @returns YYYY-MM-DD形式の文字列
 */
export function formatWorkDate(date: Date, timezone: string): string {
  const localDate = utcToLocal(date, timezone)
  return format(localDate, 'yyyy-MM-dd')
}

/**
 * 時刻をHH:mm形式の文字列に変換（ローカル時刻）
 * @param date 時刻（Dateオブジェクト）
 * @param timezone タイムゾーン（例: 'Asia/Tokyo'）
 * @returns HH:mm形式の文字列
 */
export function formatTime(date: Date, timezone: string): string {
  const localDate = utcToLocal(date, timezone)
  return format(localDate, 'HH:mm')
}

/**
 * 現在時刻を取得して丸める
 * @param timezone タイムゾーン（例: 'Asia/Tokyo'）
 * @param roundingUnit 丸め単位（分）
 * @param roundingMode 丸めモード（floor/ceil/nearest）
 * @returns 丸め後の時刻（UTC Dateオブジェクト）とローカル時刻の文字列
 */
export function getRoundedNow(
  timezone: string,
  roundingUnit: number,
  roundingMode: RoundingMode
): {
  actualUtc: Date
  effectiveUtc: Date
  actualLocal: string
  effectiveLocal: string
} {
  const now = new Date()
  const localNow = utcToLocal(now, timezone)
  const roundedLocal = roundTime(localNow, roundingUnit, roundingMode)
  const effectiveUtc = localToUtc(roundedLocal, timezone)

  return {
    actualUtc: now,
    effectiveUtc,
    actualLocal: formatTime(now, timezone),
    effectiveLocal: formatTime(effectiveUtc, timezone),
  }
}






