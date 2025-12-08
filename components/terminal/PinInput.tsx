'use client'

import { useState, useEffect } from 'react'
import { Delete, RotateCcw } from 'lucide-react'

interface PinInputProps {
  onPinSubmit: (pin: string) => void
  isLoading?: boolean
}

export default function PinInput({ onPinSubmit, isLoading = false }: PinInputProps) {
  const [pin, setPin] = useState('')

  // 4桁入力時に自動で確定処理を実行
  useEffect(() => {
    if (pin.length === 4 && !isLoading) {
      onPinSubmit(pin)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, isLoading])

  const handleNumberClick = (num: number) => {
    if (pin.length < 4 && !isLoading) {
      setPin(prev => prev + num.toString())
    }
  }

  const handleDelete = () => {
    if (!isLoading) {
      setPin(prev => prev.slice(0, -1))
    }
  }

  const handleClear = () => {
    if (!isLoading) {
      setPin('')
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* PIN表示フィールド */}
      <div className="mb-10">
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index < pin.length
                  ? 'bg-blue-600 scale-110 shadow-md shadow-blue-200'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 数字キーパッド */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            disabled={isLoading || pin.length >= 4}
            className="aspect-square bg-white rounded-2xl text-3xl font-medium text-slate-700 shadow-sm border border-slate-100 hover:shadow-md hover:bg-slate-50 active:scale-[0.98] hover:border-blue-200 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={isLoading || pin.length === 0}
          className="aspect-square flex flex-col items-center justify-center gap-1 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <RotateCcw className="w-6 h-6" />
          <span className="text-xs font-medium">クリア</span>
        </button>
        <button
          onClick={() => handleNumberClick(0)}
          disabled={isLoading || pin.length >= 4}
          className="aspect-square bg-white rounded-2xl text-3xl font-medium text-slate-700 shadow-sm border border-slate-100 hover:shadow-md hover:bg-slate-50 active:scale-[0.98] hover:border-blue-200 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading || pin.length === 0}
          className="aspect-square flex flex-col items-center justify-center gap-1 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Delete className="w-6 h-6" />
          <span className="text-xs font-medium">削除</span>
        </button>
      </div>
    </div>
  )
}
