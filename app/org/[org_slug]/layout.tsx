import { getCurrentMemberAndOrganizationBySlug } from '@/lib/auth/utils'
import { getOrganizationIdBySlug, getOrganizationById } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OrgNav from '@/components/org/OrgNav'
import { DEMO_ORG_SLUG } from '@/lib/constants'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ org_slug: string }>
}

export default async function OrgLayout({ children, params }: LayoutProps) {
  const { org_slug } = await params
  
  // デモ用の組織スラッグの場合は認証チェックをスキップ
  if (org_slug === DEMO_ORG_SLUG) {
    const organizationId = await getOrganizationIdBySlug(org_slug)
    const organization = organizationId ? await getOrganizationById(organizationId) : null
    
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-slate-800">
                  {organization?.name || 'デモアカウント'}
                </h1>
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  デモ
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  トップページ
                </Link>
                <Link
                  href={`/org/${org_slug}/login`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow"
                >
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    )
  }

  // 通常の組織の場合は認証チェック
  const { member, organization } = await getCurrentMemberAndOrganizationBySlug(org_slug)

  if (!member) {
    redirect(`/org/${org_slug}/login`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OrgNav 
        orgSlug={org_slug}
        organizationName={organization?.name || 'labortime.work'}
        userRole={member.role}
      />
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

