'use client'

import { useState } from 'react'
import SideNav from './SideNav'
import OrgHeader from './OrgHeader'

interface OrgLayoutClientProps {
  children: React.ReactNode
  orgSlug: string
  organizationName: string
  userRole: string
}

export default function OrgLayoutClient({ 
  children, 
  orgSlug, 
  organizationName, 
  userRole 
}: OrgLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SideNav 
        orgSlug={orgSlug}
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        <OrgHeader 
          orgSlug={orgSlug}
          organizationName={organizationName}
          userRole={userRole}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

