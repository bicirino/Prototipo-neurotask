'use client'

import * as React from 'react'
import { Check, Clock, GripVertical, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useNeuroTask } from '@/components/neuro-task-provider'
import { TAG_CONFIG, TIME_SLOTS, type Task } from '@/lib/store'
import { cn } from '@/lib/utils'

function TaskCard({
  task,
  onAllocate,
  showAllocateButton = true,
}: {
  task: Task
  onAllocate?: (task: Task) => void
  showAllocateButton?: boolean
}) {
  const { completeTask, isLoading } = useNeuroTask()
  const tagConfig = TAG_CONFIG[task.tag]
  const isDone = task.status === 'DONE'

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        tagConfig.borderColor,
        isDone && 'opacity-60'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 cursor-grab text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'font-medium text-sm text-foreground',
                isDone && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className={cn('text-xs', tagConfig.bgColor, tagConfig.color, 'border-0')}>
                {tagConfig.label}
              </Badge>
              {task.scheduledTime && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {task.scheduledTime}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {showAllocateButton && task.status === 'PENDING' && onAllocate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAllocate(task)}
                className="text-xs h-7"
              >
                Alocar
              </Button>
            )}
            {task.status === 'SCHEDULED' && (
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => completeTask(task.id)}
                disabled={isLoading}
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">Concluir tarefa</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimeSlot({
  time,
  task,
  onSelect,
  isSelecting,
}: {
  time: string
  task?: Task
  onSelect: (time: string) => void
  isSelecting: boolean
}) {
  const tagConfig = task ? TAG_CONFIG[task.tag] : null
  const { completeTask, isLoading } = useNeuroTask()

  return (
    <div className="group flex gap-3 py-1">
      <div className="w-14 flex-shrink-0 text-right text-sm font-medium text-muted-foreground pt-2">
        {time}
      </div>
      <div
        className={cn(
          'flex-1 min-h-[60px] rounded-lg border-2 border-dashed transition-all',
          task
            ? cn(
                'border-solid',
                tagConfig?.borderColor,
                tagConfig?.bgColor
              )
            : cn(
                'border-border',
                isSelecting && 'cursor-pointer hover:border-primary hover:bg-accent/50'
              )
        )}
        onClick={() => !task && isSelecting && onSelect(time)}
        role={isSelecting && !task ? 'button' : undefined}
        tabIndex={isSelecting && !task ? 0 : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !task && isSelecting) {
            onSelect(time)
          }
        }}
      >
        {task ? (
          <div className="flex items-center justify-between p-3">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-medium text-sm',
                  tagConfig?.color,
                  task.status === 'DONE' && 'line-through opacity-70'
                )}
              >
                {task.title}
              </p>
              <Badge
                className={cn('mt-1 text-xs border-0', tagConfig?.bgColor, tagConfig?.color)}
              >
                {tagConfig?.label}
              </Badge>
            </div>
            {task.status === 'SCHEDULED' && (
              <Button
                size="icon-sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  completeTask(task.id)
                }}
                disabled={isLoading}
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span className="sr-only">Concluir tarefa</span>
              </Button>
            )}
            {task.status === 'DONE' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>
        ) : (
          isSelecting && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-3">
              Clique para alocar aqui
            </div>
          )
        )}
      </div>
    </div>
  )
}

export function CalendarView() {
  const { pendingTasks, scheduledTasks, doneTasks, scheduleTask, isLoading } = useNeuroTask()
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [isSelecting, setIsSelecting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Combine scheduled and done tasks for the schedule view
  const tasksInSchedule = React.useMemo(() => {
    return [...scheduledTasks, ...doneTasks.filter((t) => t.scheduledTime)]
  }, [scheduledTasks, doneTasks])

  const handleAllocate = (task: Task) => {
    setSelectedTask(task)
    setIsSelecting(true)
    setError(null)
  }

  const handleSelectTime = async (time: string) => {
    if (!selectedTask) return

    const result = await scheduleTask(selectedTask.id, time)

    if (!result.success && result.error) {
      setError(result.error)
    } else {
      setSelectedTask(null)
      setIsSelecting(false)
    }
  }

  const handleCloseDialog = () => {
    setSelectedTask(null)
    setIsSelecting(false)
    setError(null)
  }

  const getTaskForTime = (time: string): Task | undefined => {
    return tasksInSchedule.find((t) => t.scheduledTime === time)
  }

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Left Column - Pending Tasks */}
      <div className="w-80 flex-shrink-0">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Tarefas Pendentes</h2>
          <p className="text-sm text-muted-foreground">
            {pendingTasks.length} {pendingTasks.length === 1 ? 'tarefa' : 'tarefas'} para alocar
          </p>
        </div>
        <div className="space-y-3">
          {pendingTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Check className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma tarefa pendente!
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onAllocate={handleAllocate}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Column - Schedule */}
      <div className="flex-1 overflow-hidden">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Grade Horária do Dia</h2>
          <p className="text-sm text-muted-foreground">
            {isSelecting && selectedTask
              ? `Selecione um horário para "${selectedTask.title}"`
              : 'Visualize e gerencie sua agenda'}
          </p>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto pr-2">
          <div className="space-y-1">
            {TIME_SLOTS.map((time) => (
              <TimeSlot
                key={time}
                time={time}
                task={getTaskForTime(time)}
                onSelect={handleSelectTime}
                isSelecting={isSelecting}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erro ao Alocar
            </DialogTitle>
            <DialogDescription className="text-base text-destructive-foreground dark:text-red-300">
              {error}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setError(null)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Selection Dialog */}
      {isSelecting && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="border-primary shadow-lg">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="text-sm">
                <span className="font-medium">Alocando: </span>
                <span className="text-muted-foreground">{selectedTask?.title}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleCloseDialog} disabled={isLoading}>
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
