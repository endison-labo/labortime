# 前のチャットの後半を確認
_Exported on 2025/12/8 at 16:24:58 JST from Cursor (2.1.50)_

---

**User**

@cursor_.md 前のチャットです。中盤～最後の方だけ確認してください

---

**Cursor**


`cursor_.md` の中盤から最後の部分を確認中。



中盤から最後の部分を確認中。



範囲を小さく分けて確認中。中盤から最後までを複数回に分けて読み取ります。



既存の打刻画面のUIの場所を確認中です。



既存の打刻画面UIは`app/page.tsx`に完成しています。このUIを新しいルーティング構造（`/org/[org_slug]/units/[unit_slug]/terminal`）に合わせて移動・修正します。フロントエンドのUIは完成しているので、移動とルーティング対応のみ行います。



既存の打刻画面UIは`app/page.tsx`に完成しています。新しいルーティング構造の`app/org/[org_slug]/units/[unit_slug]/terminal/page.tsx`は既に作成済みで、UIは同じです。

フロントエンドのUIは完成しているため、修正は不要です。次は、バックエンドの`app/actions/attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応させる必要があります。`attendance.ts`を確認します。



フロントエンドのUIは完成しています。`app/page.tsx`の打刻画面UIは完成しており、新しいルーティング構造の`app/org/[org_slug]/units/[unit_slug]/terminal/page.tsx`にも同じUIを配置済みです。

次は、バックエンドの`app/actions/attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応させる必要があります。現在は`clinic_id`/`staff_id`を使用しています。

`attendance.ts`を新しいスキーマに対応させる作業に進みますか？

---

**User**

勝手にUIは変えないでくださいね

---

**Cursor**


了解しました。UIは変更しません。既存の打刻画面UIはそのまま維持します。

次は、バックエンドの`app/actions/attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応させる作業に進みます。UIコンポーネントは変更しません。

`attendance.ts`の更新に進みますか？

---

**User**

さっきは何を作っていたんですか？打刻画面を作成しますとか言ってましたが

---

**Cursor**


申し訳ありません。既存の`app/page.tsx`に完成した打刻画面UIがあることを確認せず、新しいルーティング構造用に`app/org/[org_slug]/units/[unit_slug]/terminal/page.tsx`を作成してしまいました。

既存のUIを確認し、新しいルーティング構造に合わせて適切に配置し直します。既存の`app/page.tsx`の内容を確認します。



既存の`app/page.tsx`の打刻画面UIを新しいルーティング構造に移動します。UIは変更せず、ルーティングパラメータ（`org_slug`, `unit_slug`）の取得のみ追加します。既存のUIを新しいルーティング構造に合わせて配置します。



既存の`app/page.tsx`のUIを新しいルーティング構造に移動します。UIは変更せず、ルーティングパラメータ（`org_slug`, `unit_slug`）の取得と「設定に戻る」リンクのみ追加します。


```typescriptreact
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import PinInput from '@/components/terminal/PinInput'
import { clockInByPin, clockOutByPin, breakOutByPin, breakInByPin, getStaffStatusByPin } from '@/app/actions/attendance'
import { Sun, Moon, DoorOpen, Home as HomeIcon, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type ClockState = 'idle' | 'authenticated' | 'action_selection' | 'success' | 'error'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

export default function TerminalPage() {
  const params = useParams()
  const orgSlug = params.org_slug as string
  const unitSlug = params.unit_slug as string

  const [state, setState] = useState<ClockState>('idle')
  const [result, setResult] = useState<ClockResult | null>(null)
  const [staffStatus, setStaffStatus] = useState<StaffStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPin, setCurrentPin] = useState('')

  // デバッグ用
  useEffect(() => {
    console.log('Home component rendered, state:', state)
  }, [state])

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setStaffStatus(null)
    setIsLoading(false)
    setCurrentPin('')
  }

  const handlePinSubmit = async (pin: string) => {
    setIsLoading(true)
    setState('authenticated')
    setCurrentPin(pin)

    try {
      const statusResult = await getStaffStatusByPin(pin)
      
      if (!statusResult.success) {
        setResult({
          success: false,
          message: statusResult.message || 'PINが正しくありません',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      if (!statusResult.status) {
        setResult({
          success: false,
          message: 'スタッフ情報の取得に失敗しました',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      setStaffStatus(statusResult.status)
      setState('action_selection')
      setIsLoading(false)
    } catch (error) {
      console.error('PIN submit error:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
      setIsLoading(false)
    }
  }

  const handleAction = async (action: 'in' | 'out' | 'break_out' | 'break_in') => {
    if (!currentPin) return

    setIsLoading(true)

    try {
      let clockResult: ClockResult

      switch (action) {
        case 'in':
          clockResult = await clockInByPin(currentPin)
          break
        case 'out':
          clockResult = await clockOutByPin(currentPin)
          break
        case 'break_out':
          clockResult = await breakOutByPin(currentPin)
          break
        case 'break_in':
          clockResult = await breakInByPin(currentPin)
          break
        default:
          clockResult = {
            success: false,
            message: '不明なアクションです',
          }
      }

      setResult(clockResult)
      setState(clockResult.success ? 'success' : 'error')
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-slate-800 mb-2 tracking-widest">勤怠管理システム</h1>
          {state === 'idle' && (
            <p className="text-slate-500 text-sm tracking-wider">PINコードを入力してください</p>
          )}
        </div>

        {state === 'idle' && (
          <PinInput onPinSubmit={handlePinSubmit} isLoading={isLoading} />
        )}

        {state === 'authenticated' && isLoading && (
          <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-100">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">認証中...</p>
          </div>
        )}

        {state === 'action_selection' && staffStatus && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              {!staffStatus.hasAttendance && (
                <>
                  <p className="text-2xl font-bold text-slate-800 mb-3">{staffStatus.staffName}さん</p>
                  <p className="text-lg text-slate-500">おはようございます！</p>
                </>
              )}
              {staffStatus.hasAttendance && (
                <>
                  <p className="text-lg text-slate-500 mb-2">お疲れ様です！</p>
                  <p className="text-2xl font-bold text-slate-800">{staffStatus.staffName}さん</p>
                  {staffStatus.isOnBreak && (
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      <DoorOpen className="w-4 h-4" />
                      外出中
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!staffStatus.hasAttendance && (
                <button
                  onClick={() => handleAction('in')}
                  disabled={isLoading}
                  className="col-span-2 group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sun className="w-8 h-8 mb-2 group-hover:animate-pulse" />
                  <span className="text-xl font-bold">出勤</span>
                </button>
              )}
              
              {staffStatus.hasAttendance && !staffStatus.isOnBreak && (
                <>
                  <button
                    onClick={() => handleAction('break_out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-white border-2 border-amber-200 text-amber-700 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DoorOpen className="w-8 h-8 mb-2 text-amber-500" />
                    <span className="text-lg font-bold">外出</span>
                  </button>
                  <button
                    onClick={() => handleAction('out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Moon className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform" />
                    <span className="text-lg font-bold">退勤</span>
                  </button>
                </>
              )}

              {staffStatus.hasAttendance && staffStatus.isOnBreak && (
                <button
                  onClick={() => handleAction('break_in')}
                  disabled={isLoading}
                  className="col-span-2 group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HomeIcon className="w-8 h-8 mb-2" />
                  <span className="text-xl font-bold">戻り</span>
                </button>
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                PIN入力に戻る
              </button>
            </div>
          </div>
        )}

        {state === 'error' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">エラー</h3>
            <p className="text-slate-600 mb-6">{result.message}</p>
            <button
              onClick={handleReset}
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors w-full font-medium shadow-sm hover:shadow"
            >
              もう一度試す
            </button>
          </div>
        )}

        {state === 'success' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="mb-8">
              {result.clockType === 'break_out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">いってらっしゃい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'break_in' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">おかえりなさい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">お疲れ様でした！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">出勤しました</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時刻: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              PIN入力に戻る
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href={`/org/${orgSlug}/units/${unitSlug}`}
            className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >
            設定に戻る
          </Link>
        </div>
      </div>
    </main>
  )
}


```


既存のUIをそのまま使用するため、デバッグ用の`useEffect`を追加しました。最後の「設定に戻る」リンクは既存のUIにないため、削除します。


```typescriptreact
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import PinInput from '@/components/terminal/PinInput'
import { clockInByPin, clockOutByPin, breakOutByPin, breakInByPin, getStaffStatusByPin } from '@/app/actions/attendance'
import { Sun, Moon, DoorOpen, Home as HomeIcon, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type ClockState = 'idle' | 'authenticated' | 'action_selection' | 'success' | 'error'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

export default function TerminalPage() {
  const params = useParams()
  const orgSlug = params.org_slug as string
  const unitSlug = params.unit_slug as string

  const [state, setState] = useState<ClockState>('idle')
  const [result, setResult] = useState<ClockResult | null>(null)
  const [staffStatus, setStaffStatus] = useState<StaffStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPin, setCurrentPin] = useState('')

  // デバッグ用
  useEffect(() => {
    console.log('Home component rendered, state:', state)
  }, [state])

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setStaffStatus(null)
    setIsLoading(false)
    setCurrentPin('')
  }

  const handlePinSubmit = async (pin: string) => {
    setIsLoading(true)
    setState('authenticated')
    setCurrentPin(pin)

    try {
      const statusResult = await getStaffStatusByPin(pin)
      
      if (!statusResult.success) {
        setResult({
          success: false,
          message: statusResult.message || 'PINが正しくありません',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      if (!statusResult.status) {
        setResult({
          success: false,
          message: 'スタッフ情報の取得に失敗しました',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      setStaffStatus(statusResult.status)
      setState('action_selection')
      setIsLoading(false)
    } catch (error) {
      console.error('PIN submit error:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
      setIsLoading(false)
    }
  }

  const handleAction = async (action: 'in' | 'out' | 'break_out' | 'break_in') => {
    if (!currentPin) return

    setIsLoading(true)

    try {
      let clockResult: ClockResult

      switch (action) {
        case 'in':
          clockResult = await clockInByPin(currentPin)
          break
        case 'out':
          clockResult = await clockOutByPin(currentPin)
          break
        case 'break_out':
          clockResult = await breakOutByPin(currentPin)
          break
        case 'break_in':
          clockResult = await breakInByPin(currentPin)
          break
        default:
          clockResult = {
            success: false,
            message: '不明なアクションです',
          }
      }

      setResult(clockResult)
      setState(clockResult.success ? 'success' : 'error')
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-slate-800 mb-2 tracking-widest">勤怠管理システム</h1>
          {state === 'idle' && (
            <p className="text-slate-500 text-sm tracking-wider">PINコードを入力してください</p>
          )}
        </div>

        {state === 'idle' && (
          <PinInput onPinSubmit={handlePinSubmit} isLoading={isLoading} />
        )}

        {state === 'authenticated' && isLoading && (
          <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-100">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">認証中...</p>
          </div>
        )}

        {state === 'action_selection' && staffStatus && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              {!staffStatus.hasAttendance && (
                <>
                  <p className="text-2xl font-bold text-slate-800 mb-3">{staffStatus.staffName}さん</p>
                  <p className="text-lg text-slate-500">おはようございます！</p>
                </>
              )}
              {staffStatus.hasAttendance && (
                <>
                  <p className="text-lg text-slate-500 mb-2">お疲れ様です！</p>
                  <p className="text-2xl font-bold text-slate-800">{staffStatus.staffName}さん</p>
                  {staffStatus.isOnBreak && (
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      <DoorOpen className="w-4 h-4" />
                      外出中
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!staffStatus.hasAttendance && (
                <button
                  onClick={() => handleAction('in')}
                  disabled={isLoading}
                  className="col-span-2 group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sun className="w-8 h-8 mb-2 group-hover:animate-pulse" />
                  <span className="text-xl font-bold">出勤</span>
                </button>
              )}
              
              {staffStatus.hasAttendance && !staffStatus.isOnBreak && (
                <>
                  <button
                    onClick={() => handleAction('break_out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-white border-2 border-amber-200 text-amber-700 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DoorOpen className="w-8 h-8 mb-2 text-amber-500" />
                    <span className="text-lg font-bold">外出</span>
                  </button>
                  <button
                    onClick={() => handleAction('out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Moon className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform" />
                    <span className="text-lg font-bold">退勤</span>
                  </button>
                </>
              )}

              {staffStatus.hasAttendance && staffStatus.isOnBreak && (
                <button
                  onClick={() => handleAction('break_in')}
                  disabled={isLoading}
                  className="col-span-2 group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HomeIcon className="w-8 h-8 mb-2" />
                  <span className="text-xl font-bold">戻り</span>
                </button>
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                PIN入力に戻る
              </button>
            </div>
          </div>
        )}

        {state === 'error' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">エラー</h3>
            <p className="text-slate-600 mb-6">{result.message}</p>
            <button
              onClick={handleReset}
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors w-full font-medium shadow-sm hover:shadow"
            >
              もう一度試す
            </button>
          </div>
        )}

        {state === 'success' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="mb-8">
              {result.clockType === 'break_out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">いってらっしゃい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'break_in' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">おかえりなさい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">お疲れ様でした！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">出勤しました</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時刻: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              PIN入力に戻る
            </button>
          </div>
        )}
      </div>
    </main>
  )
}


```


不要になった`Link`のインポートを削除します。


```typescriptreact
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import PinInput from '@/components/terminal/PinInput'
import { clockInByPin, clockOutByPin, breakOutByPin, breakInByPin, getStaffStatusByPin } from '@/app/actions/attendance'
import { Sun, Moon, DoorOpen, Home as HomeIcon, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type ClockState = 'idle' | 'authenticated' | 'action_selection' | 'success' | 'error'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

export default function TerminalPage() {
  const params = useParams()
  const orgSlug = params.org_slug as string
  const unitSlug = params.unit_slug as string

  const [state, setState] = useState<ClockState>('idle')
  const [result, setResult] = useState<ClockResult | null>(null)
  const [staffStatus, setStaffStatus] = useState<StaffStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPin, setCurrentPin] = useState('')

  // デバッグ用
  useEffect(() => {
    console.log('Home component rendered, state:', state)
  }, [state])

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setStaffStatus(null)
    setIsLoading(false)
    setCurrentPin('')
  }

  const handlePinSubmit = async (pin: string) => {
    setIsLoading(true)
    setState('authenticated')
    setCurrentPin(pin)

    try {
      const statusResult = await getStaffStatusByPin(pin)
      
      if (!statusResult.success) {
        setResult({
          success: false,
          message: statusResult.message || 'PINが正しくありません',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      if (!statusResult.status) {
        setResult({
          success: false,
          message: 'スタッフ情報の取得に失敗しました',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      setStaffStatus(statusResult.status)
      setState('action_selection')
      setIsLoading(false)
    } catch (error) {
      console.error('PIN submit error:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
      setIsLoading(false)
    }
  }

  const handleAction = async (action: 'in' | 'out' | 'break_out' | 'break_in') => {
    if (!currentPin) return

    setIsLoading(true)

    try {
      let clockResult: ClockResult

      switch (action) {
        case 'in':
          clockResult = await clockInByPin(currentPin)
          break
        case 'out':
          clockResult = await clockOutByPin(currentPin)
          break
        case 'break_out':
          clockResult = await breakOutByPin(currentPin)
          break
        case 'break_in':
          clockResult = await breakInByPin(currentPin)
          break
        default:
          clockResult = {
            success: false,
            message: '不明なアクションです',
          }
      }

      setResult(clockResult)
      setState(clockResult.success ? 'success' : 'error')
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-slate-800 mb-2 tracking-widest">勤怠管理システム</h1>
          {state === 'idle' && (
            <p className="text-slate-500 text-sm tracking-wider">PINコードを入力してください</p>
          )}
        </div>

        {state === 'idle' && (
          <PinInput onPinSubmit={handlePinSubmit} isLoading={isLoading} />
        )}

        {state === 'authenticated' && isLoading && (
          <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-100">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">認証中...</p>
          </div>
        )}

        {state === 'action_selection' && staffStatus && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              {!staffStatus.hasAttendance && (
                <>
                  <p className="text-2xl font-bold text-slate-800 mb-3">{staffStatus.staffName}さん</p>
                  <p className="text-lg text-slate-500">おはようございます！</p>
                </>
              )}
              {staffStatus.hasAttendance && (
                <>
                  <p className="text-lg text-slate-500 mb-2">お疲れ様です！</p>
                  <p className="text-2xl font-bold text-slate-800">{staffStatus.staffName}さん</p>
                  {staffStatus.isOnBreak && (
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      <DoorOpen className="w-4 h-4" />
                      外出中
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!staffStatus.hasAttendance && (
                <button
                  onClick={() => handleAction('in')}
                  disabled={isLoading}
                  className="col-span-2 group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sun className="w-8 h-8 mb-2 group-hover:animate-pulse" />
                  <span className="text-xl font-bold">出勤</span>
                </button>
              )}
              
              {staffStatus.hasAttendance && !staffStatus.isOnBreak && (
                <>
                  <button
                    onClick={() => handleAction('break_out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-white border-2 border-amber-200 text-amber-700 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DoorOpen className="w-8 h-8 mb-2 text-amber-500" />
                    <span className="text-lg font-bold">外出</span>
                  </button>
                  <button
                    onClick={() => handleAction('out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Moon className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform" />
                    <span className="text-lg font-bold">退勤</span>
                  </button>
                </>
              )}

              {staffStatus.hasAttendance && staffStatus.isOnBreak && (
                <button
                  onClick={() => handleAction('break_in')}
                  disabled={isLoading}
                  className="col-span-2 group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HomeIcon className="w-8 h-8 mb-2" />
                  <span className="text-xl font-bold">戻り</span>
                </button>
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                PIN入力に戻る
              </button>
            </div>
          </div>
        )}

        {state === 'error' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">エラー</h3>
            <p className="text-slate-600 mb-6">{result.message}</p>
            <button
              onClick={handleReset}
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors w-full font-medium shadow-sm hover:shadow"
            >
              もう一度試す
            </button>
          </div>
        )}

        {state === 'success' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="mb-8">
              {result.clockType === 'break_out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">いってらっしゃい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'break_in' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">おかえりなさい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">お疲れ様でした！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">出勤しました</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時刻: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              PIN入力に戻る
            </button>
          </div>
        )}
      </div>
    </main>
  )
}


```


未使用の`useParams`を削除します。


```typescriptreact
'use client'

import { useState, useEffect } from 'react'
import PinInput from '@/components/terminal/PinInput'
import { clockInByPin, clockOutByPin, breakOutByPin, breakInByPin, getStaffStatusByPin } from '@/app/actions/attendance'
import { Sun, Moon, DoorOpen, Home as HomeIcon, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type ClockState = 'idle' | 'authenticated' | 'action_selection' | 'success' | 'error'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

export default function TerminalPage() {
  const params = useParams()
  const orgSlug = params.org_slug as string
  const unitSlug = params.unit_slug as string

  const [state, setState] = useState<ClockState>('idle')
  const [result, setResult] = useState<ClockResult | null>(null)
  const [staffStatus, setStaffStatus] = useState<StaffStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPin, setCurrentPin] = useState('')

  // デバッグ用
  useEffect(() => {
    console.log('Home component rendered, state:', state)
  }, [state])

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setStaffStatus(null)
    setIsLoading(false)
    setCurrentPin('')
  }

  const handlePinSubmit = async (pin: string) => {
    setIsLoading(true)
    setState('authenticated')
    setCurrentPin(pin)

    try {
      const statusResult = await getStaffStatusByPin(pin)
      
      if (!statusResult.success) {
        setResult({
          success: false,
          message: statusResult.message || 'PINが正しくありません',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      if (!statusResult.status) {
        setResult({
          success: false,
          message: 'スタッフ情報の取得に失敗しました',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      setStaffStatus(statusResult.status)
      setState('action_selection')
      setIsLoading(false)
    } catch (error) {
      console.error('PIN submit error:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
      setIsLoading(false)
    }
  }

  const handleAction = async (action: 'in' | 'out' | 'break_out' | 'break_in') => {
    if (!currentPin) return

    setIsLoading(true)

    try {
      let clockResult: ClockResult

      switch (action) {
        case 'in':
          clockResult = await clockInByPin(currentPin)
          break
        case 'out':
          clockResult = await clockOutByPin(currentPin)
          break
        case 'break_out':
          clockResult = await breakOutByPin(currentPin)
          break
        case 'break_in':
          clockResult = await breakInByPin(currentPin)
          break
        default:
          clockResult = {
            success: false,
            message: '不明なアクションです',
          }
      }

      setResult(clockResult)
      setState(clockResult.success ? 'success' : 'error')
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-slate-800 mb-2 tracking-widest">勤怠管理システム</h1>
          {state === 'idle' && (
            <p className="text-slate-500 text-sm tracking-wider">PINコードを入力してください</p>
          )}
        </div>

        {state === 'idle' && (
          <PinInput onPinSubmit={handlePinSubmit} isLoading={isLoading} />
        )}

        {state === 'authenticated' && isLoading && (
          <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-100">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">認証中...</p>
          </div>
        )}

        {state === 'action_selection' && staffStatus && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              {!staffStatus.hasAttendance && (
                <>
                  <p className="text-2xl font-bold text-slate-800 mb-3">{staffStatus.staffName}さん</p>
                  <p className="text-lg text-slate-500">おはようございます！</p>
                </>
              )}
              {staffStatus.hasAttendance && (
                <>
                  <p className="text-lg text-slate-500 mb-2">お疲れ様です！</p>
                  <p className="text-2xl font-bold text-slate-800">{staffStatus.staffName}さん</p>
                  {staffStatus.isOnBreak && (
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      <DoorOpen className="w-4 h-4" />
                      外出中
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!staffStatus.hasAttendance && (
                <button
                  onClick={() => handleAction('in')}
                  disabled={isLoading}
                  className="col-span-2 group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sun className="w-8 h-8 mb-2 group-hover:animate-pulse" />
                  <span className="text-xl font-bold">出勤</span>
                </button>
              )}
              
              {staffStatus.hasAttendance && !staffStatus.isOnBreak && (
                <>
                  <button
                    onClick={() => handleAction('break_out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-white border-2 border-amber-200 text-amber-700 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DoorOpen className="w-8 h-8 mb-2 text-amber-500" />
                    <span className="text-lg font-bold">外出</span>
                  </button>
                  <button
                    onClick={() => handleAction('out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Moon className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform" />
                    <span className="text-lg font-bold">退勤</span>
                  </button>
                </>
              )}

              {staffStatus.hasAttendance && staffStatus.isOnBreak && (
                <button
                  onClick={() => handleAction('break_in')}
                  disabled={isLoading}
                  className="col-span-2 group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HomeIcon className="w-8 h-8 mb-2" />
                  <span className="text-xl font-bold">戻り</span>
                </button>
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                PIN入力に戻る
              </button>
            </div>
          </div>
        )}

        {state === 'error' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">エラー</h3>
            <p className="text-slate-600 mb-6">{result.message}</p>
            <button
              onClick={handleReset}
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors w-full font-medium shadow-sm hover:shadow"
            >
              もう一度試す
            </button>
          </div>
        )}

        {state === 'success' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="mb-8">
              {result.clockType === 'break_out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">いってらっしゃい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'break_in' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">おかえりなさい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">お疲れ様でした！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">出勤しました</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時刻: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              PIN入力に戻る
            </button>
          </div>
        )}
      </div>
    </main>
  )
}


```

```typescriptreact
'use client'

import { useState, useEffect } from 'react'
import PinInput from '@/components/terminal/PinInput'
import { clockInByPin, clockOutByPin, breakOutByPin, breakInByPin, getStaffStatusByPin } from '@/app/actions/attendance'
import { Sun, Moon, DoorOpen, Home as HomeIcon, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type ClockState = 'idle' | 'authenticated' | 'action_selection' | 'success' | 'error'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

export default function TerminalPage() {
  const [state, setState] = useState<ClockState>('idle')
  const [result, setResult] = useState<ClockResult | null>(null)
  const [staffStatus, setStaffStatus] = useState<StaffStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPin, setCurrentPin] = useState('')

  // デバッグ用
  useEffect(() => {
    console.log('Home component rendered, state:', state)
  }, [state])

  const handleReset = () => {
    setState('idle')
    setResult(null)
    setStaffStatus(null)
    setIsLoading(false)
    setCurrentPin('')
  }

  const handlePinSubmit = async (pin: string) => {
    setIsLoading(true)
    setState('authenticated')
    setCurrentPin(pin)

    try {
      const statusResult = await getStaffStatusByPin(pin)
      
      if (!statusResult.success) {
        setResult({
          success: false,
          message: statusResult.message || 'PINが正しくありません',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      if (!statusResult.status) {
        setResult({
          success: false,
          message: 'スタッフ情報の取得に失敗しました',
        })
        setState('error')
        setIsLoading(false)
        return
      }

      setStaffStatus(statusResult.status)
      setState('action_selection')
      setIsLoading(false)
    } catch (error) {
      console.error('PIN submit error:', error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
      setIsLoading(false)
    }
  }

  const handleAction = async (action: 'in' | 'out' | 'break_out' | 'break_in') => {
    if (!currentPin) return

    setIsLoading(true)

    try {
      let clockResult: ClockResult

      switch (action) {
        case 'in':
          clockResult = await clockInByPin(currentPin)
          break
        case 'out':
          clockResult = await clockOutByPin(currentPin)
          break
        case 'break_out':
          clockResult = await breakOutByPin(currentPin)
          break
        case 'break_in':
          clockResult = await breakInByPin(currentPin)
          break
        default:
          clockResult = {
            success: false,
            message: '不明なアクションです',
          }
      }

      setResult(clockResult)
      setState(clockResult.success ? 'success' : 'error')
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      })
      setState('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-slate-800 mb-2 tracking-widest">勤怠管理システム</h1>
          {state === 'idle' && (
            <p className="text-slate-500 text-sm tracking-wider">PINコードを入力してください</p>
          )}
        </div>

        {state === 'idle' && (
          <PinInput onPinSubmit={handlePinSubmit} isLoading={isLoading} />
        )}

        {state === 'authenticated' && isLoading && (
          <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-100">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">認証中...</p>
          </div>
        )}

        {state === 'action_selection' && staffStatus && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              {!staffStatus.hasAttendance && (
                <>
                  <p className="text-2xl font-bold text-slate-800 mb-3">{staffStatus.staffName}さん</p>
                  <p className="text-lg text-slate-500">おはようございます！</p>
                </>
              )}
              {staffStatus.hasAttendance && (
                <>
                  <p className="text-lg text-slate-500 mb-2">お疲れ様です！</p>
                  <p className="text-2xl font-bold text-slate-800">{staffStatus.staffName}さん</p>
                  {staffStatus.isOnBreak && (
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                      <DoorOpen className="w-4 h-4" />
                      外出中
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!staffStatus.hasAttendance && (
                <button
                  onClick={() => handleAction('in')}
                  disabled={isLoading}
                  className="col-span-2 group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sun className="w-8 h-8 mb-2 group-hover:animate-pulse" />
                  <span className="text-xl font-bold">出勤</span>
                </button>
              )}
              
              {staffStatus.hasAttendance && !staffStatus.isOnBreak && (
                <>
                  <button
                    onClick={() => handleAction('break_out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-white border-2 border-amber-200 text-amber-700 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DoorOpen className="w-8 h-8 mb-2 text-amber-500" />
                    <span className="text-lg font-bold">外出</span>
                  </button>
                  <button
                    onClick={() => handleAction('out')}
                    disabled={isLoading}
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Moon className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform" />
                    <span className="text-lg font-bold">退勤</span>
                  </button>
                </>
              )}

              {staffStatus.hasAttendance && staffStatus.isOnBreak && (
                <button
                  onClick={() => handleAction('break_in')}
                  disabled={isLoading}
                  className="col-span-2 group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HomeIcon className="w-8 h-8 mb-2" />
                  <span className="text-xl font-bold">戻り</span>
                </button>
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" />
                PIN入力に戻る
              </button>
            </div>
          </div>
        )}

        {state === 'error' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">エラー</h3>
            <p className="text-slate-600 mb-6">{result.message}</p>
            <button
              onClick={handleReset}
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors w-full font-medium shadow-sm hover:shadow"
            >
              もう一度試す
            </button>
          </div>
        )}

        {state === 'success' && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            
            <div className="mb-8">
              {result.clockType === 'break_out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">いってらっしゃい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'break_in' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">おかえりなさい！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : result.clockType === 'out' ? (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">お疲れ様でした！</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時間: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-emerald-700 mb-4">出勤しました</h3>
                  {result.staffName && (
                    <p className="text-xl text-slate-800 font-medium mb-2">{result.staffName}さん</p>
                  )}
                  {result.actualTime && (
                    <p className="text-slate-500 font-mono bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100">
                      打刻時刻: <span className="text-slate-800 font-bold">{result.actualTime}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors px-4 py-2 rounded-full hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" />
              PIN入力に戻る
            </button>
          </div>
        )}
      </div>
    </main>
  )
}


```


既存のUIをそのまま使用するため、`app/page.tsx`の内容を新しいルーティング構造にコピーしました。UIは変更していません。

次は、バックエンドの`app/actions/attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応させる作業に進みます。

---

**User**

打刻画面の確認はできますか？

---

**Cursor**


打刻画面のファイルを確認中です。



打刻画面のファイルを確認しました。

**確認結果:**

1. **UIコンポーネント**: 既存の`app/page.tsx`と同じUIを新しいルーティング構造に配置済み
2. **機能**: 以下が実装済み
   - PIN入力画面
   - 認証中のローディング表示
   - 出勤/退勤/外出/戻りボタン（状態に応じた表示）
   - 成功/エラー表示
   - デバッグ用の`useEffect`

3. **注意点**: 
   - `StaffStatus`インターフェースが`clinicId`を使用（バックエンドが未更新のため）
   - バックエンドの`app/actions/attendance.ts`がまだ`clinic_id`/`staff_id`を使用しているため、新しいスキーマ（`unit_id`/`employee_id`）に対応が必要

UIは既存のものを維持しています。次はバックエンドの`attendance.ts`を新しいスキーマに対応させる作業に進みますか？

---

**User**

質問にちゃんと答えてください。打刻画面のUIが変わっていないかどうか確認したいといっているのです。

---

**Cursor**


既存の`app/page.tsx`と新しい打刻画面のUIを比較して、変更がないか確認します。



**UIの比較結果:**

既存の`app/page.tsx`と新しい`app/org/[org_slug]/units/[unit_slug]/terminal/page.tsx`のUI部分（return部分、131-318行目）は**完全に同じ**です。

**確認した内容:**
- JSXの構造・クラス名・テキストは同一
- ボタンの配置・スタイルは同一
- 状態に応じた表示ロジックは同一
- エラー・成功メッセージの表示は同一

**違い:**
- 関数名のみ: `Home` → `TerminalPage`（UIには影響なし）
- デバッグ用のconsole.logメッセージは同じ

**結論:** UIは変更されていません。既存のUIをそのまま新しいルーティング構造に配置しています。

---

**User**

打刻画面が変わっていないことを確認できました。現在はルートに打刻画面がありますが、これが Orgごとになるんでしょうか？

---

**Cursor**


ルーティング設計を確認中です。



ROADMAPとREADMEを確認しました。

**設計上のルーティング構造:**

1. **`/`** - サービス紹介ページ（LP）になる予定
2. **`/org/:org_slug/units/:unit_slug/terminal`** - 打刻画面

**現在の状況:**
- `app/page.tsx`に打刻画面がある（移行前の状態）
- `app/org/[org_slug]/units/[unit_slug]/terminal/page.tsx`にも打刻画面を作成済み

**結論:**
はい、打刻画面はOrgごと（正確には`/org/:org_slug/units/:unit_slug/terminal`）になります。

今後は：
- `app/page.tsx`をサービス紹介ページ（LP）に変更
- 打刻画面は`/org/:org_slug/units/:unit_slug/terminal`のみに存在

これにより、複数のorganizationが存在する場合でも、各organizationの各unitごとに独立した打刻画面を提供できます。

現在の`app/page.tsx`の打刻画面は、移行完了後にサービス紹介ページに置き換える予定です。

---

**User**

はい、わかりました。続けてください。随時、loadmapを更新してくれるとありがたいです。

---

**Cursor**


バックエンドの`app/actions/attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応させます。まず、現在の実装を確認します。



型定義を確認し、`attendance.ts`を新しいスキーマに対応させます。



`lib/auth/utils.ts`の`getUnitIdBySlug`を確認中。続いて`attendance.ts`を新しいスキーマに対応させます。



`attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応させます。UIは変更せず、PINからemployeeを特定し、そのemployeeのunit_idを取得する方式にします。



`attendance.ts`を新しいスキーマに対応させます。UIは変更しないため、フロントエンドの`StaffStatus`インターフェースは後方互換性のため維持します。


```typescript
'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  clinicId: string,
  staffId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('staff_id', staffId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  clinicId: string,
  staffId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('staff_id', staffId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('staff_id', staffId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後のスタッフ状態を取得
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Staff found:', staff.name, 'ID:', staff.id)

    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      console.error('getStaffStatusByPin: Clinic not found for clinic_id:', staff.clinic_id)
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Clinic found:', clinic.name, 'timezone:', clinic.timezone)

    if (!clinic.timezone) {
      console.error('getStaffStatusByPin: Clinic timezone is missing')
      return {
        success: false,
        message: 'クリニックのタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), clinic.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(staff.clinic_id, staff.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    const status: StaffStatus = {
      staffId: staff.id,
      staffName: staff.name,
      clinicId: staff.clinic_id,
      hasAttendance,
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        clinic_id: staff.clinic_id,
        staff_id: staff.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}


```

```typescript
'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後のスタッフ状態を取得
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Staff found:', staff.name, 'ID:', staff.id)

    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      console.error('getStaffStatusByPin: Clinic not found for clinic_id:', staff.clinic_id)
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Clinic found:', clinic.name, 'timezone:', clinic.timezone)

    if (!clinic.timezone) {
      console.error('getStaffStatusByPin: Clinic timezone is missing')
      return {
        success: false,
        message: 'クリニックのタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), clinic.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(staff.clinic_id, staff.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    const status: StaffStatus = {
      staffId: staff.id,
      staffName: staff.name,
      clinicId: staff.clinic_id,
      hasAttendance,
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        clinic_id: staff.clinic_id,
        staff_id: staff.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}


```

```typescript
'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後の従業員状態を取得
 * フロントエンドとの後方互換性のため、StaffStatusインターフェースを返す
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Employee found:', employee.name, 'ID:', employee.id)

    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      console.error('getStaffStatusByPin: Unit not found for unit_id:', employee.unit_id)
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Unit found:', unit.name, 'timezone:', unit.timezone)

    if (!unit.timezone) {
      console.error('getStaffStatusByPin: Unit timezone is missing')
      return {
        success: false,
        message: '拠点のタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), unit.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(employee.unit_id, employee.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    // 後方互換性のため、StaffStatusインターフェースを使用（clinicIdはunitIdを返す）
    const status: StaffStatus = {
      staffId: employee.id,
      staffName: employee.name,
      clinicId: employee.unit_id, // 後方互換性のため、unit_idをclinicIdとして返す
      hasAttendance,
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        clinic_id: staff.clinic_id,
        staff_id: staff.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}


```

```typescript
'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後の従業員状態を取得
 * フロントエンドとの後方互換性のため、StaffStatusインターフェースを返す
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Employee found:', employee.name, 'ID:', employee.id)

    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      console.error('getStaffStatusByPin: Unit not found for unit_id:', employee.unit_id)
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Unit found:', unit.name, 'timezone:', unit.timezone)

    if (!unit.timezone) {
      console.error('getStaffStatusByPin: Unit timezone is missing')
      return {
        success: false,
        message: '拠点のタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), unit.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(employee.unit_id, employee.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    // 後方互換性のため、StaffStatusインターフェースを使用（clinicIdはunitIdを返す）
    const status: StaffStatus = {
      staffId: employee.id,
      staffName: employee.name,
      clinicId: employee.unit_id, // 後方互換性のため、unit_idをclinicIdとして返す
      hasAttendance,
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        unit_id: employee.unit_id,
        employee_id: employee.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: employee.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: staff.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}


```

```typescript
'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後の従業員状態を取得
 * フロントエンドとの後方互換性のため、StaffStatusインターフェースを返す
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Employee found:', employee.name, 'ID:', employee.id)

    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      console.error('getStaffStatusByPin: Unit not found for unit_id:', employee.unit_id)
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Unit found:', unit.name, 'timezone:', unit.timezone)

    if (!unit.timezone) {
      console.error('getStaffStatusByPin: Unit timezone is missing')
      return {
        success: false,
        message: '拠点のタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), unit.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(employee.unit_id, employee.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    // 後方互換性のため、StaffStatusインターフェースを使用（clinicIdはunitIdを返す）
    const status: StaffStatus = {
      staffId: employee.id,
      staffName: employee.name,
      clinicId: employee.unit_id, // 後方互換性のため、unit_idをclinicIdとして返す
      hasAttendance,
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        unit_id: employee.unit_id,
        employee_id: employee.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: employee.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: employee.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}


```

```typescript
'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後の従業員状態を取得
 * フロントエンドとの後方互換性のため、StaffStatusインターフェースを返す
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Employee found:', employee.name, 'ID:', employee.id)

    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      console.error('getStaffStatusByPin: Unit not found for unit_id:', employee.unit_id)
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Unit found:', unit.name, 'timezone:', unit.timezone)

    if (!unit.timezone) {
      console.error('getStaffStatusByPin: Unit timezone is missing')
      return {
        success: false,
        message: '拠点のタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), unit.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(employee.unit_id, employee.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    // 後方互換性のため、StaffStatusインターフェースを使用（clinicIdはunitIdを返す）
    const status: StaffStatus = {
      staffId: employee.id,
      staffName: employee.name,
      clinicId: employee.unit_id, // 後方互換性のため、unit_idをclinicIdとして返す
      hasAttendance,
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        unit_id: employee.unit_id,
        employee_id: employee.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: employee.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: employee.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: employee.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINでスタッフを検証
    const staff = await verifyStaffByPin(pin)
    if (!staff) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // クリニック設定を取得
    const clinic = await getClinic(staff.clinic_id)
    if (!clinic) {
      return {
        success: false,
        message: 'クリニック設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), clinic.timezone)
    const existingAttendance = await getTodayAttendance(staff.clinic_id, staff.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      clinic.timezone,
      clinic.rounding_unit,
      clinic.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      clinic_id: staff.clinic_id,
      staff_id: staff.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: staff.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}


```

```typescript
'use server'

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { verifyPin } from '@/lib/utils/pin'
import { getRoundedNow, formatWorkDate, formatTime } from '@/lib/utils/time'
import type { Employee, Unit, Attendance, AttendanceLogInsert } from '@/types/database'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'

interface ClockResult {
  success: boolean
  message: string
  staffName?: string
  clockType?: 'in' | 'out' | 'break_out' | 'break_in'
  actualTime?: string
  effectiveTime?: string
}

// フロントエンドとの後方互換性のため、StaffStatusインターフェースを維持
interface StaffStatus {
  staffId: string
  staffName: string
  clinicId: string
  hasAttendance: boolean
  isOnBreak: boolean
  attendanceId?: string
}

/**
 * PINで従業員を検証
 */
async function verifyEmployeeByPin(pin: string): Promise<Employee | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // アクティブな従業員を全件取得
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('id, unit_id, name, hourly_wage, pin_hash, is_active')
    .eq('is_active', true)

  if (error || !employees) {
    console.error('Error fetching employees:', error)
    return null
  }

  // PINを検証
  console.log('verifyEmployeeByPin: Checking', employees.length, 'employees')
  for (const employee of employees) {
    console.log('verifyEmployeeByPin: Checking employee:', employee.name, 'PIN hash length:', employee.pin_hash?.length)
    try {
      const isValid = await verifyPin(pin, employee.pin_hash)
      console.log('verifyEmployeeByPin: PIN verification result for', employee.name, ':', isValid)
      if (isValid) {
        console.log('verifyEmployeeByPin: PIN verified successfully for', employee.name)
        return employee as Employee
      }
    } catch (error) {
      console.error('verifyEmployeeByPin: Error verifying PIN for', employee.name, ':', error)
    }
  }

  console.log('verifyEmployeeByPin: No matching employee found for PIN')
  return null
}

/**
 * unit設定を取得
 */
async function getUnit(unitId: string): Promise<Unit | null> {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', unitId)
    .single()

  if (error || !data) {
    console.error('Error fetching unit:', error)
    return null
  }

  return data as Unit
}

/**
 * 当日の勤怠レコードを取得（開いているもの）
 */
async function getTodayAttendance(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * 当日の勤怠レコードを取得（状態に関係なく）
 * 複数レコードがある場合は、最新のもの（status='open'を優先、なければ最新）を返す
 */
async function getTodayAttendanceAnyStatus(
  unitId: string,
  employeeId: string,
  workDate: string
): Promise<Attendance | null> {
  const supabaseAdmin = getSupabaseAdmin()

  // まず、status='open'のレコードを優先的に取得
  const { data: openData, error: openError } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openError) {
    console.error('Error fetching open attendance:', openError)
  }

  if (openData) {
    return openData as Attendance
  }

  // status='open'のレコードがない場合、最新のレコードを取得
  const { data, error } = await supabaseAdmin
    .from('attendances')
    .select('*')
    .eq('unit_id', unitId)
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching attendance:', error)
    return null
  }

  return data as Attendance | null
}

/**
 * PIN入力後の従業員状態を取得
 * フロントエンドとの後方互換性のため、StaffStatusインターフェースを返す
 */
export async function getStaffStatusByPin(pin: string): Promise<{ success: boolean; status?: StaffStatus; message?: string }> {
  noStore()
  try {
    console.log('getStaffStatusByPin: Starting PIN verification')
    
    if (!pin || pin.length !== 4) {
      return {
        success: false,
        message: 'PINは4桁の数字である必要があります',
      }
    }

    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      console.log('getStaffStatusByPin: PIN verification failed')
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    console.log('getStaffStatusByPin: Employee found:', employee.name, 'ID:', employee.id)

    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      console.error('getStaffStatusByPin: Unit not found for unit_id:', employee.unit_id)
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    console.log('getStaffStatusByPin: Unit found:', unit.name, 'timezone:', unit.timezone)

    if (!unit.timezone) {
      console.error('getStaffStatusByPin: Unit timezone is missing')
      return {
        success: false,
        message: '拠点のタイムゾーン設定がありません',
      }
    }

    let today: string
    try {
      today = formatWorkDate(new Date(), unit.timezone)
      console.log('getStaffStatusByPin: Today:', today)
    } catch (error) {
      console.error('getStaffStatusByPin: Error formatting work date:', error)
      return {
        success: false,
        message: '日付の取得に失敗しました',
      }
    }
    
    let attendance: Attendance | null = null
    try {
      attendance = await getTodayAttendanceAnyStatus(employee.unit_id, employee.id, today)
      console.log('getStaffStatusByPin: Attendance:', attendance ? `found (status: ${attendance.status}, break_out: ${attendance.break_out_actual}, break_in: ${attendance.break_in_actual})` : 'not found')
      if (attendance) {
        console.log('getStaffStatusByPin: Full attendance data:', JSON.stringify(attendance, null, 2))
      }
    } catch (error) {
      console.error('getStaffStatusByPin: Error fetching attendance:', error)
      // エラーが発生しても続行（attendanceはnullのまま）
    }

    // 外出中かどうかを判定（break_out_actualが存在し、break_in_actualがnullの場合）
    const isOnBreak = !!(
      attendance &&
      attendance.break_out_actual &&
      !attendance.break_in_actual
    )

    const hasAttendance = !!attendance && attendance.status === 'open'
    console.log('getStaffStatusByPin: hasAttendance calculation:', {
      hasAttendance,
      attendanceExists: !!attendance,
      status: attendance?.status,
      isOnBreak,
    })

    // 後方互換性のため、StaffStatusインターフェースを使用（clinicIdはunitIdを返す）
    const status: StaffStatus = {
      staffId: employee.id,
      staffName: employee.name,
      clinicId: employee.unit_id, // 後方互換性のため、unit_idをclinicIdとして返す
      hasAttendance,
      isOnBreak,
      attendanceId: attendance?.id,
    }

    console.log('getStaffStatusByPin: Status:', JSON.stringify(status, null, 2))
    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error('getStaffStatusByPin: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : '状態の取得に失敗しました'
    console.error('getStaffStatusByPin: Error message:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('getStaffStatusByPin: Error stack:', error.stack)
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

/**
 * 出勤打刻
 */
export async function clockInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の勤怠レコードを確認
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (existingAttendance) {
      return {
        success: false,
        message: '既に出勤打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを作成
    const supabaseAdmin = getSupabaseAdmin()
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendances')
      .insert({
        unit_id: employee.unit_id,
        employee_id: employee.id,
        work_date: today,
        clock_in_actual: actualUtc.toISOString(),
        clock_in_effective: effectiveUtc.toISOString(),
        clock_in_source: 'tablet',
        status: 'open',
        work_minutes_effective: 0,
        has_manual_correction: false,
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      console.error('Error creating attendance:', attendanceError)
      return {
        success: false,
        message: '出勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: attendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'clock_in',
      after_clock_in_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '出勤打刻が完了しました',
      staffName: employee.name,
      clockType: 'in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '出勤打刻に失敗しました',
    }
  }
}

/**
 * 退勤打刻
 */
export async function clockOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤務時間を計算（分）
    const clockInEffective = new Date(existingAttendance.clock_in_effective!)
    const workMinutes = Math.floor((effectiveUtc.getTime() - clockInEffective.getTime()) / (1000 * 60))

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        clock_out_actual: actualUtc.toISOString(),
        clock_out_effective: effectiveUtc.toISOString(),
        clock_out_source: 'tablet',
        status: 'closed',
        work_minutes_effective: workMinutes,
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance:', updateError)
      return {
        success: false,
        message: '退勤打刻の記録に失敗しました',
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'clock_out',
      before_clock_out_effective: existingAttendance.clock_out_effective || null,
      after_clock_out_effective: effectiveUtc.toISOString(),
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '退勤打刻が完了しました',
      staffName: employee.name,
      clockType: 'out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Clock out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '退勤打刻に失敗しました',
    }
  }
}

/**
 * 外出打刻
 */
export async function breakOutByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 既に外出中かチェック
    if (existingAttendance.break_out_actual && !existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に外出中です',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_out_actual: actualUtc.toISOString(),
        break_out_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break out:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `外出打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '外出打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'break_out',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '外出打刻が完了しました',
      staffName: employee.name,
      clockType: 'break_out',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break out error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '外出打刻に失敗しました',
    }
  }
}

/**
 * 戻り打刻
 */
export async function breakInByPin(pin: string): Promise<ClockResult> {
  try {
    // PINで従業員を検証
    const employee = await verifyEmployeeByPin(pin)
    if (!employee) {
      return {
        success: false,
        message: 'PINが正しくありません',
      }
    }

    // unit設定を取得
    const unit = await getUnit(employee.unit_id)
    if (!unit) {
      return {
        success: false,
        message: '拠点設定の取得に失敗しました',
      }
    }

    // 当日の開いている勤怠レコードを取得
    const today = formatWorkDate(new Date(), unit.timezone)
    const existingAttendance = await getTodayAttendance(employee.unit_id, employee.id, today)

    if (!existingAttendance) {
      return {
        success: false,
        message: '出勤打刻が見つかりません',
      }
    }

    // 外出中かチェック
    if (!existingAttendance.break_out_actual) {
      return {
        success: false,
        message: '外出打刻が見つかりません',
      }
    }

    if (existingAttendance.break_in_actual) {
      return {
        success: false,
        message: '既に戻り打刻済みです',
      }
    }

    // 現在時刻を取得して丸める
    const { actualUtc, effectiveUtc, actualLocal, effectiveLocal } = getRoundedNow(
      unit.timezone,
      unit.rounding_unit,
      unit.rounding_mode
    )

    // 勤怠レコードを更新
    const supabaseAdmin = getSupabaseAdmin()
    const { error: updateError } = await supabaseAdmin
      .from('attendances')
      .update({
        break_in_actual: actualUtc.toISOString(),
        break_in_effective: effectiveUtc.toISOString(),
      })
      .eq('id', existingAttendance.id)

    if (updateError) {
      console.error('Error updating attendance for break in:', updateError)
      // 開発環境では詳細なエラーメッセージを表示
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `戻り打刻の記録に失敗しました: ${updateError.message || JSON.stringify(updateError)}`
        : '戻り打刻の記録に失敗しました。DBスキーマが正しく適用されているか確認してください。'
      return {
        success: false,
        message: errorMessage,
      }
    }

    // ログを記録
    const logInsert: AttendanceLogInsert = {
      attendance_id: existingAttendance.id,
      unit_id: employee.unit_id,
      employee_id: employee.id,
      log_type: 'break_in',
      triggered_by_admin_user_id: null, // タブレット打刻時はnull
    }

    const { error: logError } = await supabaseAdmin
      .from('attendance_logs')
      .insert(logInsert)

    if (logError) {
      console.error('Error creating attendance log:', logError)
      // ログのエラーは致命的ではないので続行
    }

    revalidatePath('/')
    return {
      success: true,
      message: '戻り打刻が完了しました',
      staffName: employee.name,
      clockType: 'break_in',
      actualTime: actualLocal,
      effectiveTime: effectiveLocal,
    }
  } catch (error) {
    console.error('Break in error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '戻り打刻に失敗しました',
    }
  }
}


```


型エラーを確認中です。



型エラーはありません。ROADMAPを更新中です。



ROADMAPを更新中です。


```markdown
# 実装ロードマップ

汎用勤怠管理SaaSシステムの実装計画と進捗管理用ドキュメントです。

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。そのため、organization を「絶対的な最上位」とは決めつけない設計にします。

### 主要概念

- **organization**: 1つの契約（プラン）を持つアカウント単位
  - 単拠点プラン → unit は 1件まで
  - 複数拠点プラン → unit を複数作成可能
  - 業種は固定しない（会社単位・事業単位のどちらでも運用可能）

- **unit**: 勤怠をまとめる実務上の単位
  - 例）店舗、クリニック、工場、支店、部署など
  - 組織内での集計・管理単位として扱う
  - 業種に依存した名前（clinic 等）は使わない

### Slug 方針

#### organization_slug
- **完全自動生成**
- **ランダム英字 20〜24 桁程度**（Supabase の org slug と同じノリ）
- 一度発行したら **変更不可（永続ID）**
- 人間が読めなくてよい（ユニーク性と安定性を最優先）

#### unit_slug
- **organization 内でユニーク** であればよい
- 管理者が **任意の文字列を入力**（英字・数字・ハイフン）
  - 例：`head-office`, `tenjin`, `shop-1` など
- URL に出ても問題ないが、SNSのような"見せる用"ではない前提

### ID と slug の関係

- すべての主要エンティティ（organization, unit, user, employee 等）は、**内部的には UUID などの主キー（id）で管理** する
- **slug はあくまで「外向きの識別子／URL用」** として扱う
- アプリ内部の参照・リレーションは **id 基本**、slug は補助的

### URL 構造

org・unit ともに **slug を URL に使う前提** で設計：

- 例：`/org/:org_slug/...`
- 拠点を絡めるなら：`/org/:org_slug/units/:unit_slug/...`

---

## 実装フェーズ

### Phase 1: プロジェクト基盤・DBスキーマ再設計 🔄

**目標**: 汎用システム向けにDBスキーマを再設計・移行

#### タスク

- [x] 新しいDBスキーマの設計
  - [x] `organizations` テーブルの作成
  - [x] `units` テーブルの作成
  - [x] `members` テーブルの作成（ユーザーとorganizationの中間概念）
  - [x] `employees` テーブルの作成（旧 `staffs` を汎用化）
  - [x] `attendances` テーブルの更新（カラム追加）
  - [x] `attendance_logs` テーブルの更新（カラム追加）
  - [x] 必要な ENUM 型の作成
  - [x] インデックスの作成
- [x] 既存データの移行スクリプト
  - [x] `clinics` → `organizations` + `units` への移行
  - [x] `staffs` → `employees` への移行
  - [x] `admins` → `members` への移行
  - [x] `attendances` / `attendance_logs` のデータ移行
- [x] TypeScript 型定義の更新
- [x] organization_slug 生成ロジックの実装

**依存関係**: なし

**完了条件**: 新しいDBスキーマが適用され、既存データが移行される

---

### Phase 2: 認証・基本設定の再実装 🔄

**目標**: organization/unit ベースの認証と設定機能の実装

#### タスク

- [x] Supabase Auth の設定確認
- [x] 認証・認可の実装
  - [x] `organization_slug` から `organization_id` への変換ロジック
  - [x] `unit_slug` から `unit_id` への変換ロジック
  - [x] ユーザーが所属する organization の取得
  - [x] ユーザーの role に基づくアクセス制御
- [x] セッション管理・認証ミドルウェアの更新
- [x] Server Actions の実装
  - [x] `app/actions/organization.ts` - organization の CRUD
  - [x] `app/actions/unit.ts` - unit の CRUD
  - [x] `app/actions/auth.ts` - organization ベースのログイン/ログアウト
- [x] ルーティング構造の実装
  - [ ] `/` - サービス紹介ページ（LP）（未実装、現在は打刻画面）
  - [x] `/org/:org_slug/login` - 管理者ログインページ
  - [x] `/org/:org_slug/dashboard` - ダッシュボード
  - [x] `/org/:org_slug/units` - 拠点一覧
  - [x] `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
  - [x] `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- [ ] organization 設定ページの実装
- [x] unit 設定ページの実装
  - [x] タイムゾーン、丸め単位、丸めモードの設定

**依存関係**: Phase 1

**完了条件**: 管理者がログインでき、organization/unit 設定を変更できる

---

### Phase 3: タブレット打刻機能（MVP） 📱

**目標**: PIN 認証による出勤/退勤打刻機能の実装

#### タスク

- [ ] `/org/:org_slug/units/:unit_slug/terminal` ページの実装
  - [ ] PIN 入力画面（数字キーパッド）
  - [ ] PIN マスク表示
  - [ ] 認証後の状態表示
- [ ] PIN ハッシュ化・検証ロジック
- [ ] 時刻丸めロジックの実装
  - [ ] `rounding_unit` / `rounding_mode` に基づく計算
  - [ ] タイムゾーン変換処理
- [ ] 出勤打刻機能（Server Action）
  - [ ] `clockInByPin` の実装
  - [ ] `clock_in_actual` / `clock_in_effective` の記録
  - [ ] `attendance_logs` への記録
- [ ] 退勤打刻機能（Server Action）
  - [ ] `clockOutByPin` の実装
  - [ ] `clock_out_actual` / `clock_out_effective` の記録
  - [ ] `work_minutes_effective` の計算・更新
  - [ ] `attendance_logs` への記録
- [ ] 打刻完了後の自動リセット（5-10秒）

**依存関係**: Phase 1, Phase 2

**完了条件**: PIN 入力で出勤/退勤打刻ができ、丸め後の時刻が正しく記録される

---

### Phase 4: 管理画面（基本機能） 📋

**目標**: 従業員管理と勤怠データの確認機能

#### 4.1 従業員管理

- [ ] `/org/:org_slug/units/:unit_slug/employees` ページの実装
  - [ ] 従業員一覧表示
  - [ ] 新規従業員作成フォーム
  - [ ] 従業員編集フォーム
  - [ ] PIN 再発行機能
  - [ ] アクティブ/非アクティブ切り替え
- [ ] Server Actions の実装
  - [ ] `getEmployees`
  - [ ] `createEmployee`
  - [ ] `updateEmployee`
  - [ ] `resetEmployeePin`

#### 4.2 ダッシュボード

- [ ] `/org/:org_slug/dashboard` ページの実装
  - [ ] 指定月のサマリー表示（全 unit 合計）
  - [ ] 総労働時間（organization 合計）
  - [ ] unit 別労働時間
  - [ ] 従業員別労働時間ランキング
  - [ ] 支給額概算
  - [ ] 今日の勤怠状況（出勤中従業員一覧）
- [ ] `/org/:org_slug/units/:unit_slug/dashboard` ページの実装
  - [ ] unit 単位のサマリー表示
- [ ] Server Action: `getDashboardSummary`

#### 4.3 勤怠一覧

- [ ] `/org/:org_slug/units/:unit_slug/attendances` ページの実装
  - [ ] フィルター機能（日付・月・従業員）
  - [ ] 勤怠データ一覧表示
  - [ ] 実打刻/丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
- [ ] Server Action: `getAttendances`

#### 4.4 勤怠詳細・修正

- [ ] `/org/:org_slug/units/:unit_slug/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 手修正フォーム（出勤/退勤時刻）
- [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

#### 4.5 拠点管理

- [ ] `/org/:org_slug/units` ページの実装
  - [ ] 拠点一覧表示
  - [ ] 新規拠点作成フォーム（unit_slug 入力含む）
  - [ ] 拠点編集フォーム
  - [ ] 拠点削除機能（プラン制限チェック含む）
- [ ] Server Actions の実装
  - [ ] `getUnits`
  - [ ] `createUnit`
  - [ ] `updateUnit`
  - [ ] `deleteUnit`

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: 従業員の追加・編集ができ、勤怠データの確認・修正ができる

---

### Phase 5: レポート・出力機能 📊

**目標**: CSV/PDF レポート出力機能の実装

#### タスク

- [ ] `/org/:org_slug/units/:unit_slug/reports` ページの実装
  - [ ] 期間選択（月単位 or 日付範囲）
  - [ ] 従業員選択（複数選択可）
  - [ ] 出力形式選択（CSV / PDF）
- [ ] CSV 出力機能
  - [ ] Server Action: `exportAttendancesCsv`
  - [ ] `attendances` JOIN `employees` のデータ取得
  - [ ] CSV フォーマット変換
  - [ ] ダウンロード処理
- [ ] PDF 出力機能
  - [ ] PDF 生成ライブラリの選定・導入（例: puppeteer, jsPDF）
  - [ ] Server Action: `generateReportPdf`
  - [ ] HTML テンプレートの作成
  - [ ] PDF レイアウトの実装
  - [ ] ダウンロード処理
- [ ] organization 単位のレポート機能（全 unit 合計）

**依存関係**: Phase 4

**完了条件**: 指定期間・従業員の勤怠データを CSV/PDF で出力できる

---

### Phase 6: 拡張機能・最適化 🚀

**目標**: UI/UX の改善とパフォーマンス最適化

#### タスク

- [ ] RLS（Row Level Security）の設定・最適化
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善
- [ ] レスポンシブデザインの調整
- [ ] アクセシビリティの向上
- [ ] テストの追加（オプション）
- [ ] パフォーマンス最適化
- [ ] organization_slug 生成ロジックの実装
  - [ ] ランダム英字20-24桁の生成
  - [ ] ユニークチェック
  - [ ] 永続性の保証

**依存関係**: Phase 1-5

**完了条件**: システムが安定して動作し、ユーザビリティが向上している

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応
* enterprise 階層の追加（3階層への拡張）
* プラン管理・課金機能
* 複数 organization への所属管理UI

---

## 進捗管理

### 現在のフェーズ

**Phase 2: 認証・基本設定の再実装** - 進行中（バックエンド完了、フロントエンド実装中）

### 完了済みタスク

- Phase 1（旧）: プロジェクト基盤・DBスキーマ（2025-11-27）
  - Next.js プロジェクトの初期化（TypeScript, Tailwind CSS）
  - Supabase クライアントのセットアップ
  - DB スキーマ SQL ファイルの作成（旧設計）
  - TypeScript 型定義の作成（旧設計）

- Phase 2（旧）: 認証・基本設定（2025-11-27）
  - Supabase Auth の設定とログイン機能
  - `/admin/login` ページの実装
  - 認証ミドルウェアの実装
  - `/admin/settings` ページの実装
  - クリニック設定の取得・更新機能

> **注意**: 旧設計（clinic/staff ベース）から新設計（organization/unit ベース）への移行が必要です。

### 次のマイルストーン

1. Phase 1 の完了（DBスキーマ再設計・移行）
2. Phase 2 の完了（認証・基本設定の再実装）
3. Phase 3 の完了（MVP: 打刻機能）
4. Phase 4 の完了（管理画面基本機能）
5. Phase 5 の完了（レポート出力）

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する
* 旧設計から新設計への移行時は、既存データの整合性に注意する

---

最終更新: 2025-12-02（Phase 1完了、Phase 2進行中）

```

```markdown
# 実装ロードマップ

汎用勤怠管理SaaSシステムの実装計画と進捗管理用ドキュメントです。

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。そのため、organization を「絶対的な最上位」とは決めつけない設計にします。

### 主要概念

- **organization**: 1つの契約（プラン）を持つアカウント単位
  - 単拠点プラン → unit は 1件まで
  - 複数拠点プラン → unit を複数作成可能
  - 業種は固定しない（会社単位・事業単位のどちらでも運用可能）

- **unit**: 勤怠をまとめる実務上の単位
  - 例）店舗、クリニック、工場、支店、部署など
  - 組織内での集計・管理単位として扱う
  - 業種に依存した名前（clinic 等）は使わない

### Slug 方針

#### organization_slug
- **完全自動生成**
- **ランダム英字 20〜24 桁程度**（Supabase の org slug と同じノリ）
- 一度発行したら **変更不可（永続ID）**
- 人間が読めなくてよい（ユニーク性と安定性を最優先）

#### unit_slug
- **organization 内でユニーク** であればよい
- 管理者が **任意の文字列を入力**（英字・数字・ハイフン）
  - 例：`head-office`, `tenjin`, `shop-1` など
- URL に出ても問題ないが、SNSのような"見せる用"ではない前提

### ID と slug の関係

- すべての主要エンティティ（organization, unit, user, employee 等）は、**内部的には UUID などの主キー（id）で管理** する
- **slug はあくまで「外向きの識別子／URL用」** として扱う
- アプリ内部の参照・リレーションは **id 基本**、slug は補助的

### URL 構造

org・unit ともに **slug を URL に使う前提** で設計：

- 例：`/org/:org_slug/...`
- 拠点を絡めるなら：`/org/:org_slug/units/:unit_slug/...`

---

## 実装フェーズ

### Phase 1: プロジェクト基盤・DBスキーマ再設計 🔄

**目標**: 汎用システム向けにDBスキーマを再設計・移行

#### タスク

- [x] 新しいDBスキーマの設計
  - [x] `organizations` テーブルの作成
  - [x] `units` テーブルの作成
  - [x] `members` テーブルの作成（ユーザーとorganizationの中間概念）
  - [x] `employees` テーブルの作成（旧 `staffs` を汎用化）
  - [x] `attendances` テーブルの更新（カラム追加）
  - [x] `attendance_logs` テーブルの更新（カラム追加）
  - [x] 必要な ENUM 型の作成
  - [x] インデックスの作成
- [x] 既存データの移行スクリプト
  - [x] `clinics` → `organizations` + `units` への移行
  - [x] `staffs` → `employees` への移行
  - [x] `admins` → `members` への移行
  - [x] `attendances` / `attendance_logs` のデータ移行
- [x] TypeScript 型定義の更新
- [x] organization_slug 生成ロジックの実装

**依存関係**: なし

**完了条件**: 新しいDBスキーマが適用され、既存データが移行される

---

### Phase 2: 認証・基本設定の再実装 🔄

**目標**: organization/unit ベースの認証と設定機能の実装

#### タスク

- [x] Supabase Auth の設定確認
- [x] 認証・認可の実装
  - [x] `organization_slug` から `organization_id` への変換ロジック
  - [x] `unit_slug` から `unit_id` への変換ロジック
  - [x] ユーザーが所属する organization の取得
  - [x] ユーザーの role に基づくアクセス制御
- [x] セッション管理・認証ミドルウェアの更新
- [x] Server Actions の実装
  - [x] `app/actions/organization.ts` - organization の CRUD
  - [x] `app/actions/unit.ts` - unit の CRUD
  - [x] `app/actions/auth.ts` - organization ベースのログイン/ログアウト
- [x] ルーティング構造の実装
  - [ ] `/` - サービス紹介ページ（LP）（未実装、現在は打刻画面）
  - [x] `/org/:org_slug/login` - 管理者ログインページ
  - [x] `/org/:org_slug/dashboard` - ダッシュボード
  - [x] `/org/:org_slug/units` - 拠点一覧
  - [x] `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
  - [x] `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- [ ] organization 設定ページの実装
- [x] unit 設定ページの実装
  - [x] タイムゾーン、丸め単位、丸めモードの設定

**依存関係**: Phase 1

**完了条件**: 管理者がログインでき、organization/unit 設定を変更できる

---

### Phase 3: タブレット打刻機能（MVP） 📱

**目標**: PIN 認証による出勤/退勤打刻機能の実装

#### タスク

- [x] `/org/:org_slug/units/:unit_slug/terminal` ページの実装
  - [x] PIN 入力画面（数字キーパッド）
  - [x] PIN マスク表示
  - [x] 認証後の状態表示
- [x] PIN ハッシュ化・検証ロジック
- [x] 時刻丸めロジックの実装
  - [x] `rounding_unit` / `rounding_mode` に基づく計算
  - [x] タイムゾーン変換処理
- [x] 出勤打刻機能（Server Action）
  - [x] `clockInByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_in_actual` / `clock_in_effective` の記録
  - [x] `attendance_logs` への記録
- [x] 退勤打刻機能（Server Action）
  - [x] `clockOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_out_actual` / `clock_out_effective` の記録
  - [x] `work_minutes_effective` の計算・更新
  - [x] `attendance_logs` への記録
- [x] 外出・戻り打刻機能（Server Action）
  - [x] `breakOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `breakInByPin` の実装（unit_id/employee_id対応済み）
- [x] 打刻完了後の自動リセット（リンクボタンでのみ戻る）

**依存関係**: Phase 1, Phase 2

**完了条件**: PIN 入力で出勤/退勤打刻ができ、丸め後の時刻が正しく記録される

---

### Phase 4: 管理画面（基本機能） 📋

**目標**: 従業員管理と勤怠データの確認機能

#### 4.1 従業員管理

- [ ] `/org/:org_slug/units/:unit_slug/employees` ページの実装
  - [ ] 従業員一覧表示
  - [ ] 新規従業員作成フォーム
  - [ ] 従業員編集フォーム
  - [ ] PIN 再発行機能
  - [ ] アクティブ/非アクティブ切り替え
- [ ] Server Actions の実装
  - [ ] `getEmployees`
  - [ ] `createEmployee`
  - [ ] `updateEmployee`
  - [ ] `resetEmployeePin`

#### 4.2 ダッシュボード

- [ ] `/org/:org_slug/dashboard` ページの実装
  - [ ] 指定月のサマリー表示（全 unit 合計）
  - [ ] 総労働時間（organization 合計）
  - [ ] unit 別労働時間
  - [ ] 従業員別労働時間ランキング
  - [ ] 支給額概算
  - [ ] 今日の勤怠状況（出勤中従業員一覧）
- [ ] `/org/:org_slug/units/:unit_slug/dashboard` ページの実装
  - [ ] unit 単位のサマリー表示
- [ ] Server Action: `getDashboardSummary`

#### 4.3 勤怠一覧

- [ ] `/org/:org_slug/units/:unit_slug/attendances` ページの実装
  - [ ] フィルター機能（日付・月・従業員）
  - [ ] 勤怠データ一覧表示
  - [ ] 実打刻/丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
- [ ] Server Action: `getAttendances`

#### 4.4 勤怠詳細・修正

- [ ] `/org/:org_slug/units/:unit_slug/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 手修正フォーム（出勤/退勤時刻）
- [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

#### 4.5 拠点管理

- [ ] `/org/:org_slug/units` ページの実装
  - [ ] 拠点一覧表示
  - [ ] 新規拠点作成フォーム（unit_slug 入力含む）
  - [ ] 拠点編集フォーム
  - [ ] 拠点削除機能（プラン制限チェック含む）
- [ ] Server Actions の実装
  - [ ] `getUnits`
  - [ ] `createUnit`
  - [ ] `updateUnit`
  - [ ] `deleteUnit`

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: 従業員の追加・編集ができ、勤怠データの確認・修正ができる

---

### Phase 5: レポート・出力機能 📊

**目標**: CSV/PDF レポート出力機能の実装

#### タスク

- [ ] `/org/:org_slug/units/:unit_slug/reports` ページの実装
  - [ ] 期間選択（月単位 or 日付範囲）
  - [ ] 従業員選択（複数選択可）
  - [ ] 出力形式選択（CSV / PDF）
- [ ] CSV 出力機能
  - [ ] Server Action: `exportAttendancesCsv`
  - [ ] `attendances` JOIN `employees` のデータ取得
  - [ ] CSV フォーマット変換
  - [ ] ダウンロード処理
- [ ] PDF 出力機能
  - [ ] PDF 生成ライブラリの選定・導入（例: puppeteer, jsPDF）
  - [ ] Server Action: `generateReportPdf`
  - [ ] HTML テンプレートの作成
  - [ ] PDF レイアウトの実装
  - [ ] ダウンロード処理
- [ ] organization 単位のレポート機能（全 unit 合計）

**依存関係**: Phase 4

**完了条件**: 指定期間・従業員の勤怠データを CSV/PDF で出力できる

---

### Phase 6: 拡張機能・最適化 🚀

**目標**: UI/UX の改善とパフォーマンス最適化

#### タスク

- [ ] RLS（Row Level Security）の設定・最適化
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善
- [ ] レスポンシブデザインの調整
- [ ] アクセシビリティの向上
- [ ] テストの追加（オプション）
- [ ] パフォーマンス最適化
- [ ] organization_slug 生成ロジックの実装
  - [ ] ランダム英字20-24桁の生成
  - [ ] ユニークチェック
  - [ ] 永続性の保証

**依存関係**: Phase 1-5

**完了条件**: システムが安定して動作し、ユーザビリティが向上している

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応
* enterprise 階層の追加（3階層への拡張）
* プラン管理・課金機能
* 複数 organization への所属管理UI

---

## 進捗管理

### 現在のフェーズ

**Phase 2: 認証・基本設定の再実装** - 進行中（バックエンド完了、フロントエンド実装中）

### 完了済みタスク

- Phase 1（旧）: プロジェクト基盤・DBスキーマ（2025-11-27）
  - Next.js プロジェクトの初期化（TypeScript, Tailwind CSS）
  - Supabase クライアントのセットアップ
  - DB スキーマ SQL ファイルの作成（旧設計）
  - TypeScript 型定義の作成（旧設計）

- Phase 2（旧）: 認証・基本設定（2025-11-27）
  - Supabase Auth の設定とログイン機能
  - `/admin/login` ページの実装
  - 認証ミドルウェアの実装
  - `/admin/settings` ページの実装
  - クリニック設定の取得・更新機能

> **注意**: 旧設計（clinic/staff ベース）から新設計（organization/unit ベース）への移行が必要です。

### 次のマイルストーン

1. Phase 1 の完了（DBスキーマ再設計・移行）
2. Phase 2 の完了（認証・基本設定の再実装）
3. Phase 3 の完了（MVP: 打刻機能）
4. Phase 4 の完了（管理画面基本機能）
5. Phase 5 の完了（レポート出力）

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する
* 旧設計から新設計への移行時は、既存データの整合性に注意する

---

最終更新: 2025-12-02（Phase 1完了、Phase 2進行中）

```


ROADMAPの進捗管理セクションを更新中です。



進捗管理セクションを更新中です。


```markdown
# 実装ロードマップ

汎用勤怠管理SaaSシステムの実装計画と進捗管理用ドキュメントです。

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。そのため、organization を「絶対的な最上位」とは決めつけない設計にします。

### 主要概念

- **organization**: 1つの契約（プラン）を持つアカウント単位
  - 単拠点プラン → unit は 1件まで
  - 複数拠点プラン → unit を複数作成可能
  - 業種は固定しない（会社単位・事業単位のどちらでも運用可能）

- **unit**: 勤怠をまとめる実務上の単位
  - 例）店舗、クリニック、工場、支店、部署など
  - 組織内での集計・管理単位として扱う
  - 業種に依存した名前（clinic 等）は使わない

### Slug 方針

#### organization_slug
- **完全自動生成**
- **ランダム英字 20〜24 桁程度**（Supabase の org slug と同じノリ）
- 一度発行したら **変更不可（永続ID）**
- 人間が読めなくてよい（ユニーク性と安定性を最優先）

#### unit_slug
- **organization 内でユニーク** であればよい
- 管理者が **任意の文字列を入力**（英字・数字・ハイフン）
  - 例：`head-office`, `tenjin`, `shop-1` など
- URL に出ても問題ないが、SNSのような"見せる用"ではない前提

### ID と slug の関係

- すべての主要エンティティ（organization, unit, user, employee 等）は、**内部的には UUID などの主キー（id）で管理** する
- **slug はあくまで「外向きの識別子／URL用」** として扱う
- アプリ内部の参照・リレーションは **id 基本**、slug は補助的

### URL 構造

org・unit ともに **slug を URL に使う前提** で設計：

- 例：`/org/:org_slug/...`
- 拠点を絡めるなら：`/org/:org_slug/units/:unit_slug/...`

---

## 実装フェーズ

### Phase 1: プロジェクト基盤・DBスキーマ再設計 🔄

**目標**: 汎用システム向けにDBスキーマを再設計・移行

#### タスク

- [x] 新しいDBスキーマの設計
  - [x] `organizations` テーブルの作成
  - [x] `units` テーブルの作成
  - [x] `members` テーブルの作成（ユーザーとorganizationの中間概念）
  - [x] `employees` テーブルの作成（旧 `staffs` を汎用化）
  - [x] `attendances` テーブルの更新（カラム追加）
  - [x] `attendance_logs` テーブルの更新（カラム追加）
  - [x] 必要な ENUM 型の作成
  - [x] インデックスの作成
- [x] 既存データの移行スクリプト
  - [x] `clinics` → `organizations` + `units` への移行
  - [x] `staffs` → `employees` への移行
  - [x] `admins` → `members` への移行
  - [x] `attendances` / `attendance_logs` のデータ移行
- [x] TypeScript 型定義の更新
- [x] organization_slug 生成ロジックの実装

**依存関係**: なし

**完了条件**: 新しいDBスキーマが適用され、既存データが移行される

---

### Phase 2: 認証・基本設定の再実装 🔄

**目標**: organization/unit ベースの認証と設定機能の実装

#### タスク

- [x] Supabase Auth の設定確認
- [x] 認証・認可の実装
  - [x] `organization_slug` から `organization_id` への変換ロジック
  - [x] `unit_slug` から `unit_id` への変換ロジック
  - [x] ユーザーが所属する organization の取得
  - [x] ユーザーの role に基づくアクセス制御
- [x] セッション管理・認証ミドルウェアの更新
- [x] Server Actions の実装
  - [x] `app/actions/organization.ts` - organization の CRUD
  - [x] `app/actions/unit.ts` - unit の CRUD
  - [x] `app/actions/auth.ts` - organization ベースのログイン/ログアウト
- [x] ルーティング構造の実装
  - [ ] `/` - サービス紹介ページ（LP）（未実装、現在は打刻画面）
  - [x] `/org/:org_slug/login` - 管理者ログインページ
  - [x] `/org/:org_slug/dashboard` - ダッシュボード
  - [x] `/org/:org_slug/units` - 拠点一覧
  - [x] `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
  - [x] `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- [ ] organization 設定ページの実装
- [x] unit 設定ページの実装
  - [x] タイムゾーン、丸め単位、丸めモードの設定

**依存関係**: Phase 1

**完了条件**: 管理者がログインでき、organization/unit 設定を変更できる

---

### Phase 3: タブレット打刻機能（MVP） 📱

**目標**: PIN 認証による出勤/退勤打刻機能の実装

#### タスク

- [x] `/org/:org_slug/units/:unit_slug/terminal` ページの実装
  - [x] PIN 入力画面（数字キーパッド）
  - [x] PIN マスク表示
  - [x] 認証後の状態表示
- [x] PIN ハッシュ化・検証ロジック
- [x] 時刻丸めロジックの実装
  - [x] `rounding_unit` / `rounding_mode` に基づく計算
  - [x] タイムゾーン変換処理
- [x] 出勤打刻機能（Server Action）
  - [x] `clockInByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_in_actual` / `clock_in_effective` の記録
  - [x] `attendance_logs` への記録
- [x] 退勤打刻機能（Server Action）
  - [x] `clockOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_out_actual` / `clock_out_effective` の記録
  - [x] `work_minutes_effective` の計算・更新
  - [x] `attendance_logs` への記録
- [x] 外出・戻り打刻機能（Server Action）
  - [x] `breakOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `breakInByPin` の実装（unit_id/employee_id対応済み）
- [x] 打刻完了後の自動リセット（リンクボタンでのみ戻る）

**依存関係**: Phase 1, Phase 2

**完了条件**: PIN 入力で出勤/退勤打刻ができ、丸め後の時刻が正しく記録される

---

### Phase 4: 管理画面（基本機能） 📋

**目標**: 従業員管理と勤怠データの確認機能

#### 4.1 従業員管理

- [ ] `/org/:org_slug/units/:unit_slug/employees` ページの実装
  - [ ] 従業員一覧表示
  - [ ] 新規従業員作成フォーム
  - [ ] 従業員編集フォーム
  - [ ] PIN 再発行機能
  - [ ] アクティブ/非アクティブ切り替え
- [ ] Server Actions の実装
  - [ ] `getEmployees`
  - [ ] `createEmployee`
  - [ ] `updateEmployee`
  - [ ] `resetEmployeePin`

#### 4.2 ダッシュボード

- [ ] `/org/:org_slug/dashboard` ページの実装
  - [ ] 指定月のサマリー表示（全 unit 合計）
  - [ ] 総労働時間（organization 合計）
  - [ ] unit 別労働時間
  - [ ] 従業員別労働時間ランキング
  - [ ] 支給額概算
  - [ ] 今日の勤怠状況（出勤中従業員一覧）
- [ ] `/org/:org_slug/units/:unit_slug/dashboard` ページの実装
  - [ ] unit 単位のサマリー表示
- [ ] Server Action: `getDashboardSummary`

#### 4.3 勤怠一覧

- [ ] `/org/:org_slug/units/:unit_slug/attendances` ページの実装
  - [ ] フィルター機能（日付・月・従業員）
  - [ ] 勤怠データ一覧表示
  - [ ] 実打刻/丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
- [ ] Server Action: `getAttendances`

#### 4.4 勤怠詳細・修正

- [ ] `/org/:org_slug/units/:unit_slug/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 手修正フォーム（出勤/退勤時刻）
- [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

#### 4.5 拠点管理

- [ ] `/org/:org_slug/units` ページの実装
  - [ ] 拠点一覧表示
  - [ ] 新規拠点作成フォーム（unit_slug 入力含む）
  - [ ] 拠点編集フォーム
  - [ ] 拠点削除機能（プラン制限チェック含む）
- [ ] Server Actions の実装
  - [ ] `getUnits`
  - [ ] `createUnit`
  - [ ] `updateUnit`
  - [ ] `deleteUnit`

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: 従業員の追加・編集ができ、勤怠データの確認・修正ができる

---

### Phase 5: レポート・出力機能 📊

**目標**: CSV/PDF レポート出力機能の実装

#### タスク

- [ ] `/org/:org_slug/units/:unit_slug/reports` ページの実装
  - [ ] 期間選択（月単位 or 日付範囲）
  - [ ] 従業員選択（複数選択可）
  - [ ] 出力形式選択（CSV / PDF）
- [ ] CSV 出力機能
  - [ ] Server Action: `exportAttendancesCsv`
  - [ ] `attendances` JOIN `employees` のデータ取得
  - [ ] CSV フォーマット変換
  - [ ] ダウンロード処理
- [ ] PDF 出力機能
  - [ ] PDF 生成ライブラリの選定・導入（例: puppeteer, jsPDF）
  - [ ] Server Action: `generateReportPdf`
  - [ ] HTML テンプレートの作成
  - [ ] PDF レイアウトの実装
  - [ ] ダウンロード処理
- [ ] organization 単位のレポート機能（全 unit 合計）

**依存関係**: Phase 4

**完了条件**: 指定期間・従業員の勤怠データを CSV/PDF で出力できる

---

### Phase 6: 拡張機能・最適化 🚀

**目標**: UI/UX の改善とパフォーマンス最適化

#### タスク

- [ ] RLS（Row Level Security）の設定・最適化
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善
- [ ] レスポンシブデザインの調整
- [ ] アクセシビリティの向上
- [ ] テストの追加（オプション）
- [ ] パフォーマンス最適化
- [ ] organization_slug 生成ロジックの実装
  - [ ] ランダム英字20-24桁の生成
  - [ ] ユニークチェック
  - [ ] 永続性の保証

**依存関係**: Phase 1-5

**完了条件**: システムが安定して動作し、ユーザビリティが向上している

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応
* enterprise 階層の追加（3階層への拡張）
* プラン管理・課金機能
* 複数 organization への所属管理UI

---

## 進捗管理

### 現在のフェーズ

**Phase 2: 認証・基本設定の再実装** - ほぼ完了（ルーティング構造・unit設定ページ実装完了）
**Phase 3: タブレット打刻機能（MVP）** - バックエンド対応完了（unit_id/employee_id対応済み）

### 完了済みタスク

- Phase 1（旧）: プロジェクト基盤・DBスキーマ（2025-11-27）
  - Next.js プロジェクトの初期化（TypeScript, Tailwind CSS）
  - Supabase クライアントのセットアップ
  - DB スキーマ SQL ファイルの作成（旧設計）
  - TypeScript 型定義の作成（旧設計）

- Phase 2（旧）: 認証・基本設定（2025-11-27）
  - Supabase Auth の設定とログイン機能
  - `/admin/login` ページの実装
  - 認証ミドルウェアの実装
  - `/admin/settings` ページの実装
  - クリニック設定の取得・更新機能

> **注意**: 旧設計（clinic/staff ベース）から新設計（organization/unit ベース）への移行が必要です。

### 次のマイルストーン

1. Phase 1 の完了（DBスキーマ再設計・移行）
2. Phase 2 の完了（認証・基本設定の再実装）
3. Phase 3 の完了（MVP: 打刻機能）
4. Phase 4 の完了（管理画面基本機能）
5. Phase 5 の完了（レポート出力）

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する
* 旧設計から新設計への移行時は、既存データの整合性に注意する

---

最終更新: 2025-12-02（Phase 1完了、Phase 2進行中）

```

```markdown
# 実装ロードマップ

汎用勤怠管理SaaSシステムの実装計画と進捗管理用ドキュメントです。

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。そのため、organization を「絶対的な最上位」とは決めつけない設計にします。

### 主要概念

- **organization**: 1つの契約（プラン）を持つアカウント単位
  - 単拠点プラン → unit は 1件まで
  - 複数拠点プラン → unit を複数作成可能
  - 業種は固定しない（会社単位・事業単位のどちらでも運用可能）

- **unit**: 勤怠をまとめる実務上の単位
  - 例）店舗、クリニック、工場、支店、部署など
  - 組織内での集計・管理単位として扱う
  - 業種に依存した名前（clinic 等）は使わない

### Slug 方針

#### organization_slug
- **完全自動生成**
- **ランダム英字 20〜24 桁程度**（Supabase の org slug と同じノリ）
- 一度発行したら **変更不可（永続ID）**
- 人間が読めなくてよい（ユニーク性と安定性を最優先）

#### unit_slug
- **organization 内でユニーク** であればよい
- 管理者が **任意の文字列を入力**（英字・数字・ハイフン）
  - 例：`head-office`, `tenjin`, `shop-1` など
- URL に出ても問題ないが、SNSのような"見せる用"ではない前提

### ID と slug の関係

- すべての主要エンティティ（organization, unit, user, employee 等）は、**内部的には UUID などの主キー（id）で管理** する
- **slug はあくまで「外向きの識別子／URL用」** として扱う
- アプリ内部の参照・リレーションは **id 基本**、slug は補助的

### URL 構造

org・unit ともに **slug を URL に使う前提** で設計：

- 例：`/org/:org_slug/...`
- 拠点を絡めるなら：`/org/:org_slug/units/:unit_slug/...`

---

## 実装フェーズ

### Phase 1: プロジェクト基盤・DBスキーマ再設計 🔄

**目標**: 汎用システム向けにDBスキーマを再設計・移行

#### タスク

- [x] 新しいDBスキーマの設計
  - [x] `organizations` テーブルの作成
  - [x] `units` テーブルの作成
  - [x] `members` テーブルの作成（ユーザーとorganizationの中間概念）
  - [x] `employees` テーブルの作成（旧 `staffs` を汎用化）
  - [x] `attendances` テーブルの更新（カラム追加）
  - [x] `attendance_logs` テーブルの更新（カラム追加）
  - [x] 必要な ENUM 型の作成
  - [x] インデックスの作成
- [x] 既存データの移行スクリプト
  - [x] `clinics` → `organizations` + `units` への移行
  - [x] `staffs` → `employees` への移行
  - [x] `admins` → `members` への移行
  - [x] `attendances` / `attendance_logs` のデータ移行
- [x] TypeScript 型定義の更新
- [x] organization_slug 生成ロジックの実装

**依存関係**: なし

**完了条件**: 新しいDBスキーマが適用され、既存データが移行される

---

### Phase 2: 認証・基本設定の再実装 🔄

**目標**: organization/unit ベースの認証と設定機能の実装

#### タスク

- [x] Supabase Auth の設定確認
- [x] 認証・認可の実装
  - [x] `organization_slug` から `organization_id` への変換ロジック
  - [x] `unit_slug` から `unit_id` への変換ロジック
  - [x] ユーザーが所属する organization の取得
  - [x] ユーザーの role に基づくアクセス制御
- [x] セッション管理・認証ミドルウェアの更新
- [x] Server Actions の実装
  - [x] `app/actions/organization.ts` - organization の CRUD
  - [x] `app/actions/unit.ts` - unit の CRUD
  - [x] `app/actions/auth.ts` - organization ベースのログイン/ログアウト
- [x] ルーティング構造の実装
  - [ ] `/` - サービス紹介ページ（LP）（未実装、現在は打刻画面）
  - [x] `/org/:org_slug/login` - 管理者ログインページ
  - [x] `/org/:org_slug/dashboard` - ダッシュボード
  - [x] `/org/:org_slug/units` - 拠点一覧
  - [x] `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
  - [x] `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- [ ] organization 設定ページの実装
- [x] unit 設定ページの実装
  - [x] タイムゾーン、丸め単位、丸めモードの設定

**依存関係**: Phase 1

**完了条件**: 管理者がログインでき、organization/unit 設定を変更できる

---

### Phase 3: タブレット打刻機能（MVP） 📱

**目標**: PIN 認証による出勤/退勤打刻機能の実装

#### タスク

- [x] `/org/:org_slug/units/:unit_slug/terminal` ページの実装
  - [x] PIN 入力画面（数字キーパッド）
  - [x] PIN マスク表示
  - [x] 認証後の状態表示
- [x] PIN ハッシュ化・検証ロジック
- [x] 時刻丸めロジックの実装
  - [x] `rounding_unit` / `rounding_mode` に基づく計算
  - [x] タイムゾーン変換処理
- [x] 出勤打刻機能（Server Action）
  - [x] `clockInByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_in_actual` / `clock_in_effective` の記録
  - [x] `attendance_logs` への記録
- [x] 退勤打刻機能（Server Action）
  - [x] `clockOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_out_actual` / `clock_out_effective` の記録
  - [x] `work_minutes_effective` の計算・更新
  - [x] `attendance_logs` への記録
- [x] 外出・戻り打刻機能（Server Action）
  - [x] `breakOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `breakInByPin` の実装（unit_id/employee_id対応済み）
- [x] 打刻完了後の自動リセット（リンクボタンでのみ戻る）

**依存関係**: Phase 1, Phase 2

**完了条件**: PIN 入力で出勤/退勤打刻ができ、丸め後の時刻が正しく記録される

---

### Phase 4: 管理画面（基本機能） 📋

**目標**: 従業員管理と勤怠データの確認機能

#### 4.1 従業員管理

- [ ] `/org/:org_slug/units/:unit_slug/employees` ページの実装
  - [ ] 従業員一覧表示
  - [ ] 新規従業員作成フォーム
  - [ ] 従業員編集フォーム
  - [ ] PIN 再発行機能
  - [ ] アクティブ/非アクティブ切り替え
- [ ] Server Actions の実装
  - [ ] `getEmployees`
  - [ ] `createEmployee`
  - [ ] `updateEmployee`
  - [ ] `resetEmployeePin`

#### 4.2 ダッシュボード

- [ ] `/org/:org_slug/dashboard` ページの実装
  - [ ] 指定月のサマリー表示（全 unit 合計）
  - [ ] 総労働時間（organization 合計）
  - [ ] unit 別労働時間
  - [ ] 従業員別労働時間ランキング
  - [ ] 支給額概算
  - [ ] 今日の勤怠状況（出勤中従業員一覧）
- [ ] `/org/:org_slug/units/:unit_slug/dashboard` ページの実装
  - [ ] unit 単位のサマリー表示
- [ ] Server Action: `getDashboardSummary`

#### 4.3 勤怠一覧

- [ ] `/org/:org_slug/units/:unit_slug/attendances` ページの実装
  - [ ] フィルター機能（日付・月・従業員）
  - [ ] 勤怠データ一覧表示
  - [ ] 実打刻/丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
- [ ] Server Action: `getAttendances`

#### 4.4 勤怠詳細・修正

- [ ] `/org/:org_slug/units/:unit_slug/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 手修正フォーム（出勤/退勤時刻）
- [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

#### 4.5 拠点管理

- [ ] `/org/:org_slug/units` ページの実装
  - [ ] 拠点一覧表示
  - [ ] 新規拠点作成フォーム（unit_slug 入力含む）
  - [ ] 拠点編集フォーム
  - [ ] 拠点削除機能（プラン制限チェック含む）
- [ ] Server Actions の実装
  - [ ] `getUnits`
  - [ ] `createUnit`
  - [ ] `updateUnit`
  - [ ] `deleteUnit`

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: 従業員の追加・編集ができ、勤怠データの確認・修正ができる

---

### Phase 5: レポート・出力機能 📊

**目標**: CSV/PDF レポート出力機能の実装

#### タスク

- [ ] `/org/:org_slug/units/:unit_slug/reports` ページの実装
  - [ ] 期間選択（月単位 or 日付範囲）
  - [ ] 従業員選択（複数選択可）
  - [ ] 出力形式選択（CSV / PDF）
- [ ] CSV 出力機能
  - [ ] Server Action: `exportAttendancesCsv`
  - [ ] `attendances` JOIN `employees` のデータ取得
  - [ ] CSV フォーマット変換
  - [ ] ダウンロード処理
- [ ] PDF 出力機能
  - [ ] PDF 生成ライブラリの選定・導入（例: puppeteer, jsPDF）
  - [ ] Server Action: `generateReportPdf`
  - [ ] HTML テンプレートの作成
  - [ ] PDF レイアウトの実装
  - [ ] ダウンロード処理
- [ ] organization 単位のレポート機能（全 unit 合計）

**依存関係**: Phase 4

**完了条件**: 指定期間・従業員の勤怠データを CSV/PDF で出力できる

---

### Phase 6: 拡張機能・最適化 🚀

**目標**: UI/UX の改善とパフォーマンス最適化

#### タスク

- [ ] RLS（Row Level Security）の設定・最適化
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善
- [ ] レスポンシブデザインの調整
- [ ] アクセシビリティの向上
- [ ] テストの追加（オプション）
- [ ] パフォーマンス最適化
- [ ] organization_slug 生成ロジックの実装
  - [ ] ランダム英字20-24桁の生成
  - [ ] ユニークチェック
  - [ ] 永続性の保証

**依存関係**: Phase 1-5

**完了条件**: システムが安定して動作し、ユーザビリティが向上している

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応
* enterprise 階層の追加（3階層への拡張）
* プラン管理・課金機能
* 複数 organization への所属管理UI

---

## 進捗管理

### 現在のフェーズ

**Phase 2: 認証・基本設定の再実装** - ほぼ完了（ルーティング構造・unit設定ページ実装完了）
**Phase 3: タブレット打刻機能（MVP）** - バックエンド対応完了（unit_id/employee_id対応済み）

### 完了済みタスク

- Phase 1（旧）: プロジェクト基盤・DBスキーマ（2025-11-27）
  - Next.js プロジェクトの初期化（TypeScript, Tailwind CSS）
  - Supabase クライアントのセットアップ
  - DB スキーマ SQL ファイルの作成（旧設計）
  - TypeScript 型定義の作成（旧設計）

- Phase 2（旧）: 認証・基本設定（2025-11-27）
  - Supabase Auth の設定とログイン機能
  - `/admin/login` ページの実装
  - 認証ミドルウェアの実装
  - `/admin/settings` ページの実装
  - クリニック設定の取得・更新機能

> **注意**: 旧設計（clinic/staff ベース）から新設計（organization/unit ベース）への移行が必要です。

### 次のマイルストーン

1. Phase 1 の完了（DBスキーマ再設計・移行）
2. Phase 2 の完了（認証・基本設定の再実装）
3. Phase 3 の完了（MVP: 打刻機能）
4. Phase 4 の完了（管理画面基本機能）
5. Phase 5 の完了（レポート出力）

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する
* 旧設計から新設計への移行時は、既存データの整合性に注意する

---

最終更新: 2025-12-08（Phase 1完了、Phase 2ほぼ完了、Phase 3バックエンド対応完了）

```

```markdown
# 実装ロードマップ

汎用勤怠管理SaaSシステムの実装計画と進捗管理用ドキュメントです。

## システム概要

### 階層構造

現行バージョンでは **2階層** でスタートします：

- **organization** … 会社／事業単位のアカウント（契約単位）
- **unit** … 拠点・店舗・クリニック・部署などの勤怠単位

> **注意**: 現行バージョンでは organization を最上位として扱いますが、将来、上位階層（enterprise）を追加して 3 階層に拡張する可能性があります。そのため、organization を「絶対的な最上位」とは決めつけない設計にします。

### 主要概念

- **organization**: 1つの契約（プラン）を持つアカウント単位
  - 単拠点プラン → unit は 1件まで
  - 複数拠点プラン → unit を複数作成可能
  - 業種は固定しない（会社単位・事業単位のどちらでも運用可能）

- **unit**: 勤怠をまとめる実務上の単位
  - 例）店舗、クリニック、工場、支店、部署など
  - 組織内での集計・管理単位として扱う
  - 業種に依存した名前（clinic 等）は使わない

### Slug 方針

#### organization_slug
- **完全自動生成**
- **ランダム英字 20〜24 桁程度**（Supabase の org slug と同じノリ）
- 一度発行したら **変更不可（永続ID）**
- 人間が読めなくてよい（ユニーク性と安定性を最優先）

#### unit_slug
- **organization 内でユニーク** であればよい
- 管理者が **任意の文字列を入力**（英字・数字・ハイフン）
  - 例：`head-office`, `tenjin`, `shop-1` など
- URL に出ても問題ないが、SNSのような"見せる用"ではない前提

### ID と slug の関係

- すべての主要エンティティ（organization, unit, user, employee 等）は、**内部的には UUID などの主キー（id）で管理** する
- **slug はあくまで「外向きの識別子／URL用」** として扱う
- アプリ内部の参照・リレーションは **id 基本**、slug は補助的

### URL 構造

org・unit ともに **slug を URL に使う前提** で設計：

- 例：`/org/:org_slug/...`
- 拠点を絡めるなら：`/org/:org_slug/units/:unit_slug/...`

---

## 実装フェーズ

### Phase 1: プロジェクト基盤・DBスキーマ再設計 🔄

**目標**: 汎用システム向けにDBスキーマを再設計・移行

#### タスク

- [x] 新しいDBスキーマの設計
  - [x] `organizations` テーブルの作成
  - [x] `units` テーブルの作成
  - [x] `members` テーブルの作成（ユーザーとorganizationの中間概念）
  - [x] `employees` テーブルの作成（旧 `staffs` を汎用化）
  - [x] `attendances` テーブルの更新（カラム追加）
  - [x] `attendance_logs` テーブルの更新（カラム追加）
  - [x] 必要な ENUM 型の作成
  - [x] インデックスの作成
- [x] 既存データの移行スクリプト
  - [x] `clinics` → `organizations` + `units` への移行
  - [x] `staffs` → `employees` への移行
  - [x] `admins` → `members` への移行
  - [x] `attendances` / `attendance_logs` のデータ移行
- [x] TypeScript 型定義の更新
- [x] organization_slug 生成ロジックの実装

**依存関係**: なし

**完了条件**: 新しいDBスキーマが適用され、既存データが移行される

---

### Phase 2: 認証・基本設定の再実装 🔄

**目標**: organization/unit ベースの認証と設定機能の実装

#### タスク

- [x] Supabase Auth の設定確認
- [x] 認証・認可の実装
  - [x] `organization_slug` から `organization_id` への変換ロジック
  - [x] `unit_slug` から `unit_id` への変換ロジック
  - [x] ユーザーが所属する organization の取得
  - [x] ユーザーの role に基づくアクセス制御
- [x] セッション管理・認証ミドルウェアの更新
- [x] Server Actions の実装
  - [x] `app/actions/organization.ts` - organization の CRUD
  - [x] `app/actions/unit.ts` - unit の CRUD
  - [x] `app/actions/auth.ts` - organization ベースのログイン/ログアウト
- [x] ルーティング構造の実装
  - [ ] `/` - サービス紹介ページ（LP）（未実装、現在は打刻画面）
  - [x] `/org/:org_slug/login` - 管理者ログインページ
  - [x] `/org/:org_slug/dashboard` - ダッシュボード
  - [x] `/org/:org_slug/units` - 拠点一覧
  - [x] `/org/:org_slug/units/:unit_slug` - 拠点詳細・設定
  - [x] `/org/:org_slug/units/:unit_slug/terminal` - 打刻画面
- [ ] organization 設定ページの実装
- [x] unit 設定ページの実装
  - [x] タイムゾーン、丸め単位、丸めモードの設定

**依存関係**: Phase 1

**完了条件**: 管理者がログインでき、organization/unit 設定を変更できる

---

### Phase 3: タブレット打刻機能（MVP） 📱

**目標**: PIN 認証による出勤/退勤打刻機能の実装

#### タスク

- [x] `/org/:org_slug/units/:unit_slug/terminal` ページの実装
  - [x] PIN 入力画面（数字キーパッド）
  - [x] PIN マスク表示
  - [x] 認証後の状態表示
- [x] PIN ハッシュ化・検証ロジック
- [x] 時刻丸めロジックの実装
  - [x] `rounding_unit` / `rounding_mode` に基づく計算
  - [x] タイムゾーン変換処理
- [x] 出勤打刻機能（Server Action）
  - [x] `clockInByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_in_actual` / `clock_in_effective` の記録
  - [x] `attendance_logs` への記録
- [x] 退勤打刻機能（Server Action）
  - [x] `clockOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `clock_out_actual` / `clock_out_effective` の記録
  - [x] `work_minutes_effective` の計算・更新
  - [x] `attendance_logs` への記録
- [x] 外出・戻り打刻機能（Server Action）
  - [x] `breakOutByPin` の実装（unit_id/employee_id対応済み）
  - [x] `breakInByPin` の実装（unit_id/employee_id対応済み）
- [x] 打刻完了後の自動リセット（リンクボタンでのみ戻る）

**依存関係**: Phase 1, Phase 2

**完了条件**: PIN 入力で出勤/退勤打刻ができ、丸め後の時刻が正しく記録される

---

### Phase 4: 管理画面（基本機能） 📋

**目標**: 従業員管理と勤怠データの確認機能

#### 4.1 従業員管理

- [ ] `/org/:org_slug/units/:unit_slug/employees` ページの実装
  - [ ] 従業員一覧表示
  - [ ] 新規従業員作成フォーム
  - [ ] 従業員編集フォーム
  - [ ] PIN 再発行機能
  - [ ] アクティブ/非アクティブ切り替え
- [ ] Server Actions の実装
  - [ ] `getEmployees`
  - [ ] `createEmployee`
  - [ ] `updateEmployee`
  - [ ] `resetEmployeePin`

#### 4.2 ダッシュボード

- [ ] `/org/:org_slug/dashboard` ページの実装
  - [ ] 指定月のサマリー表示（全 unit 合計）
  - [ ] 総労働時間（organization 合計）
  - [ ] unit 別労働時間
  - [ ] 従業員別労働時間ランキング
  - [ ] 支給額概算
  - [ ] 今日の勤怠状況（出勤中従業員一覧）
- [ ] `/org/:org_slug/units/:unit_slug/dashboard` ページの実装
  - [ ] unit 単位のサマリー表示
- [ ] Server Action: `getDashboardSummary`

#### 4.3 勤怠一覧

- [ ] `/org/:org_slug/units/:unit_slug/attendances` ページの実装
  - [ ] フィルター機能（日付・月・従業員）
  - [ ] 勤怠データ一覧表示
  - [ ] 実打刻/丸め後時刻の表示
  - [ ] 労働時間・支給額の表示
  - [ ] 手修正フラグの表示
- [ ] Server Action: `getAttendances`

#### 4.4 勤怠詳細・修正

- [ ] `/org/:org_slug/units/:unit_slug/attendances/[id]` ページの実装
  - [ ] 詳細情報の表示
  - [ ] 修正履歴（`attendance_logs`）の表示
  - [ ] 手修正フォーム（出勤/退勤時刻）
- [ ] Server Action: `updateAttendance`
  - [ ] `has_manual_correction` フラグの設定
  - [ ] `attendance_logs` への記録

#### 4.5 拠点管理

- [ ] `/org/:org_slug/units` ページの実装
  - [ ] 拠点一覧表示
  - [ ] 新規拠点作成フォーム（unit_slug 入力含む）
  - [ ] 拠点編集フォーム
  - [ ] 拠点削除機能（プラン制限チェック含む）
- [ ] Server Actions の実装
  - [ ] `getUnits`
  - [ ] `createUnit`
  - [ ] `updateUnit`
  - [ ] `deleteUnit`

**依存関係**: Phase 1, Phase 2, Phase 3

**完了条件**: 従業員の追加・編集ができ、勤怠データの確認・修正ができる

---

### Phase 5: レポート・出力機能 📊

**目標**: CSV/PDF レポート出力機能の実装

#### タスク

- [ ] `/org/:org_slug/units/:unit_slug/reports` ページの実装
  - [ ] 期間選択（月単位 or 日付範囲）
  - [ ] 従業員選択（複数選択可）
  - [ ] 出力形式選択（CSV / PDF）
- [ ] CSV 出力機能
  - [ ] Server Action: `exportAttendancesCsv`
  - [ ] `attendances` JOIN `employees` のデータ取得
  - [ ] CSV フォーマット変換
  - [ ] ダウンロード処理
- [ ] PDF 出力機能
  - [ ] PDF 生成ライブラリの選定・導入（例: puppeteer, jsPDF）
  - [ ] Server Action: `generateReportPdf`
  - [ ] HTML テンプレートの作成
  - [ ] PDF レイアウトの実装
  - [ ] ダウンロード処理
- [ ] organization 単位のレポート機能（全 unit 合計）

**依存関係**: Phase 4

**完了条件**: 指定期間・従業員の勤怠データを CSV/PDF で出力できる

---

### Phase 6: 拡張機能・最適化 🚀

**目標**: UI/UX の改善とパフォーマンス最適化

#### タスク

- [ ] RLS（Row Level Security）の設定・最適化
- [ ] エラーハンドリングの強化
- [ ] ローディング状態の改善
- [ ] レスポンシブデザインの調整
- [ ] アクセシビリティの向上
- [ ] テストの追加（オプション）
- [ ] パフォーマンス最適化
- [ ] organization_slug 生成ロジックの実装
  - [ ] ランダム英字20-24桁の生成
  - [ ] ユニークチェック
  - [ ] 永続性の保証

**依存関係**: Phase 1-5

**完了条件**: システムが安定して動作し、ユーザビリティが向上している

---

## 将来の拡張機能（Out of Scope）

以下の機能は現時点では実装対象外ですが、将来の拡張として検討可能です：

* 有給・休暇管理
* 休日・祝日設定
* シフト管理（予定 vs 実績）
* 既存給与ソフト（弥生給与 等）向けの CSV レイアウト対応
* enterprise 階層の追加（3階層への拡張）
* プラン管理・課金機能
* 複数 organization への所属管理UI

---

## 進捗管理

### 現在のフェーズ

**Phase 2: 認証・基本設定の再実装** - ほぼ完了（ルーティング構造・unit設定ページ実装完了）
**Phase 3: タブレット打刻機能（MVP）** - バックエンド対応完了（unit_id/employee_id対応済み）

### 完了済みタスク

- Phase 1（旧）: プロジェクト基盤・DBスキーマ（2025-11-27）
  - Next.js プロジェクトの初期化（TypeScript, Tailwind CSS）
  - Supabase クライアントのセットアップ
  - DB スキーマ SQL ファイルの作成（旧設計）
  - TypeScript 型定義の作成（旧設計）

- Phase 2（旧）: 認証・基本設定（2025-11-27）
  - Supabase Auth の設定とログイン機能
  - `/admin/login` ページの実装
  - 認証ミドルウェアの実装
  - `/admin/settings` ページの実装
  - クリニック設定の取得・更新機能

- Phase 1（新）: DBスキーマ再設計・移行（2025-12-08）
  - 新しいDBスキーマの作成（`supabase/schema-v2.sql`）
  - 既存データの移行スクリプト（`supabase/migration-v1-to-v2.sql`）
  - TypeScript型定義の更新（`types/database.ts`）

- Phase 2（新）: 認証・基本設定の再実装（2025-12-08）
  - 認証ユーティリティの更新（`lib/auth/utils.ts`）
  - Server Actions実装（`app/actions/organization.ts`, `app/actions/unit.ts`, `app/actions/auth.ts`）
  - 認証ミドルウェアの更新（`middleware.ts`）
  - ルーティング構造の実装（`/org/:org_slug/*`）
  - unit設定ページの実装（`UnitSettingsForm`コンポーネント）

- Phase 3（新）: タブレット打刻機能のバックエンド対応（2025-12-08）
  - `app/actions/attendance.ts`を新しいスキーマ（`unit_id`/`employee_id`）に対応
  - 打刻画面のルーティング構造への配置（`/org/:org_slug/units/:unit_slug/terminal`）

> **注意**: 旧設計（clinic/staff ベース）から新設計（organization/unit ベース）への移行が完了しました。

### 次のマイルストーン

1. Phase 1 の完了（DBスキーマ再設計・移行）
2. Phase 2 の完了（認証・基本設定の再実装）
3. Phase 3 の完了（MVP: 打刻機能）
4. Phase 4 の完了（管理画面基本機能）
5. Phase 5 の完了（レポート出力）

---

## 注意事項

* 各フェーズは前のフェーズの完了を待ってから開始することを推奨
* Phase 3（打刻機能）が MVP として最優先
* Phase 4 以降は並行作業が可能な部分もある
* 実装中に設計書（`outline.md`）との不整合があれば、適宜更新する
* 旧設計から新設計への移行時は、既存データの整合性に注意する

---

最終更新: 2025-12-08（Phase 1完了、Phase 2ほぼ完了、Phase 3バックエンド対応完了）

```


作業完了。ROADMAPを更新しました。

**完了した作業:**

1. **`app/actions/attendance.ts`を新しいスキーマに対応**
   - `verifyStaffByPin` → `verifyEmployeeByPin`（`employees`テーブルから取得）
   - `getClinic` → `getUnit`（`units`テーブルから取得）
   - `getTodayAttendance` → `unit_id`/`employee_id`を使用
   - すべての`clinic_id`/`staff_id`参照を`unit_id`/`employee_id`に変更
   - フロントエンドとの後方互換性のため、`StaffStatus`インターフェースを維持

2. **ROADMAPの更新**
   - Phase 2のルーティング構造の実装を完了としてマーク
   - Phase 3の打刻機能のバックエンド対応を完了としてマーク
   - 進捗管理セクションを更新

**現在の状況:**
- Phase 1: 完了
- Phase 2: ほぼ完了（organization設定ページのみ未実装）
- Phase 3: バックエンド対応完了（打刻機能は新しいスキーマに対応済み）

次は動作確認に進みますか？それともorganization設定ページの実装に進みますか？

---

**User**

動作確認をします。手順を教えてください。手短に

---

**Cursor**


動作確認手順（簡潔版）:

1. 開発サーバー起動
   ```bash
   npm run dev
   ```

2. ログイン確認
   - `/org/[organization_slug]/login` にアクセス
   - 既存の管理者アカウントでログイン

3. ダッシュボード確認
   - `/org/[organization_slug]/dashboard` が表示されること

4. 拠点一覧確認
   - `/org/[organization_slug]/units` にアクセス
   - 移行済みのunitが表示されること

5. 拠点詳細・設定確認
   - `/org/[organization_slug]/units/[unit_slug]` にアクセス
   - unit設定（タイムゾーン、丸め単位、丸めモード）が変更できること

6. 打刻画面確認
   - `/org/[organization_slug]/units/[unit_slug]/terminal` にアクセス
   - PIN入力画面が表示されること
   - PIN入力後、出勤/退勤/外出/戻りボタンが表示されること
   - 打刻が正常に動作すること

**注意**: `organization_slug`と`unit_slug`は移行後のデータから取得してください。Supabaseの`organizations`テーブルと`units`テーブルで確認できます。

確認したい項目を指定してください。

```shellscript
   npm run dev
```

---

**User**

/org/[organization_slug]/login

にアクセスって、どういうこと？配慮が足りませんね

---

**Cursor**


手順を具体化します。まず、Supabaseで`organization_slug`を確認します。



動作確認手順（具体的手順）:

1. **Supabaseで`organization_slug`を確認**
   - Supabase Dashboard → Table Editor → `organizations`テーブル
   - `organization_slug`の値をコピー（例: `abc123def456ghi789jkl`）

2. **開発サーバー起動**
   ```bash
   npm run dev
   ```

3. **ログインページにアクセス**
   - ブラウザで `http://localhost:3000/org/[organization_slug]/login` にアクセス
   - 例: `http://localhost:3000/org/abc123def456ghi789jkl/login`

4. **ログイン**
   - 既存の管理者アカウント（Email/Password）でログイン

5. **各ページを確認**
   - ダッシュボード: `/org/[organization_slug]/dashboard`
   - 拠点一覧: `/org/[organization_slug]/units`
   - 拠点詳細: `/org/[organization_slug]/units/[unit_slug]`（`unit_slug`は`units`テーブルで確認）
   - 打刻画面: `/org/[organization_slug]/units/[unit_slug]/terminal`

**補足**: `unit_slug`もSupabaseの`units`テーブルで確認できます。

`organization_slug`が見つからない場合は、Supabase SQL Editorで以下を実行してください:
```sql
SELECT organization_slug, name FROM organizations;
```

```shellscript
   npm run dev
```

```sql
SELECT organization_slug, name FROM organizations;
```

---

**User**

拠点詳細でエラーが出ます。
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  <... unit={{...}} updateAction={function updateAction}>
                                 ^^^^^^^^^^^^^^^^^^^^^^^



---

**Cursor**


`UnitSettingsForm`に渡している`updateAction`が原因です。`updateUnit`を直接渡すのではなく、Server Actionとしてラップする必要があります。該当箇所を確認して修正します。


