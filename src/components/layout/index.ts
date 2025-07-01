/**
 * Layout Components for Gensy AI Creative Suite
 * Central export file for all layout components
 */

export { Sidebar } from './Sidebar'
export { Header } from './Header'
export { DashboardLayout } from './DashboardLayout'

// Layout types and interfaces
export interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
}
