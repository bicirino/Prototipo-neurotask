'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNeuroTask } from '@/components/neuro-task-provider'
import { TAG_CONFIG, type TaskTag } from '@/lib/store'
import { CheckCircle2, Clock, ListTodo, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  colorClass,
}: {
  title: string
  value: number
  description: string
  icon: React.ElementType
  colorClass: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('rounded-lg p-2', colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ProgressBar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0

  return (
    <div className="h-2 w-full rounded-full bg-secondary">
      <div
        className={cn('h-2 rounded-full transition-all duration-500', colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function TagBreakdown({ tasks }: { tasks: { tag: TaskTag; count: number }[] }) {
  const totalTasks = tasks.reduce((sum, t) => sum + t.count, 0)

  return (
    <div className="space-y-3">
      {tasks.map(({ tag, count }) => {
        const config = TAG_CONFIG[tag]
        const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0

        return (
          <div key={tag} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-xs border-0', config.bgColor, config.color)}>
                  {config.label}
                </Badge>
              </div>
              <span className="font-medium text-foreground">
                {count} ({percentage}%)
              </span>
            </div>
            <ProgressBar
              value={count}
              max={totalTasks}
              colorClass={
                tag === 'trabalho'
                  ? 'bg-blue-500'
                  : tag === 'estudos'
                  ? 'bg-emerald-500'
                  : tag === 'casa'
                  ? 'bg-amber-500'
                  : 'bg-violet-500'
              }
            />
          </div>
        )
      })}
    </div>
  )
}

export function DashboardView() {
  const { tasks, userEmail } = useNeuroTask()

  // 1. Obtém a string exata do dia de hoje local (YYYY-MM-DD)
  const todayStr = React.useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // 2. Filtra TODAS as tarefas que pertencem ao DIA DE HOJE
  const todaysTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      if (t.userEmail !== userEmail) return false
      
      // Se estiver agendada no calendário, valida se é hoje
      if (t.scheduledDate) {
        return t.scheduledDate === todayStr
      }
      
      // Se estiver apenas pendente, valida se foi criada hoje
      const createdAtDate = new Date(t.createdAt)
      const createdStr = `${createdAtDate.getFullYear()}-${String(createdAtDate.getMonth() + 1).padStart(2, '0')}-${String(createdAtDate.getDate()).padStart(2, '0')}`
      return createdStr === todayStr
    })
  }, [tasks, userEmail, todayStr])

  // 3. Divide as tarefas de hoje pelos estados reais
  const pendingTasksToday = React.useMemo(() => todaysTasks.filter((t) => t.status === 'PENDING'), [todaysTasks])
  const scheduledTasksToday = React.useMemo(() => todaysTasks.filter((t) => t.status === 'SCHEDULED'), [todaysTasks])
  const doneTasksToday = React.useMemo(() => todaysTasks.filter((t) => t.status === 'DONE'), [todaysTasks])

  // Métricas baseadas estritamente no dia
  const totalTasksToday = todaysTasks.length
  const completionRateToday = totalTasksToday > 0 ? Math.round((doneTasksToday.length / totalTasksToday) * 100) : 0

  // Distribuição por contexto das tarefas concluídas HOJE
  const tagBreakdownToday = React.useMemo(() => {
    const breakdown: Record<TaskTag, number> = {
      trabalho: 0,
      estudos: 0,
      casa: 0,
      familia: 0,
    }

    doneTasksToday.forEach((task) => {
      breakdown[task.tag]++
    })

    return Object.entries(breakdown)
      .map(([tag, count]) => ({ tag: tag as TaskTag, count }))
      .filter((item) => item.count > 0)
  }, [doneTasksToday])

  // Geração da Revisão Inteligente Diária e Global (Unificando todas as categorias)
  const dailyReview = React.useMemo(() => {
    const totalCompleted = doneTasksToday.length
    const totalPendingCasa = pendingTasksToday.filter((t) => t.tag === 'casa').length

    if (totalTasksToday === 0) {
      return 'Você não possui tarefas mapeadas ou agendadas para o dia de hoje. Monte sua grade no calendário para começar!'
    }

    if (totalCompleted === 0) {
      return 'Você ainda não concluiu nenhuma tarefa hoje. Que tal começar a executar suas atividades agendadas no calendário?'
    }

    let review = `Parabéns! Hoje você executou ${completionRateToday}% das suas tarefas do dia`

    if (totalPendingCasa > 0) {
      review += `, mas as tarefas de contexto "Casa" acumularam (${totalPendingCasa} pendentes). Sugerimos liberar blocos de 30 minutos na sua grade.`
    } else {
      review += '. Continue assim! Seu equilíbrio entre as diferentes áreas está excelente.'
    }

    return review
  }, [doneTasksToday, pendingTasksToday, totalTasksToday, completionRateToday])

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard de Métricas (Hoje)</h2>
        <p className="text-muted-foreground">Acompanhe seu progresso e desempenho diário</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pendentes de Hoje"
          value={pendingTasksToday.length}
          description="Aguardando alocação hoje"
          icon={ListTodo}
          colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          title="Agendadas para Hoje"
          value={scheduledTasksToday.length}
          description="Alocadas na grade horária"
          icon={Clock}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Concluídas Hoje"
          value={doneTasksToday.length}
          description="Tarefas finalizadas hoje"
          icon={CheckCircle2}
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Taxa de Conclusão Diária"
          value={completionRateToday}
          description="Porcentagem executada hoje"
          icon={TrendingUp}
          colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tag Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Distribuição por Contexto
            </CardTitle>
            <CardDescription>
              Tarefas concluídas hoje organizadas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tagBreakdownToday.length > 0 ? (
              <TagBreakdown tasks={tagBreakdownToday} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa concluída hoje.
                </p>
                <p className="text-xs text-muted-foreground">
                  Conclua tarefas na agenda para ver o gráfico.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Review Card */}
        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Revisão Diária Inteligente
            </CardTitle>
            <CardDescription>
              Análise de desempenho gerada pela Neuro IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
              <p className="text-sm leading-relaxed text-violet-900 dark:text-violet-100">
                {dailyReview}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Progresso Geral do Dia</CardTitle>
          <CardDescription>
            {doneTasksToday.length} de {totalTasksToday} tarefas concluídas hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">{completionRateToday}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${completionRateToday}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}