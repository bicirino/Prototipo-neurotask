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
  const { tasks, pendingTasks, scheduledTasks, doneTasks } = useNeuroTask()

  // Calculate stats
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0

  // Calculate tag breakdown for done tasks
  const tagBreakdown = React.useMemo(() => {
    const breakdown: Record<TaskTag, number> = {
      trabalho: 0,
      estudos: 0,
      casa: 0,
      familia: 0,
    }

    doneTasks.forEach((task) => {
      breakdown[task.tag]++
    })

    return Object.entries(breakdown)
      .map(([tag, count]) => ({ tag: tag as TaskTag, count }))
      .filter((item) => item.count > 0)
  }, [doneTasks])

  // Generate AI weekly review (mocked)
  const weeklyReview = React.useMemo(() => {
    const trabalhoCompleted = doneTasks.filter((t) => t.tag === 'trabalho').length
    const casaPending = pendingTasks.filter((t) => t.tag === 'casa').length
    const totalCompleted = doneTasks.length

    if (totalCompleted === 0) {
      return 'Você ainda não concluiu nenhuma tarefa esta semana. Que tal começar alocando algumas tarefas no calendário? Pequenos passos levam a grandes conquistas! 🚀'
    }

    const trabalhoPercentage = totalCompleted > 0 ? Math.round((trabalhoCompleted / totalCompleted) * 100) : 0

    let review = `Parabéns, Micheli! Esta semana você executou ${trabalhoPercentage}% das suas tarefas de Trabalho`

    if (casaPending > 0) {
      review += `, mas as tarefas de contexto "Casa" acumularam (${casaPending} pendentes). Sugerimos liberar blocos de 30 minutos na sua próxima manhã.`
    } else {
      review += '. Continue assim! Seu equilíbrio entre as diferentes áreas está excelente.'
    }

    return review
  }, [doneTasks, pendingTasks])

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Dashboard de Métricas</h2>
        <p className="text-muted-foreground">Acompanhe seu progresso e desempenho</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pendentes"
          value={pendingTasks.length}
          description="Tarefas aguardando alocação"
          icon={ListTodo}
          colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatCard
          title="Agendadas"
          value={scheduledTasks.length}
          description="Tarefas alocadas no calendário"
          icon={Clock}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Concluídas"
          value={doneTasks.length}
          description="Tarefas finalizadas"
          icon={CheckCircle2}
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Taxa de Conclusão"
          value={completionRate}
          description="Porcentagem de tarefas feitas"
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
              Tarefas concluídas organizadas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tagBreakdown.length > 0 ? (
              <TagBreakdown tasks={tagBreakdown} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa concluída ainda.
                </p>
                <p className="text-xs text-muted-foreground">
                  Conclua tarefas para ver as estatísticas aqui.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Weekly Review */}
        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Revisão Semanal Inteligente
            </CardTitle>
            <CardDescription>
              Análise de desempenho gerada pela Neuro IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-violet-50 p-4 dark:bg-violet-900/20">
              <p className="text-sm leading-relaxed text-violet-900 dark:text-violet-100">
                {weeklyReview}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Progresso Geral</CardTitle>
          <CardDescription>
            {doneTasks.length} de {totalTasks} tarefas concluídas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">{completionRate}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
