import { getCurrentMemberAndOrganizationBySlug } from '@/lib/auth/utils'
import { getOrganizationIdBySlug, getOrganizationById } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { DEMO_ORG_SLUG } from '@/lib/constants'
import OrgLayoutClient from '@/components/org/OrgLayoutClient'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ org_slug: string }>
}

export default async function AppLayout({ children, params }: LayoutProps) {
  const { org_slug } = await params
  
  // デモ用の組織スラッグの場合は認証チェックをスキップ
  if (org_slug === DEMO_ORG_SLUG) {
    const organizationId = await getOrganizationIdBySlug(org_slug)
    const organization = organizationId ? await getOrganizationById(organizationId) : null
    
    return (
      <OrgLayoutClient
        orgSlug={org_slug}
        organizationName={organization?.name || 'デモアカウント'}
        userRole="owner"
      >
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>デモモード中:</strong> データの閲覧・操作が可能ですが、保存されない場合があります。
          </p>
        </div>
        {children}
      </OrgLayoutClient>
    )
  }

  // 通常の組織の場合は認証チェック
  const { member, organization } = await getCurrentMemberAndOrganizationBySlug(org_slug)

  if (!member) {
    redirect(`/org/${org_slug}/login`)
  }

  return (
    <OrgLayoutClient
      orgSlug={org_slug}
      organizationName={organization?.name || 'labortime.work'}
      userRole={member.role}
    >
      {children}
    </OrgLayoutClient>
  )
}

