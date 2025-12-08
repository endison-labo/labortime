import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function AdminNav() {
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="text-xl font-medium text-slate-800 hover:text-slate-600 transition-colors">
              勤怠管理システム
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition-colors"
              >
                ダッシュボード
              </Link>
              <Link
                href="/admin/staffs"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition-colors"
              >
                スタッフ管理
              </Link>
              <Link
                href="/admin/settings"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md transition-colors"
              >
                設定
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  )
}

