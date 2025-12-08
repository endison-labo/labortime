import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth/utils'
import { getClinicSettings, updateClinicSettings } from '@/app/actions/clinic'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect('/admin/login')
  }

  const clinic = await getClinicSettings()

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-red-800">クリニック設定の取得に失敗しました。</p>
          </div>
        </div>
      </div>
    )
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
            <div className="flex items-center space-x-4">
              <a
                href="/admin/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                ダッシュボード
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="rounded-lg bg-white shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">クリニック設定</h2>
            <SettingsForm clinic={clinic} updateAction={updateClinicSettings} />
          </div>
        </div>
      </main>
    </div>
  )
}









