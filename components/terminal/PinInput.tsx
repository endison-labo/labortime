'use client'

import { useState, useEffect } from 'react'

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
    <div className="w-full max-w-md mx-auto">
      {/* PIN表示フィールド */}
      <div className="mb-8">
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 ${
                index < pin.length
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300'
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
            className="aspect-square bg-white border-2 border-gray-300 rounded-lg text-3xl font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-500 active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[80px]"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={isLoading || pin.length === 0}
          className="aspect-square bg-gray-100 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[80px]"
        >
          クリア
        </button>
        <button
          onClick={() => handleNumberClick(0)}
          disabled={isLoading || pin.length >= 4}
          className="aspect-square bg-white border-2 border-gray-300 rounded-lg text-3xl font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-500 active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[80px]"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={isLoading || pin.length === 0}
          className="aspect-square bg-gray-100 border-2 border-gray-300 rounded-lg text-lg font-semibold text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[80px]"
        >
          削除
        </button>
      </div>
    </div>
  )
}

