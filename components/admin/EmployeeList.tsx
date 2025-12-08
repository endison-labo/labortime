'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Employee } from '@/types/database'
import { Plus, Edit2, Key, CheckCircle2, XCircle, X } from 'lucide-react'

interface EmployeeListProps {
  initialEmployees: Employee[]
  organizationSlug: string
  unitSlug: string
  createEmployeeAction: (formData: FormData) => Promise<{ employee?: Employee; error?: string }>
  updateEmployeeAction: (
    employeeId: string,
    formData: FormData
  ) => Promise<{ employee?: Employee; error?: string }>
  resetPinAction: (employeeId: string, formData: FormData) => Promise<{ error?: string }>
  toggleActiveAction: (employee: Employee) => Promise<{ employee?: Employee; error?: string }>
}

export default function EmployeeList({
  initialEmployees,
  organizationSlug,
  unitSlug,
  createEmployeeAction,
  updateEmployeeAction,
  resetPinAction,
  toggleActiveAction,
}: EmployeeListProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [resettingPinEmployee, setResettingPinEmployee] = useState<Employee | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCreateEmployee = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createEmployeeAction(formData)
      if (result.error) {
        alert(result.error)
      } else if (result.employee) {
        setEmployees([result.employee, ...employees])
        setIsCreateModalOpen(false)
        const form = document.getElementById('create-employee-form') as HTMLFormElement
        form?.reset()
        router.refresh()
      }
    })
  }

  const handleUpdateEmployee = async (formData: FormData) => {
    if (!editingEmployee) return
    startTransition(async () => {
      const result = await updateEmployeeAction(editingEmployee.id, formData)
      if (result.error) {
        alert(result.error)
      } else if (result.employee) {
        setEmployees(employees.map((e) => (e.id === editingEmployee.id ? result.employee! : e)))
        setEditingEmployee(null)
        router.refresh()
      }
    })
  }

  const handleResetPin = async (formData: FormData) => {
    if (!resettingPinEmployee) return
    startTransition(async () => {
      const result = await resetPinAction(resettingPinEmployee.id, formData)
      if (result.error) {
        alert(result.error)
      } else {
        alert('PINを再発行しました')
        setResettingPinEmployee(null)
        router.refresh()
      }
    })
  }

  const handleToggleActive = async (employee: Employee) => {
    startTransition(async () => {
      const result = await toggleActiveAction(employee)
      if (result.error) {
        alert(result.error)
      } else if (result.employee) {
        setEmployees(employees.map((e) => (e.id === employee.id ? result.employee! : e)))
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">従業員一覧</h3>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新規追加
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  氏名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  時給
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  登録日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    従業員が登録されていません
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">¥{employee.hourly_wage.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(employee)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          employee.is_active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {employee.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            アクティブ
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            非アクティブ
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(employee.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingEmployee(employee)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="編集"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResettingPinEmployee(employee)}
                          className="text-amber-600 hover:text-amber-800 p-2 hover:bg-amber-50 rounded transition-colors"
                          title="PIN再発行"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新規作成モーダル */}
      {isCreateModalOpen && (
        <Modal title="新規従業員追加" onClose={() => setIsCreateModalOpen(false)}>
          <form id="create-employee-form" action={handleCreateEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">氏名</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">時給（円）</label>
              <input
                type="number"
                name="hourlyWage"
                required
                min="0"
                step="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PIN（4桁の数字）</label>
              <input
                type="text"
                name="pin"
                required
                pattern="\d{4}"
                maxLength={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0000"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">アクティブ</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isPending ? '作成中...' : '作成'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 編集モーダル */}
      {editingEmployee && (
        <Modal title="従業員情報編集" onClose={() => setEditingEmployee(null)}>
          <form action={handleUpdateEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">氏名</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingEmployee.name}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">時給（円）</label>
              <input
                type="number"
                name="hourlyWage"
                required
                min="0"
                step="1"
                defaultValue={editingEmployee.hourly_wage}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={editingEmployee.is_active}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">アクティブ</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isPending ? '更新中...' : '更新'}
              </button>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PIN再発行モーダル */}
      {resettingPinEmployee && (
        <Modal title="PIN再発行" onClose={() => setResettingPinEmployee(null)}>
          <form action={handleResetPin} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">従業員</p>
              <p className="font-medium text-slate-900">{resettingPinEmployee.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                新しいPIN（4桁の数字）
              </label>
              <input
                type="text"
                name="newPin"
                required
                pattern="\d{4}"
                maxLength={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0000"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isPending ? '再発行中...' : '再発行'}
              </button>
              <button
                type="button"
                onClick={() => setResettingPinEmployee(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// モーダルコンポーネント
function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

