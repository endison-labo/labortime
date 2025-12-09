import { getCurrentMemberAndOrganizationBySlug } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import OrgNav from './OrgNav'

interface OrgLayoutProps {
  children: React.ReactNode
  orgSlug: string
}

export default async function OrgLayout({ children, orgSlug }: OrgLayoutProps) {
  const { member, organization } = await getCurrentMemberAndOrganizationBySlug(orgSlug)

  if (!member) {
    redirect(`/org/${orgSlug}/login`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OrgNav 
        orgSlug={orgSlug}
        organizationName={organization?.name || 'labortime.work'}
        userRole={member.role}
      />
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

