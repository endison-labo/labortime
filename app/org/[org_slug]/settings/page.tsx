import { redirect } from 'next/navigation'
import { getCurrentMemberBySlug } from '@/lib/auth/utils'
import { getOrganizationBySlug, updateOrganization } from '@/app/actions/organization'
import Link from 'next/link'
import OrganizationSettingsForm from '@/components/admin/OrganizationSettingsForm'
import type { OrganizationUpdate } from '@/types/database'

interface PageProps {
  params: Promise<{ org_slug: string }>
}

export default async function OrganizationSettingsPage({ params }: PageProps) {
  const { org_slug } = await params
  const member = await getCurrentMemberBySlug(org_slug)

  if (!member) {
    redirect(`/org/${org_slug}/login`)
  }

  // owner または admin のみアクセス可能
  if (member.role !== 'owner' && member.role !== 'admin') {
    redirect(`/org/${org_slug}/dashboard`)
  }

  const organization = await getOrganizationBySlug(org_slug)

  if (!organization) {
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
              </div>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-800 font-semibold mb-2">組織情報の取得に失敗しました</p>
              <p className="text-sm text-red-700">
                組織スラッグ: <code className="bg-red-100 px-2 py-1 rounded">{org_slug}</code>
              </p>
              <p className="text-sm text-red-700 mt-2">
                考えられる原因:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside mt-1 space-y-1">
                <li>データベースに組織が存在しない</li>
                <li>組織スラッグが間違っている</li>
                <li>キャッシュの問題（開発サーバーを再起動してください）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Server Action wrapper for Client Component
  async function handleUpdateOrganization(updates: OrganizationUpdate) {
    'use server'
    return updateOrganization(org_slug, updates)
  }

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
              <h1 className="text-xl font-semibold text-slate-800">組織設定</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">組織設定</h2>
            <OrganizationSettingsForm
              organization={organization}
              updateAction={handleUpdateOrganization}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

