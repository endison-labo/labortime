'use client'

import { useState } from 'react'
import type { Organization, OrganizationUpdate } from '@/types/database'

interface OrganizationSettingsFormProps {
  organization: Organization
  updateAction: (updates: OrganizationUpdate) => Promise<{ error?: string }>
}

export default function OrganizationSettingsForm({
  organization,
  updateAction,
}: OrganizationSettingsFormProps) {
  const [name, setName] = useState(organization.name)
  const [plan, setPlan] = useState(organization.plan)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const updates: OrganizationUpdate = {
        name: name !== organization.name ? name : undefined,
        plan: plan !== organization.plan ? plan : undefined,
      }

      // undefined の値を削除
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      ) as OrganizationUpdate

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
          組織名
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
        <label htmlFor="plan" className="block text-sm font-medium text-slate-700">
          プラン
        </label>
        <select
          id="plan"
          value={plan}
          onChange={(e) => setPlan(e.target.value as 'single' | 'multi')}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="single">単拠点プラン（拠点1件まで）</option>
          <option value="multi">複数拠点プラン（拠点複数作成可能）</option>
        </select>
        <p className="mt-1 text-sm text-slate-500">
          プランを変更すると、拠点数の制限が変わります。
        </p>
      </div>

      <div className="rounded-md bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          <strong>組織スラッグ:</strong> {organization.organization_slug}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          組織スラッグは変更できません。URLで使用される識別子です。
        </p>
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

