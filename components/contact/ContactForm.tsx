'use client'

import { useState } from 'react'
import { submitContactForm, type ContactFormData } from '@/app/actions/contact'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    companyName: '',
    contactName: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const result = await submitContactForm(formData)
      if (result.success) {
        setSubmitResult({
          success: true,
          message: 'お問い合わせを受け付けました。ありがとうございます。',
        })
        setFormData({
          companyName: '',
          contactName: '',
          email: '',
          message: '',
        })
      } else {
        setSubmitResult({
          success: false,
          message: result.error || '送信に失敗しました。',
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'エラーが発生しました。もう一度お試しください。',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitResult?.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">送信完了</h3>
          <p className="text-slate-600 mb-6">{submitResult.message}</p>
          <button
            onClick={() => setSubmitResult(null)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            新しいお問い合わせを送信する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h3 className="text-2xl font-bold text-slate-800 mb-6">お問い合わせ</h3>
      
      {submitResult && !submitResult.success && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">エラー</p>
            <p className="text-sm text-red-700 mt-1">{submitResult.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
            会社名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="companyName"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            placeholder="株式会社サンプル"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-slate-700 mb-2">
            担当者名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="contactName"
            required
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            placeholder="山田 太郎"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            placeholder="example@company.com"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            required
            rows={6}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
            placeholder="お問い合わせ内容をご記入ください"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                送信中...
              </>
            ) : (
              '送信する'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

