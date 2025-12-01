import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth/utils'
import { signOut } from '@/app/actions/auth'

export default async function DashboardPage() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">勤怠管理システム</h1>
              </div>
            </div>
            <div className="flex items-center">
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-lg border-4 border-dashed border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ダッシュボード</h2>
            <p className="text-gray-600">管理者ID: {admin.id}</p>
            <p className="text-gray-600">クリニックID: {admin.clinic_id}</p>
            <p className="text-gray-600 mt-4">機能は順次実装予定です。</p>
          </div>
        </div>
      </main>
    </div>
  )
}



