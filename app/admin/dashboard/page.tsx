import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth/utils'
import AdminNav from '@/components/admin/AdminNav'

export default async function DashboardPage() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">ダッシュボード</h2>
            <p className="text-slate-600">管理者ID: {admin.id}</p>
            <p className="text-slate-600">クリニックID: {admin.clinic_id}</p>
            <p className="text-slate-600 mt-4">機能は順次実装予定です。</p>
          </div>
        </div>
      </main>
    </div>
  )
}
