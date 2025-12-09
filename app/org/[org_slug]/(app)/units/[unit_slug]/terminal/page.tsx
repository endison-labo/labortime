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

