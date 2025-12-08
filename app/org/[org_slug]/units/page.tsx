import { redirect } from 'next/navigation'
import { getCurrentMemberBySlug } from '@/lib/auth/utils'
import { getUnitsByOrganizationId } from '@/app/actions/unit'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ org_slug: string }>
}

export default async function UnitsPage({ params }: PageProps) {
  const { org_slug } = await params
  
  // 最適化: memberを取得してから、memberのorganization_idでunitsを取得（並列化）
  const member = await getCurrentMemberBySlug(org_slug)
  if (!member) {
    redirect(`/org/${org_slug}/login`)
  }

  // memberからorganization_idを直接取得してunitsを取得（重複クエリを削減）
  const { units, error } = await getUnitsByOrganizationId(member.organization_id)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/org/${org_slug}/dashboard`}
                className="text-xl font-semibold text-slate-800 hover:text-slate-600"
              >
                ダッシュボード
              </Link>
              <span className="text-slate-400">/</span>
              <h1 className="text-xl font-semibold text-slate-800">拠点一覧</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">拠点一覧</h2>
              {(member.role === 'owner' || member.role === 'admin') && (
                <Link
                  href={`/org/${org_slug}/units/new`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新規作成
                </Link>
              )}
            </div>

            {units && units.length > 0 ? (
              <div className="space-y-4">
                {units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/org/${org_slug}/units/${unit.unit_slug}`}
                    className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <h3 className="font-semibold text-slate-800">{unit.name}</h3>
                    <p className="text-sm text-slate-600">スラッグ: {unit.unit_slug}</p>
                    <p className="text-sm text-slate-600">タイムゾーン: {unit.timezone}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">拠点が登録されていません。</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

