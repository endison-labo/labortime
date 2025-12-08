import { redirect } from 'next/navigation'
import { getCurrentMemberBySlug } from '@/lib/auth/utils'
import { getOrganizationBySlug } from '@/app/actions/organization'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ org_slug: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { org_slug } = await params
  const member = await getCurrentMemberBySlug(org_slug)

  if (!member) {
    redirect(`/org/${org_slug}/login`)
  }

  const organization = await getOrganizationBySlug(org_slug)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-800">
                {organization?.name || '勤怠管理システム'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/org/${org_slug}/units`}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                拠点一覧
              </Link>
              {(member.role === 'owner' || member.role === 'admin') && (
                <>
                  <span className="text-sm text-slate-400">|</span>
                  <Link
                    href={`/org/${org_slug}/settings`}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    組織設定
                  </Link>
                </>
              )}
              <span className="text-sm text-slate-400">|</span>
              <span className="text-sm text-slate-600">ロール: {member.role}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">ダッシュボード</h2>
            <div className="space-y-2">
              <p className="text-slate-600">組織: {organization?.name}</p>
              <p className="text-slate-600">プラン: {organization?.plan === 'single' ? '単拠点プラン' : '複数拠点プラン'}</p>
              {(member.role === 'owner' || member.role === 'admin') && (
                <p className="text-slate-600 mt-4">
                  <Link
                    href={`/org/${org_slug}/settings`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    組織設定を変更する
                  </Link>
                </p>
              )}
            </div>
            <p className="text-slate-600 mt-4">機能は順次実装予定です。</p>
          </div>
        </div>
      </main>
    </div>
  )
}

