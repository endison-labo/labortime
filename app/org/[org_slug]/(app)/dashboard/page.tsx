import { getCurrentMemberAndOrganizationBySlug } from '@/lib/auth/utils'
import { getOrganizationIdBySlug, getOrganizationById } from '@/lib/auth/utils'
import { DEMO_ORG_SLUG } from '@/lib/constants'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ org_slug: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { org_slug } = await params
  
  // デモ用の組織スラッグの場合は認証なしで表示
  if (org_slug === DEMO_ORG_SLUG) {
    const organizationId = await getOrganizationIdBySlug(org_slug)
    const organization = organizationId ? await getOrganizationById(organizationId) : null

    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">ダッシュボード</h2>
          <div className="space-y-2">
            <p className="text-slate-600">組織: {organization?.name || 'デモアカウント'}</p>
            <p className="text-slate-600">プラン: {organization?.plan === 'single' ? '単拠点プラン' : '複数拠点プラン'}</p>
          </div>
          <p className="text-slate-600 mt-4">機能は順次実装予定です。</p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">主な機能</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• シンプルな打刻機能</li>
              <li>• シフト管理</li>
              <li>• 多拠点対応</li>
              <li>• レポート出力</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">お試しください</h3>
            <p className="text-sm text-slate-600 mb-4">
              実際のアカウントを作成して、すべての機能をお試しください。
            </p>
            <Link
              href={`/org/${org_slug}/login`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ログインして始める
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 通常の組織の場合は認証が必要
  const { member, organization } = await getCurrentMemberAndOrganizationBySlug(org_slug)

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">ダッシュボード</h2>
        <div className="space-y-2">
          <p className="text-slate-600">組織: {organization?.name}</p>
          <p className="text-slate-600">プラン: {organization?.plan === 'single' ? '単拠点プラン' : '複数拠点プラン'}</p>
          {(member?.role === 'owner' || member?.role === 'admin') && (
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
  )
}

