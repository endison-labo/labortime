'use client'

import { logoutAction } from '@/app/actions/logout'

interface LogoutButtonProps {
  organizationSlug?: string
}

export default function LogoutButton({ organizationSlug }: LogoutButtonProps = {}) {
  const handleLogout = async () => {
    await logoutAction(organizationSlug)
  }

  return (
    <form action={handleLogout}>
      <button
        type="submit"
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        ログアウト
      </button>
    </form>
  )
}






