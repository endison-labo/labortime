'use client'

import LogoutButton from '@/components/admin/LogoutButton'
import { Menu, Bell, User } from 'lucide-react'

interface OrgHeaderProps {
  orgSlug: string
  organizationName: string
  userRole: string
  onMenuClick: () => void
}

export default function OrgHeader({ 
  orgSlug, 
  organizationName, 
  userRole, 
  onMenuClick 
}: OrgHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6 shadow-sm">
      <button 
        type="button" 
        className="lg:hidden -ml-2 p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md"
        onClick={onMenuClick}
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-800 truncate">
            {organizationName || 'labortime.work'}
          </h1>
          <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
            {userRole === 'owner' ? 'オーナー' : userRole === 'admin' ? '管理者' : 'メンバー'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 通知アイコン（将来用） */}
        <button className="text-slate-400 hover:text-slate-600 p-1 relative">
          <Bell className="w-5 h-5" />
          {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
        </button>

        <div className="h-6 w-px bg-slate-200" aria-hidden="true" />

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-700 leading-none mb-1">
              {/* ユーザー名があればここに */}
              ログイン中
            </span>
            <span className="text-xs text-slate-500 leading-none">
              {userRole === 'owner' ? 'オーナー' : userRole === 'admin' ? '管理者' : 'メンバー'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
              <User className="w-4 h-4" />
            </div>
            <LogoutButton organizationSlug={orgSlug} />
          </div>
        </div>
      </div>
    </header>
  )
}

