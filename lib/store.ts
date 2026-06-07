// Types
export type TaskStatus = 'PENDING' | 'SCHEDULED' | 'DONE'
export type TaskTag = 'trabalho' | 'estudos' | 'casa' | 'familia'

// Garanta que a interface Task tenha o campo do usuário dono:
export interface Task {
  id: string
  title: string
  tag: TaskTag
  status: 'PENDING' | 'SCHEDULED' | 'DONE'
  createdAt: Date
  userEmail?: string // <-- Adicione esta linha para sabermos de quem é a tarefa
  scheduledTime?: string
  scheduledDate?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Tag colors configuration
export const TAG_CONFIG: Record<TaskTag, { label: string; color: string; bgColor: string; borderColor: string }> = {
  trabalho: {
    label: 'Trabalho',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  estudos: {
    label: 'Estudos',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
  },
  casa: {
    label: 'Casa',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/50',
    borderColor: 'border-amber-300 dark:border-amber-700',
  },
  familia: {
    label: 'Outros',
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-900/50',
    borderColor: 'border-violet-300 dark:border-violet-700',
  },
}

// Time slots for the schedule (08:00 - 22:00)
export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
]

export const INITIAL_TASKS: Task[] = []

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function simulateApiDelay<T>(data: T, delayMs: number = 1000): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs)
  })
}

export const AI_COMMANDS = {
  decompor: (topic: string): Partial<Task>[] => {
    const decompositions: Record<string, Partial<Task>[]> = {
      tcc: [
        { title: 'Pesquisar referências bibliográficas', tag: 'estudos' },
        { title: 'Elaborar estrutura do documento', tag: 'estudos' },
        { title: 'Escrever introdução', tag: 'estudos' },
        { title: 'Formatar segundo ABNT', tag: 'estudos' },
        { title: 'Revisar e corrigir erros', tag: 'estudos' },
      ],
      projeto: [
        { title: 'Definir escopo do projeto', tag: 'trabalho' },
        { title: 'Criar cronograma de entregas', tag: 'trabalho' },
        { title: 'Levantar requisitos', tag: 'trabalho' },
        { title: 'Desenvolver protótipo inicial', tag: 'trabalho' },
      ],
      default: [
        { title: 'Etapa 1: Planejamento', tag: 'trabalho' },
        { title: 'Etapa 2: Execução', tag: 'trabalho' },
        { title: 'Etapa 3: Revisão', tag: 'trabalho' },
      ],
    }
    const key = topic.toLowerCase()
    return decompositions[key] || decompositions.default
  },
}
