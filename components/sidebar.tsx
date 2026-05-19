'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Calendar, LayoutDashboard, MessageSquare, Brain, Shield, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNeuroTask } from '@/components/neuro-task-provider'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { theme, setTheme } = useTheme()
  const { currentView, setCurrentView, authToken, isAuthenticated, userEmail, logout } = useNeuroTask()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { id: 'calendar' as const, label: 'Calendário / Time-Blocking', icon: Calendar },
    { id: 'dashboard' as const, label: 'Dashboard / Métricas', icon: LayoutDashboard },
    { id: 'chat' as const, label: 'Neuro IA Chat', icon: MessageSquare },
  ]

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Brain className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-sidebar-foreground">NeuroTask</h1>
          <p className="text-xs text-muted-foreground">Organizador Inteligente</p>
        </div>
      </div>

      {/* Auth Status */}
      <div className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          <Shield className="h-3 w-3 text-emerald-500" />
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Autenticado</span>
        </div>
        {userEmail && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {userEmail}
          </p>
        )}
        {authToken && (
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground/70">
            {authToken}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              currentView === item.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-sidebar-foreground">Tema</span>
          {mounted && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="bg-sidebar-accent"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Alternar tema</span>
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
