import { getCurrentMemberBySlug } from '@/lib/auth/utils'
import { getUnitBySlug, updateUnit } from '@/app/actions/unit'
import Link from 'next/link'
import UnitSettingsForm from '@/components/admin/UnitSettingsForm'
import type { UnitUpdate } from '@/types/database'

interface PageProps {
  params: Promise<{ org_slug: string; unit_slug: string }>
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { org_slug, unit_slug } = await params
  const member = await getCurrentMemberBySlug(org_slug)

  const { unit, error } = await getUnitBySlug(org_slug, unit_slug)

  if (error || !unit) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800">{error || '拠点が見つかりません'}</p>
        </div>
      </div>
    )
  }

  // Server Action wrapper for Client Component
  async function handleUpdateUnit(updates: UnitUpdate) {
    'use server'
    return updateUnit(org_slug, unit_slug, updates)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">拠点設定: {unit.name}</h2>
          <div className="flex items-center gap-4">
            {(member && (member.role === 'owner' || member.role === 'admin')) && (
              <Link
                href={`/org/${org_slug}/units/${unit_slug}/employees`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                従業員管理
              </Link>
            )}
            <Link
              href={`/org/${org_slug}/units/${unit_slug}/terminal`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              打刻画面
            </Link>
          </div>
        </div>
        {(member && (member.role === 'owner' || member.role === 'admin')) ? (
          <UnitSettingsForm
            unit={unit}
            updateAction={handleUpdateUnit}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600">名前: {unit.name}</p>
            <p className="text-slate-600">スラッグ: {unit.unit_slug}</p>
            <p className="text-slate-600">タイムゾーン: {unit.timezone}</p>
            <p className="text-slate-600">丸め単位: {unit.rounding_unit}分</p>
            <p className="text-slate-600">丸めモード: {unit.rounding_mode}</p>
          </div>
        )}
      </div>
    </div>
  )
}

