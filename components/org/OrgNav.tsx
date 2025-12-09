'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/admin/LogoutButton'
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'

interface OrgNavProps {
  orgSlug: string
  organizationName: string
  userRole: string
}

export default function OrgNav({ orgSlug, organizationName, userRole }: OrgNavProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => 
      prev.includes(menu) 
        ? prev.filter(m => m !== menu)
        : [...prev, menu]
    )
  }

  const menuItems = [
    {
      key: 'dashboard',
      label: 'ダッシュボード',
      href: `/org/${orgSlug}/dashboard`,
      icon: LayoutDashboard,
      single: true,
    },
    {
      key: 'attendances',
      label: '勤怠',
      icon: Clock,
      single: false,
      items: [
        { label: '日別一覧', href: `/org/${orgSlug}/attendances/daily` },
        { label: '月別一覧', href: `/org/${orgSlug}/attendances/monthly` },
      ],
    },
    {
      key: 'shifts',
      label: 'シフト',
      icon: Calendar,
      single: false,
      items: [
        { label: 'シフト表', href: `/org/${orgSlug}/shifts/schedule` },
        { label: '勤務パターン', href: `/org/${orgSlug}/shifts/patterns` },
      ],
    },
    {
      key: 'staff',
      label: 'スタッフ',
      icon: Users,
      single: false,
      items: [
        { label: 'スタッフ一覧', href: `/org/${orgSlug}/staff/list` },
        { label: '職種・資格マスタ', href: `/org/${orgSlug}/staff/job-types` },
      ],
    },
    {
      key: 'reports',
      label: '集計・レポート',
      icon: FileText,
      single: false,
      items: [
        { label: '月次集計', href: `/org/${orgSlug}/reports/summary` },
        { label: 'CSV出力', href: `/org/${orgSlug}/reports/export` },
      ],
    },
    {
      key: 'settings',
      label: '設定',
      icon: Settings,
      single: false,
      items: [
        { label: '組織設定', href: `/org/${orgSlug}/settings` },
        { label: '拠点設定', href: `/org/${orgSlug}/units` },
        { label: '所定労働時間', href: `/org/${orgSlug}/settings/work-hours` },
        { label: '休日・祝日', href: `/org/${orgSlug}/settings/holidays` },
      ],
    },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ・組織名 */}
          <div className="flex items-center space-x-8">
            <Link 
              href={`/org/${orgSlug}/dashboard`} 
              className="text-xl font-semibold text-slate-800 hover:text-slate-600 transition-colors"
            >
              {organizationName || 'labortime.work'}
            </Link>
            
            {/* メインメニュー */}
            <div className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isItemActive = item.single 
                  ? isActive(item.href!)
                  : item.items?.some(subItem => isActive(subItem.href))
                
                if (item.single) {
                  return (
                    <Link
                      key={item.key}
                      href={item.href!}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isItemActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                }

                return (
                  <div key={item.key} className="relative">
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isItemActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${openMenus.includes(item.key) ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openMenus.includes(item.key) && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50">
                        {item.items?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              isActive(subItem.href)
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                            onClick={() => setOpenMenus([])}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右側: ユーザー情報・ログアウト */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-slate-600">
              {userRole === 'owner' ? 'オーナー' : userRole === 'admin' ? '管理者' : 'メンバー'}
            </span>
            <LogoutButton organizationSlug={orgSlug} />
          </div>
        </div>
      </div>
    </nav>
  )
}

