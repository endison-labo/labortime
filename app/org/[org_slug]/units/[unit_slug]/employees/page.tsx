import { redirect } from 'next/navigation'
import { getCurrentMemberBySlug } from '@/lib/auth/utils'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  resetEmployeePin,
} from '@/app/actions/employee'
import Link from 'next/link'
import EmployeeList from '@/components/admin/EmployeeList'
import type { Employee } from '@/types/database'

interface PageProps {
  params: Promise<{ org_slug: string; unit_slug: string }>
}

export default async function EmployeesPage({ params }: PageProps) {
  const { org_slug, unit_slug } = await params
  const member = await getCurrentMemberBySlug(org_slug)

  if (!member) {
    redirect(`/org/${org_slug}/login`)
  }

  // owner または admin のみアクセス可能
  if (member.role !== 'owner' && member.role !== 'admin') {
    redirect(`/org/${org_slug}/units/${unit_slug}`)
  }

  const { employees, error } = await getEmployees(org_slug, unit_slug)

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/org/${org_slug}/units/${unit_slug}`}
                  className="text-xl font-semibold text-slate-800 hover:text-slate-600"
                >
                  拠点詳細
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Server Action wrappers for Client Component
  async function handleCreateEmployee(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const hourlyWage = parseFloat(formData.get('hourlyWage') as string)
    const pin = formData.get('pin') as string
    const isActive = formData.get('isActive') === 'true'

    return await createEmployee(org_slug, unit_slug, {
      name,
      hourlyWage,
      pin,
      isActive,
    })
  }

  async function handleUpdateEmployee(employeeId: string, formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const hourlyWage = parseFloat(formData.get('hourlyWage') as string)
    const isActive = formData.get('isActive') === 'true'

    return await updateEmployee(org_slug, unit_slug, employeeId, {
      name,
      hourlyWage,
      isActive,
    })
  }

  async function handleResetPin(employeeId: string, formData: FormData) {
    'use server'
    const newPin = formData.get('newPin') as string

    return await resetEmployeePin(org_slug, unit_slug, employeeId, newPin)
  }

  async function handleToggleActive(employee: Employee) {
    'use server'
    return await updateEmployee(org_slug, unit_slug, employee.id, {
      isActive: !employee.is_active,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/org/${org_slug}/units`}
                className="text-xl font-semibold text-slate-800 hover:text-slate-600"
              >
                拠点一覧
              </Link>
              <span className="text-slate-400">/</span>
              <Link
                href={`/org/${org_slug}/units/${unit_slug}`}
                className="text-xl font-semibold text-slate-800 hover:text-slate-600"
              >
                拠点詳細
              </Link>
              <span className="text-slate-400">/</span>
              <h1 className="text-xl font-semibold text-slate-800">従業員管理</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <EmployeeList
            initialEmployees={employees || []}
            organizationSlug={org_slug}
            unitSlug={unit_slug}
            createEmployeeAction={handleCreateEmployee}
            updateEmployeeAction={handleUpdateEmployee}
            resetPinAction={handleResetPin}
            toggleActiveAction={handleToggleActive}
          />
        </div>
      </main>
    </div>
  )
}

