import { redirect } from 'next/navigation'
import { getCurrentMemberBySlug } from '@/lib/auth/utils'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  resetEmployeePin,
} from '@/app/actions/employee'
import EmployeeList from '@/components/admin/EmployeeList'
import type { Employee } from '@/types/database'

interface PageProps {
  params: Promise<{ org_slug: string; unit_slug: string }>
}

export default async function EmployeesPage({ params }: PageProps) {
  const { org_slug, unit_slug } = await params
  const member = await getCurrentMemberBySlug(org_slug)

  // owner または admin のみアクセス可能
  if (member && member.role !== 'owner' && member.role !== 'admin') {
    redirect(`/org/${org_slug}/units/${unit_slug}`)
  }

  const { employees, error } = await getEmployees(org_slug, unit_slug)

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800">{error}</p>
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
  )
}

