import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth/utils'
import { getStaffs } from '@/app/actions/staff'
import AdminNav from '@/components/admin/AdminNav'
import StaffList from '@/components/admin/StaffList'

export default async function StaffsPage() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  const staffsResult = await getStaffs()

  if (!staffsResult.success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminNav />
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-800">{staffsResult.message || 'スタッフ一覧の取得に失敗しました'}</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">スタッフ管理</h2>
          </div>
          <StaffList initialStaffs={staffsResult.staffs || []} />
        </div>
      </main>
    </div>
  )
}

