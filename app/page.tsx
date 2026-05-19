'use client'

import { NeuroTaskProvider, useNeuroTask } from '@/components/neuro-task-provider'
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

export default function NeuroTaskApp() {
  return (
    <NeuroTaskProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </NeuroTaskProvider>
  )
}
