'use client'

import * as React from 'react'
import {
  Task,
  TaskTag,
  ChatMessage,
  INITIAL_TASKS,
  generateId,
  simulateApiDelay,
} from '@/lib/store'

interface NeuroTaskContextType {
  isAuthenticated: boolean
  authToken: string | null
  userEmail: string | null
  login: (email: string) => Promise<void>
  logout: () => void
  tasks: Task[]
  pendingTasks: Task[]
  scheduledTasks: Task[]
  doneTasks: Task[]
  isLoading: boolean
  addTask: (task: Omit<Task, 'id' | 'status' | 'createdAt' | 'userEmail'>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  scheduleTask: (taskId: string, time: string, date: string) => Promise<{ success: boolean; error?: string }>
  completeTask: (taskId: string) => Promise<void>
  prioritizeTasks: () => Promise<void>
  chatMessages: ChatMessage[]
  sendMessage: (content: string) => Promise<void>
  isChatLoading: boolean
  currentView: 'calendar' | 'dashboard' | 'chat'
  setCurrentView: (view: 'calendar' | 'dashboard' | 'chat') => void
}

const NeuroTaskContext = React.createContext<NeuroTaskContextType | undefined>(undefined)

export function NeuroTaskProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [authToken, setAuthToken] = React.useState<string | null>(null)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [tasks, setTasks] = React.useState<Task[]>(INITIAL_TASKS)
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou a Neuro IA. Posso ajudar você a organizar suas tarefas.',
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isChatLoading, setIsChatLoading] = React.useState(false)
  const [currentView, setCurrentView] = React.useState<'calendar' | 'dashboard' | 'chat'>('calendar')

  const login = React.useCallback(async (email: string) => {
    const token = `X-Auth-Token-STABLE-${Date.now().toString(36).toUpperCase()}`
    setUserEmail(email.trim().toLowerCase()) // Normaliza o e-mail
    setAuthToken(token)
    setIsAuthenticated(true)
  }, [])

  const logout = React.useCallback(() => {
    setIsAuthenticated(false)
    setAuthToken(null)
    setUserEmail(null)
  }, [])

  const validateAuthHeaders = React.useCallback(() => {
    if (!isAuthenticated || !authToken) {
      throw new Error("Acesso Negado: X-Auth-Token ausente.")
    }
    return { 'Content-Type': 'application/json', 'X-Auth-Token': authToken }
  }, [isAuthenticated, authToken])

  // FILTRO CRUCIAL: Só renderiza na tela o que pertence ao usuário ativo!
  const userTasks = React.useMemo(() => {
    return tasks.filter((t) => t.userEmail === userEmail)
  }, [tasks, userEmail])

  const pendingTasks = React.useMemo(() => userTasks.filter((t) => t.status === 'PENDING'), [userTasks])
  const scheduledTasks = React.useMemo(() => userTasks.filter((t) => t.status === 'SCHEDULED'), [userTasks])
  const doneTasks = React.useMemo(() => userTasks.filter((t) => t.status === 'DONE'), [userTasks])

  const addTask = React.useCallback(
    async (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'userEmail'>) => {
      validateAuthHeaders()
      setIsLoading(true)
      await simulateApiDelay(null)

      const newTask: Task = {
        ...taskData,
        id: generateId(),
        status: 'PENDING',
        createdAt: new Date(),
        userEmail: userEmail || undefined, // Vincula permanentemente à conta atual
      }
      setTasks((prev) => [...prev, newTask])
      setIsLoading(false)
    },
    [validateAuthHeaders, userEmail]
  )

  const deleteTask = React.useCallback(
    async (taskId: string) => {
      validateAuthHeaders()
      setIsLoading(true)
      await simulateApiDelay(null)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      setIsLoading(false)
    },
    [validateAuthHeaders]
  )

  const scheduleTask = React.useCallback(
    async (taskId: string, time: string, date: string): Promise<{ success: boolean; error?: string }> => {
      validateAuthHeaders()
      setIsLoading(true)
      await simulateApiDelay(null)

      // Valida conflito considerando apenas as tarefas DO MESMO USUÁRIO na mesma data e hora
      const existingTask = tasks.find(
        (t) => t.userEmail === userEmail && t.scheduledTime === time && t.scheduledDate === date && t.status === 'SCHEDULED'
      )

      if (existingTask) {
        setIsLoading(false)
        return {
          success: false,
          error: 'Conflito de Agenda: Você já possui uma atividade planejada para este horário.',
        }
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId 
            ? { ...t, status: 'SCHEDULED' as const, scheduledTime: time, scheduledDate: date } 
            : t
        )
      )
      setIsLoading(false)
      return { success: true }
    },
    [validateAuthHeaders, tasks, userEmail]
  )

  const completeTask = React.useCallback(
    async (taskId: string) => {
      validateAuthHeaders()
      setIsLoading(true)
      await simulateApiDelay(null)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'DONE' as const } : t)))
      setIsLoading(false)
    },
    [validateAuthHeaders]
  )

  const prioritizeTasks = React.useCallback(async () => {
    validateAuthHeaders()
    setIsLoading(true)
    await simulateApiDelay(null)
    const priorityOrder = { trabalho: 1, estudos: 2, familia: 3, casa: 4 }
    setTasks((prev) => {
      const pending = prev.filter((t) => t.status === 'PENDING')
      const others = prev.filter((t) => t.status !== 'PENDING')
      const sorted = [...pending].sort((a, b) => priorityOrder[a.tag] - priorityOrder[b.tag])
      return [...sorted, ...others]
    })
    setIsLoading(false)
  }, [validateAuthHeaders])

  const sendMessage = React.useCallback(
    async (content: string) => {
      validateAuthHeaders()
      const userMessage: ChatMessage = { id: generateId(), role: 'user', content, timestamp: new Date() }
      setChatMessages((prev) => [...prev, userMessage])
      setIsChatLoading(true)
      await simulateApiDelay(null)

      const lowerContent = content.toLowerCase()
      let response = ''

      if (lowerContent.includes('revisão') || lowerContent.includes('relatório')) {
        const total = userTasks.length
        const concluidas = doneTasks.length
        const taxaAproveitamento = total > 0 ? Math.round((concluidas / total) * 100) : 0
        response = `📊 **Neuro IA - Revisão Semanal** 📊\n\n• Total monitorado: ${total}\n• Concluídas: ${concluidas}\n🎯 Taxa de conversão em Time-Blocking: ${taxaAproveitamento}%.`
      } else if (lowerContent.includes('priorizar')) {
        await prioritizeTasks()
        response = 'Tarefas ordenadas por prioridade no painel de pendências!'
      } else {
        response = 'Comando processado com sucesso pela Neuro IA.'
      }

      const assistantMessage: ChatMessage = { id: generateId(), role: 'assistant', content: response, timestamp: new Date() }
      setChatMessages((prev) => [...prev, assistantMessage])
      setIsChatLoading(false)
    },
    [validateAuthHeaders, prioritizeTasks, userTasks, doneTasks]
  )

  return (
    <NeuroTaskContext.Provider value={{
      isAuthenticated, authToken, userEmail, login, logout,
      tasks, pendingTasks, scheduledTasks, doneTasks, isLoading,
      addTask, deleteTask, scheduleTask, completeTask, prioritizeTasks,
      chatMessages, sendMessage, isChatLoading, currentView, setCurrentView
    }}>
      {children}
    </NeuroTaskContext.Provider>
  )
}

export function useNeuroTask() {
  const context = React.useContext(NeuroTaskContext)
  if (!context) throw new Error('useNeuroTask must be used within a NeuroTaskProvider')
  return context
}