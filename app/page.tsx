'use client'

import { NeuroTaskProvider, useNeuroTask } from '@/components/neuro-task-provider'
import { AuthScreen } from '@/components/auth-screen'
import { Sidebar } from '@/components/sidebar'
import { CalendarView } from '@/components/calendar-view'
import { DashboardView } from '@/components/dashboard-view'
import { ChatView } from '@/components/chat-view'

function MainContent() {
  const { currentView } = useNeuroTask()

  return (
    <main className="flex-1 overflow-hidden bg-background">
      {currentView === 'calendar' && <CalendarView />}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'chat' && <ChatView />}
    </main>
  )
}

function AuthenticatedApp() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent />
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, login } = useNeuroTask()

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticate={login} />
  }

  return <AuthenticatedApp />
}

export default function NeuroTaskApp() {
  return (
    <NeuroTaskProvider>
      <AppContent />
    </NeuroTaskProvider>
  )
}
