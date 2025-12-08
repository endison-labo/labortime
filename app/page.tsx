'use client'

import { useState, useEffect } from 'react'
import PinInput from '@/components/terminal/PinInput'
import { clockInByPin, clockOutByPin, breakOutByPin, breakInByPin, getStaffStatusByPin } from '@/app/actions/attendance'

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

export default function Home() {
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
      // スタッフの状態を取得
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">勤怠管理システム</h1>
          {state === 'idle' && (
            <p className="text-gray-600">PINを入力してください</p>
          )}
        </div>

        {state === 'idle' && (
          <PinInput onPinSubmit={handlePinSubmit} isLoading={isLoading} />
        )}

        {state === 'authenticated' && isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">認証中...</p>
          </div>
        )}

        {state === 'action_selection' && staffStatus && (
          <div className="text-center">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
              <p className="text-gray-800 font-semibold text-xl mb-2">{staffStatus.staffName}さん</p>
              {!staffStatus.hasAttendance && (
                <p className="text-gray-600 text-lg">おはようございます！</p>
              )}
              {staffStatus.hasAttendance && (
                <p className="text-gray-600 text-sm">
                  出勤中
                  {staffStatus.isOnBreak && '（外出中）'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {!staffStatus.hasAttendance && (
                <button
                  onClick={() => handleAction('in')}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors col-span-2"
                >
                  出勤
                </button>
              )}
              {staffStatus.hasAttendance && !staffStatus.isOnBreak && (
                <>
                  <button
                    onClick={() => handleAction('out')}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    退勤
                  </button>
                  <button
                    onClick={() => handleAction('break_out')}
                    disabled={isLoading}
                    className="bg-yellow-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-700 active:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    外出
                  </button>
                </>
              )}
              {staffStatus.hasAttendance && staffStatus.isOnBreak && (
                <button
                  onClick={() => handleAction('break_in')}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors col-span-2"
                >
                  戻り
                </button>
              )}
            </div>
            <button
              onClick={handleReset}
              className="mt-4 text-gray-600 hover:text-gray-800 text-sm underline"
            >
              PIN入力に戻る
            </button>
          </div>
        )}

        {state === 'error' && result && (
          <div className="text-center">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
              <p className="text-red-800 font-semibold mb-2">エラー</p>
              <p className="text-red-700">{result.message}</p>
            </div>
            <button
              onClick={handleReset}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              もう一度試す
            </button>
          </div>
        )}

        {state === 'success' && result && (
          <div className="text-center">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-4">
              <p className="text-green-800 font-semibold text-xl mb-2">
                {result.clockType === 'in' && '出勤'}
                {result.clockType === 'out' && '退勤'}
                {result.clockType === 'break_out' && '外出'}
                {result.clockType === 'break_in' && '戻り'}
                しました
              </p>
              {result.staffName && (
                <p className="text-green-700 text-lg mb-2">{result.staffName}さん</p>
              )}
              {result.actualTime && (
                <p className="text-green-700">打刻時刻: {result.actualTime}</p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-800 text-sm underline"
            >
              PIN入力に戻る
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
