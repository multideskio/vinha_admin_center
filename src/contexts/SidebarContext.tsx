'use client'

import * as React from 'react'

type SidebarContextType = {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  const value = React.useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
      toggleSidebar,
    }),
    [isCollapsed, toggleSidebar]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}