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

      // 1. Detecta comandos para ADICIONAR ou CRIAR tarefas
      if (lowerContent.startsWith('adicionar') || lowerContent.startsWith('criar') || lowerContent.includes('adicione')) {
        // Remove palavras de comando para tentar isolar o título da tarefa
        let taskTitle = content
          .replace(/adicione uma tarefa/i, '')
          .replace(/adicionar tarefa/i, '')
          .replace(/criar tarefa/i, '')
          .replace(/adicione/i, '')
          .replace(/adicionar/i, '')
          .replace(/criar/i, '')
          .trim()

        // Garante que a primeira letra fique maiúscula
        if (taskTitle) {
          taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1)
        }

        if (!taskTitle) {
          response = 'Qual o título ou descrição da tarefa que você deseja criar?'
        } else {
          // Tenta descobrir a tag pelo contexto do texto, se não achar usa 'trabalho' como padrão
          let detectedTag: TaskTag = 'trabalho'
          if (lowerContent.includes('casa') || lowerContent.includes('limpar') || lowerContent.includes('comprar')) {
            detectedTag = 'casa'
          } else if (lowerContent.includes('estudar') || lowerContent.includes('curso') || lowerContent.includes('aula') || lowerContent.includes('estudos')) {
            detectedTag = 'estudos'
          } else if (lowerContent.includes('familia') || lowerContent.includes('filho') || lowerContent.includes('mãe') || lowerContent.includes('pai')) {
            detectedTag = 'familia'
          }

          // CHAMA A FUNÇÃO REAL QUE INSERE NO ESTADO DA APLICAÇÃO
          await addTask({
            title: taskTitle,
            tag: detectedTag,
          })

          response = `✅ **Tarefa adicionada com sucesso!**\n\n📝 *"${taskTitle}"* foi incluída na sua lista de pendências sob a categoria **${detectedTag.toUpperCase()}**.`
        }

      } else if (lowerContent.includes('revisão') || lowerContent.includes('relatório') || lowerContent.includes('estatística')) {
        // Estatísticas do dia atual (Mantendo o ajuste estrito de HOJE que fizemos antes)
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`

        const todaysTasks = userTasks.filter((t) => {
          if (t.scheduledDate) return t.scheduledDate === todayStr
          const taskCreatedAtStr = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}-${String(t.createdAt.getDate()).padStart(2, '0')}`
          return taskCreatedAtStr === todayStr
        })

        const totalHoje = todaysTasks.length
        const concluidasHoje = todaysTasks.filter((t) => t.status === 'DONE').length
        const taxaAproveitamento = totalHoje > 0 ? Math.round((concluidasHoje / totalHoje) * 100) : 0

        response = `📊 **Neuro IA - Estatísticas de Hoje** 📊\n\n• Mapeadas para hoje: ${totalHoje}\n• Concluídas: ${concluidasHoje}\n🎯 Foco e Produtividade do Dia: ${taxaAproveitamento}%.`
      
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
    [validateAuthHeaders, prioritizeTasks, userTasks, addTask] // Adicionado addTask nas dependências
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