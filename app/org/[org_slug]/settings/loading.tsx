import { Loader2 } from 'lucide-react'

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
              <span className="text-slate-400">/</span>
              <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium">読み込み中...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

