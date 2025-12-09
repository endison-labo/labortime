'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  ChevronRight,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface SideNavProps {
  orgSlug: string
  isOpen: boolean
  onClose: () => void
}

export default function SideNav({ orgSlug, isOpen, onClose }: SideNavProps) {
  const pathname = usePathname()
  
  // デフォルトで開くメニュー
  const [openMenus, setOpenMenus] = useState<string[]>(['attendances', 'settings'])

  // モバイルでページ遷移したら閉じる
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // PCサイズになったら閉じない（レイアウト側で制御）
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      label: '勤怠管理',
      icon: Clock,
      single: false,
      items: [
        { label: '日別データ', href: `/org/${orgSlug}/attendances/daily` },
        { label: '月別データ', href: `/org/${orgSlug}/attendances/monthly` },
        // { label: '打刻修正・承認', href: `/org/${orgSlug}/attendances/approvals` },
      ],
    },
    {
      key: 'shifts',
      label: 'シフト管理',
      icon: Calendar,
      single: false,
      items: [
        { label: 'シフト作成・編集', href: `/org/${orgSlug}/shifts/schedule` },
        { label: '勤務パターン設定', href: `/org/${orgSlug}/shifts/patterns` },
      ],
    },
    {
      key: 'staff',
      label: 'スタッフ管理',
      icon: Users,
      single: false,
      items: [
        { label: 'スタッフ一覧', href: `/org/${orgSlug}/units/all/employees` }, // 仮: 全拠点または選択用
        // { label: 'スタッフ登録', href: `/org/${orgSlug}/staff/new` },
        { label: '職種・資格設定', href: `/org/${orgSlug}/staff/job-types` },
      ],
    },
    {
      key: 'reports',
      label: '集計・出力',
      icon: FileText,
      single: false,
      items: [
        { label: '月次集計データ', href: `/org/${orgSlug}/reports/summary` },
        { label: 'CSV出力', href: `/org/${orgSlug}/reports/export` },
      ],
    },
    {
      key: 'settings',
      label: '設定',
      icon: Settings,
      single: false,
      items: [
        { label: '組織情報', href: `/org/${orgSlug}/settings` },
        { label: '拠点設定', href: `/org/${orgSlug}/units` },
        { label: '所定労働時間', href: `/org/${orgSlug}/settings/work-hours` },
        { label: '休日・祝日', href: `/org/${orgSlug}/settings/holidays` },
      ],
    },
  ]

  return (
    <>
      {/* モバイル用オーバーレイ */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* サイドナビゲーション本体 */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <Link href={`/org/${orgSlug}/dashboard`} className="text-xl font-bold text-white tracking-tight">
            Labor Time
          </Link>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isItemActive
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose()
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            }

            return (
              <div key={item.key} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.key)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isItemActive
                      ? 'text-white'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </div>
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMenus.includes(item.key) ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
                
                {openMenus.includes(item.key) && (
                  <div className="pl-11 space-y-1">
                    {item.items?.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive(subItem.href)
                            ? 'bg-slate-800 text-blue-400 font-medium'
                            : 'hover:text-white hover:bg-slate-800/50'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose()
                        }}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

