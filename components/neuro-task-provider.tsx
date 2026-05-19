'use client'

import * as React from 'react'
import {
  Task,
  ChatMessage,
  INITIAL_TASKS,
  generateId,
  simulateApiDelay,
  AI_COMMANDS,
} from '@/lib/store'

interface NeuroTaskContextType {
  // Auth
  isAuthenticated: boolean
  authToken: string

  // Tasks
  tasks: Task[]
  pendingTasks: Task[]
  scheduledTasks: Task[]
  doneTasks: Task[]
  isLoading: boolean

  // Actions
  addTask: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => Promise<void>
  scheduleTask: (taskId: string, time: string) => Promise<{ success: boolean; error?: string }>
  completeTask: (taskId: string) => Promise<void>
  prioritizeTasks: () => Promise<void>

  // Chat
  chatMessages: ChatMessage[]
  sendMessage: (content: string) => Promise<void>
  isChatLoading: boolean

  // Navigation
  currentView: 'calendar' | 'dashboard' | 'chat'
  setCurrentView: (view: 'calendar' | 'dashboard' | 'chat') => void
}

const NeuroTaskContext = React.createContext<NeuroTaskContextType | undefined>(undefined)

export function NeuroTaskProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated] = React.useState(true)
  const [authToken] = React.useState('X-Auth-Token-Ativo')
  const [tasks, setTasks] = React.useState<Task[]>(INITIAL_TASKS)
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou a Neuro IA 🧠. Posso ajudar você a organizar suas tarefas. Experimente comandos como "Decompor TCC" ou "Priorizar".',
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isChatLoading, setIsChatLoading] = React.useState(false)
  const [currentView, setCurrentView] = React.useState<'calendar' | 'dashboard' | 'chat'>('calendar')

  // Validate token before any action
  const validateAuth = React.useCallback(() => {
    if (!isAuthenticated || !authToken) {
      throw new Error('Usuário não autenticado')
    }
    return true
  }, [isAuthenticated, authToken])

  // Derived states
  const pendingTasks = React.useMemo(() => tasks.filter((t) => t.status === 'PENDING'), [tasks])
  const scheduledTasks = React.useMemo(() => tasks.filter((t) => t.status === 'SCHEDULED'), [tasks])
  const doneTasks = React.useMemo(() => tasks.filter((t) => t.status === 'DONE'), [tasks])

  // Add new task
  const addTask = React.useCallback(
    async (taskData: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
      validateAuth()
      setIsLoading(true)

      await simulateApiDelay(null)

      const newTask: Task = {
        ...taskData,
        id: generateId(),
        status: 'PENDING',
        createdAt: new Date(),
      }

      setTasks((prev) => [...prev, newTask])
      setIsLoading(false)
    },
    [validateAuth]
  )

  // Schedule task with conflict validation
  const scheduleTask = React.useCallback(
    async (taskId: string, time: string): Promise<{ success: boolean; error?: string }> => {
      validateAuth()
      setIsLoading(true)

      await simulateApiDelay(null)

      // Check for conflicts
      const existingTask = tasks.find((t) => t.scheduledTime === time && t.status === 'SCHEDULED')
      if (existingTask) {
        setIsLoading(false)
        return {
          success: false,
          error: 'Conflito de Agenda: Você já possui uma atividade planejada para este horário.',
        }
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: 'SCHEDULED' as const, scheduledTime: time } : t
        )
      )

      setIsLoading(false)
      return { success: true }
    },
    [validateAuth, tasks]
  )

  // Complete task
  const completeTask = React.useCallback(
    async (taskId: string) => {
      validateAuth()
      setIsLoading(true)

      await simulateApiDelay(null)

      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'DONE' as const } : t)))

      setIsLoading(false)
    },
    [validateAuth]
  )

  // Prioritize tasks (simulated AI)
  const prioritizeTasks = React.useCallback(async () => {
    validateAuth()
    setIsLoading(true)

    await simulateApiDelay(null)

    // Sort by tag priority: trabalho > estudos > familia > casa
    const priorityOrder = { trabalho: 1, estudos: 2, familia: 3, casa: 4 }

    setTasks((prev) => {
      const pending = prev.filter((t) => t.status === 'PENDING')
      const others = prev.filter((t) => t.status !== 'PENDING')
      const sorted = [...pending].sort((a, b) => priorityOrder[a.tag] - priorityOrder[b.tag])
      return [...sorted, ...others]
    })

    setIsLoading(false)
  }, [validateAuth])

  // Process chat message
  const sendMessage = React.useCallback(
    async (content: string) => {
      validateAuth()

      // Add user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, userMessage])
      setIsChatLoading(true)

      await simulateApiDelay(null)

      const lowerContent = content.toLowerCase()
      let response = ''

      // Process commands
      if (lowerContent.includes('decompor')) {
        const topic = lowerContent.replace('decompor', '').trim() || 'default'
        const newTasks = AI_COMMANDS.decompor(topic)

        for (const taskData of newTasks) {
          const newTask: Task = {
            id: generateId(),
            title: taskData.title || '',
            tag: taskData.tag || 'trabalho',
            status: 'PENDING',
            createdAt: new Date(),
          }
          setTasks((prev) => [...prev, newTask])
        }

        response = `Pronto! Decomponho "${topic}" em ${newTasks.length} micro-tarefas para você. Elas foram adicionadas ao seu banco de tarefas pendentes. Isso vai ajudar a reduzir a paralisia por análise! 💪`
      } else if (lowerContent.includes('priorizar')) {
        await prioritizeTasks()
        response =
          'As tarefas foram reordenadas por prioridade! Trabalho vem primeiro, seguido de Estudos, Família e Casa. Foque no que é mais urgente! 🎯'
      } else {
        response =
          'Entendi! Posso ajudar com os seguintes comandos:\n\n• "Decompor [tarefa]" - Quebro uma tarefa grande em micro-tarefas\n• "Priorizar" - Reordeno suas tarefas por urgência\n\nComo posso ajudar?'
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, assistantMessage])
      setIsChatLoading(false)
    },
    [validateAuth, prioritizeTasks]
  )

  const value: NeuroTaskContextType = {
    isAuthenticated,
    authToken,
    tasks,
    pendingTasks,
    scheduledTasks,
    doneTasks,
    isLoading,
    addTask,
    scheduleTask,
    completeTask,
    prioritizeTasks,
    chatMessages,
    sendMessage,
    isChatLoading,
    currentView,
    setCurrentView,
  }

  return <NeuroTaskContext.Provider value={value}>{children}</NeuroTaskContext.Provider>
}

export function useNeuroTask() {
  const context = React.useContext(NeuroTaskContext)
  if (!context) {
    throw new Error('useNeuroTask must be used within a NeuroTaskProvider')
  }
  return context
}
