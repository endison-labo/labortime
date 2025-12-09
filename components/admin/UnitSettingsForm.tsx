'use client'

import { useState } from 'react'
import type { Unit, UnitUpdate } from '@/types/database'

interface UnitSettingsFormProps {
  unit: Unit
  updateAction: (updates: UnitUpdate) => Promise<{ error?: string }>
}

export default function UnitSettingsForm({ unit, updateAction }: UnitSettingsFormProps) {
  const [name, setName] = useState(unit.name)
  const [timezone, setTimezone] = useState(unit.timezone)
  const [roundingUnit, setRoundingUnit] = useState(unit.rounding_unit.toString())
  const [roundingMode, setRoundingMode] = useState(unit.rounding_mode)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const updates: UnitUpdate = {
        name: name !== unit.name ? name : undefined,
        timezone: timezone !== unit.timezone ? timezone : undefined,
        rounding_unit: roundingUnit !== unit.rounding_unit.toString() 
          ? parseInt(roundingUnit, 10) 
          : undefined,
        rounding_mode: roundingMode !== unit.rounding_mode ? roundingMode : undefined,
      }

      // undefined の値を削除
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      ) as UnitUpdate

      if (Object.keys(cleanUpdates).length === 0) {
        setIsLoading(false)
        return
      }

      const result = await updateAction(cleanUpdates)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('設定の更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">設定を更新しました</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          拠点名
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-slate-700">
          タイムゾーン
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div>
        <label htmlFor="roundingUnit" className="block text-sm font-medium text-slate-700">
          丸め単位（分）
        </label>
        <select
          id="roundingUnit"
          value={roundingUnit}
          onChange={(e) => setRoundingUnit(e.target.value)}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="1">1分</option>
          <option value="5">5分</option>
          <option value="10">10分</option>
          <option value="15">15分</option>
          <option value="30">30分</option>
        </select>
      </div>

      <div>
        <label htmlFor="roundingMode" className="block text-sm font-medium text-slate-700">
          丸めモード
        </label>
        <select
          id="roundingMode"
          value={roundingMode}
          onChange={(e) => setRoundingMode(e.target.value as 'floor' | 'ceil' | 'nearest')}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="floor">切り捨て</option>
          <option value="ceil">切り上げ</option>
          <option value="nearest">四捨五入</option>
        </select>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '更新中...' : '設定を更新'}
        </button>
      </div>
    </form>
  )
}



