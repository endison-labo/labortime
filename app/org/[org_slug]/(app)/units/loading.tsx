import { Loader2 } from 'lucide-react'

export default function UnitsLoading() {
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
            <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 border border-slate-200 rounded-lg animate-pulse"
                >
                  <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-32 bg-slate-200 rounded mb-1" />
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}



