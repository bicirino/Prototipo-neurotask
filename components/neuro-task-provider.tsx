'use client'

import * as React from 'react'
import {
  Task,
  TaskTag,
  ChatMessage,
  INITIAL_TASKS,
  generateId,
  simulateApiDelay,
  AI_COMMANDS,
  TAG_CONFIG,
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
  addTask: (task: Omit<Task, 'id' | 'status' | 'createdAt'>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  scheduleTask: (taskId: string, time: string) => Promise<{ success: boolean; error?: string }>
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

  // Login function
  const login = React.useCallback(async (email: string) => {
    const token = `X-Auth-Token-STABLE-${Date.now().toString(36).toUpperCase()}`
    setUserEmail(email)
    setAuthToken(token)
    setIsAuthenticated(true)
  }, [])

  // Logout function
  const logout = React.useCallback(() => {
    setIsAuthenticated(false)
    setAuthToken(null)
    setUserEmail(null)
  }, [])

  // RN01 & RP03 - Simulando estritamente a validação Stateless via Cabeçalho X-Auth-Token
  const validateAuthHeaders = React.useCallback(() => {
    if (!isAuthenticated || !authToken) {
      throw new Error("Acesso Negado: RN01 - Token de autenticação ausente ou inválido no cabeçalho HTTP (X-Auth-Token).")
    }
    // Simulando a montagem real do Request Header exigida no documento de requisitos
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-Token': authToken
    }
    return headers
  }, [isAuthenticated, authToken])

  // Derived states
  const pendingTasks = React.useMemo(() => tasks.filter((t) => t.status === 'PENDING'), [tasks])
  const scheduledTasks = React.useMemo(() => tasks.filter((t) => t.status === 'SCHEDULED'), [tasks])
  const doneTasks = React.useMemo(() => tasks.filter((t) => t.status === 'DONE'), [tasks])

  // Add new task
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
        userEmail: userEmail || undefined, // <-- Vincula a tarefa à conta ativa
      }
      setTasks((prev) => [...prev, newTask])
      setIsLoading(false)
    },
    [validateAuthHeaders, userEmail]
  )

  // Delete task
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

  // Schedule task with conflict validation
  const scheduleTask = React.useCallback(
    async (taskId: string, time: string): Promise<{ success: boolean; error?: string }> => {
      validateAuthHeaders()
      setIsLoading(true)

      await simulateApiDelay(null)

      // Validação Restritiva de conflitos (H05 / Critério de Aceite 3)
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
    [validateAuthHeaders, tasks]
  )

  // Complete task
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

  // Prioritize tasks (simulated AI)
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

  // Process chat message
  const sendMessage = React.useCallback(
    async (content: string) => {
      validateAuthHeaders()

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

      // RN03 / H13 - Implementando a Revisão Semanal baseada em dados reais do MVP
      if (lowerContent.includes('revisão') || lowerContent.includes('relatório')) {
        const total = tasks.length
        const concluidas = doneTasks.length
        const pendentes = pendingTasks.length + scheduledTasks.length
        const taxaAproveitamento = total > 0 ? Math.round((concluidas / total) * 100) : 0

        response = `📊 **Neuro IA - Revisão Semanal Inteligente** 📊\n\nCom base nos dados reais coletados de sua sessão nesta semana, analisei seu fluxo operacional:\n\n• **Total de demandas monitoradas:** ${total}\n• **Tarefas Executadas (DONE):** ${concluidas}\n• **Demandas Pendentes/Agendadas:** ${pendentes}\n\n🎯 **Sua taxa de conversão em Time-Blocking é de ${taxaAproveitamento}%**. \n\n*Insight da IA:* ${
          taxaAproveitamento >= 70 
            ? 'Excelente desempenho! Você está convertendo a maioria das pendências para o calendário visual, o que reduz drasticamente a ansiedade operacional.' 
            : 'Identifiquei gargalos de agendamento. Tente fragmentar tarefas grandes (use o comando "Decompor [tarefa]") e arrastá-las para os blocos vazios no início do seu dia.'
        }`
      }
      else if (lowerContent.includes('priorizar')) {
        await prioritizeTasks()
        response = 'As tarefas foram reordenadas por prioridade no seu painel de pendências!'  
      } 
      else if (
        lowerContent.includes('adicionar') ||
        lowerContent.includes('criar tarefa') ||
        lowerContent.includes('nova tarefa')
      ) {
        const cleaned = content
          .replace(/adicionar/i, '')
          .replace(/criar tarefa/i, '')
          .replace(/nova tarefa/i, '')
          .trim()

        const parts = cleaned.split(' - ')
        let taskTitle = cleaned
        let taskTag: TaskTag = 'trabalho'

        if (parts.length >= 2) {
          taskTitle = parts.slice(0, -1).join(' - ').trim()
          const tagText = parts[parts.length - 1].toLowerCase().trim()

          if (tagText.includes('trabalho')) taskTag = 'trabalho'
          else if (tagText.includes('estudo')) taskTag = 'estudos'
          else if (tagText.includes('casa')) taskTag = 'casa'
          else if (tagText.includes('famil') || tagText.includes('bebe')) taskTag = 'familia'
        }

        if (taskTitle) {
          const newTask: Task = {
            id: generateId(),
            title: taskTitle,
            tag: taskTag,
            status: 'PENDING',
            createdAt: new Date(),
          }
          setTasks((prev) => [...prev, newTask])
          response = `Tarefa "${taskTitle}" adicionada com sucesso na categoria **${TAG_CONFIG[taskTag].label}**! Acesse a aba Calendário para alocá-la.`
        } else {
          response = 'Não consegui identificar o título da tarefa. Tente o formato padrão: "Adicionar Estudar Cálculo - Estudos".'
        }
      } 
      else if (lowerContent.includes('decompor')) {
        const topic = lowerContent.replace('decompor', '').trim() || 'projeto'
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

        response = `🤖 **Decomposição Inteligente Concluída!** Quebrei a atividade complexa "${topic}" em ${newTasks.length} sub-tarefas estratégicas na categoria Trabalho. Elas já estão prontas no seu painel de Pendentes para sofrerem Time-Blocking.`
      } 
      else {
        response = 'Olá! Sou o assistente inteligente da NeuroTask. Aqui estão os comandos válidos para auditar os requisitos de IA:\n\n• `"Adicionar [Título] - [Categoria]"` - Cria uma nova tarefa com Tags.\n• `"Priorizar"` - Reordena o CRUD de tarefas por urgência de tags.\n• `"Decompor [Nome de um Projeto]"` - Quebra uma grande tarefa em micro-tarefas.\n• `"Revisão"` - Dispara a Revisão Semanal Inteligente cruzando suas métricas atuais.'
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
    [validateAuthHeaders, prioritizeTasks, tasks, doneTasks, pendingTasks, scheduledTasks]
  )

  const value: NeuroTaskContextType = {
    isAuthenticated,
    authToken,
    userEmail,
    login,
    logout,
    tasks,
    pendingTasks,
    scheduledTasks,
    doneTasks,
    isLoading,
    addTask,
    deleteTask,
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