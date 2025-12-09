import Link from 'next/link'
import { DEMO_ORG_SLUG } from '@/lib/constants'
import dynamic from 'next/dynamic'

// ContactFormを動的インポート（エラーが発生してもページが表示されるように）
const ContactForm = dynamic(() => import('@/components/contact/ContactForm'), {
  ssr: false,
  loading: () => <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">読み込み中...</div>,
})

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-900">labortime.work</h1>
            </div>
            <div className="flex items-center">
              <Link
                href={`/org/${DEMO_ORG_SLUG}/login`}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            labortime.work
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            医療・ヘルスケア事業向けに最適化した勤怠管理システム
          </p>
          <p className="text-lg text-slate-500 mb-12">
            クリニック、歯科、整骨院など、ヘルスケア事業の勤怠管理を簡単に
          </p>

          <div className="mt-16 text-left max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">主な機能</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">シンプルな打刻</h3>
                <p className="text-slate-600 text-sm">PINコードで簡単に打刻。タブレット対応で現場で使いやすい</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">シフト管理</h3>
                <p className="text-slate-600 text-sm">朝番・遅番・通しなど、ヘルスケア業界の勤務パターンに対応</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">多拠点対応</h3>
                <p className="text-slate-600 text-sm">複数のクリニックや店舗を一元管理</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">レポート出力</h3>
                <p className="text-slate-600 text-sm">CSV出力で給与計算システムと連携可能</p>
              </div>
            </div>
          </div>

          {/* お問い合わせセクション */}
          <div className="mt-20 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">デモ画面をご覧になりたい方は</h2>
              <p className="text-slate-600">以下までご連絡ください</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </main>
    </div>
  )
}
