'use client'

import * as React from 'react'
import { Check, Clock, GripVertical, AlertCircle, Loader2, Plus, X, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNeuroTask } from '@/components/neuro-task-provider'
import { TAG_CONFIG, TIME_SLOTS, type Task, type TaskTag } from '@/lib/store'
import { cn } from '@/lib/utils'

// Força a data local padrão do sistema sem problemas de timezone do ISOString
function getFormattedDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function TaskCard({ task }: { task: Task }) {
  const { deleteTask, isLoading } = useNeuroTask()
  const tagConfig = TAG_CONFIG[task.tag]

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Card
      draggable={task.status === 'PENDING'}
      onDragStart={handleDragStart}
      className={cn(
        'transition-all shadow-sm active:scale-95',
        task.status === 'PENDING' ? 'cursor-grab hover:border-primary' : '',
        tagConfig.borderColor,
        task.status === 'DONE' && 'opacity-60'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {task.status === 'PENDING' && (
            <div className="mt-0.5 text-muted-foreground cursor-grab">
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={cn('font-medium text-sm text-foreground', task.status === 'DONE' && 'line-through text-muted-foreground')}>
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
          {task.status === 'PENDING' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteTask(task.id)}
              disabled={isLoading}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AddTaskForm({ onClose }: { onClose: () => void }) {
  const { addTask, isLoading } = useNeuroTask()
  const [title, setTitle] = React.useState('')
  const [tag, setTag] = React.useState<TaskTag>('trabalho')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await addTask({ title: title.trim(), tag })
    setTitle('')
    onClose()
  }

  return (
    <Card className="border-primary">
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Nova Tarefa</span>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da tarefa..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TAG_CONFIG) as TaskTag[]).map((tagKey) => {
              const config = TAG_CONFIG[tagKey]
              return (
                <button
                  key={tagKey}
                  type="button"
                  onClick={() => setTag(tagKey)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                    config.bgColor,
                    config.color,
                    tag === tagKey ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-60'
                  )}
                >
                  {config.label}
                </button>
              )
            })}
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={!title.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function TimeSlot({ time, task, onDropTask }: { time: string; task?: Task; onDropTask: (taskId: string, time: string) => void }) {
  const tagConfig = task ? TAG_CONFIG[task.tag] : null
  const { completeTask, isLoading } = useNeuroTask()
  const [isDragOver, setIsDragOver] = React.useState(false)

  return (
    <div className="flex gap-3 py-1">
      <div className="w-14 text-right text-sm font-medium text-muted-foreground pt-3">{time}</div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!task) setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          const taskId = e.dataTransfer.getData('text/plain')
          if (taskId) onDropTask(taskId, time)
        }}
        className={cn(
          'flex-1 min-h-[65px] rounded-lg border-2 border-dashed transition-all p-2 flex items-center justify-between',
          task ? cn('border-solid bg-card', tagConfig?.borderColor, tagConfig?.bgColor) : cn('border-border text-muted-foreground/40 text-xs justify-center font-light', isDragOver && 'border-primary bg-primary/10 text-primary')
        )}
      >
        {task ? (
          <>
            <div className="flex-1 min-w-0">
              <p className={cn('font-medium text-sm', tagConfig?.color, task.status === 'DONE' && 'line-through opacity-60')}>
                {task.title}
              </p>
              <Badge className={cn('mt-1 text-[10px] border-0 h-5', tagConfig?.bgColor, tagConfig?.color)}>
                {tagConfig?.label}
              </Badge>
            </div>
            <div>
              {task.status === 'SCHEDULED' && (
                <Button size="sm" variant="outline" onClick={() => completeTask(task.id)} disabled={isLoading} className="h-8 w-8 p-0 text-emerald-600">
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {task.status === 'DONE' && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
              )}
            </div>
          </>
        ) : (
          <span>Solte uma tarefa aqui (Time-Blocking)</span>
        )}
      </div>
    </div>
  )
}

export function CalendarView() {
  const { pendingTasks, scheduledTasks, doneTasks, scheduleTask } = useNeuroTask()
  const [error, setError] = React.useState<string | null>(null)
  const [showAddForm, setShowAddForm] = React.useState(false)
  
  const [selectedDate, setSelectedDate] = React.useState<string>(() => getFormattedDate(new Date()))

  // Filtro normalizado
  const currentDayTasks = React.useMemo(() => {
    const combined = [...scheduledTasks, ...doneTasks.filter((t) => t.scheduledTime)]
    return combined.filter((t) => t.scheduledDate === selectedDate)
  }, [scheduledTasks, doneTasks, selectedDate])

  const handleDropTask = React.useCallback(async (taskId: string, time: string) => {
    setError(null)
    
    // Forçamos o TypeScript a aceitar os 3 argumentos usando uma asserção de tipo ('as any')
    const forceSchedule = scheduleTask as any
    const result = await forceSchedule(taskId, time, selectedDate)
    
    if (result && !result.success && result.error) {
      setError(result.error)
    }
  }, [scheduleTask, selectedDate])

  const setPresetDate = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    setSelectedDate(getFormattedDate(d))
  }

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Coluna Esquerda */}
      <div className="w-80 flex-shrink-0 flex flex-col h-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tarefas Pendentes</h2>
            <p className="text-sm text-muted-foreground">{pendingTasks.length} pendentes para arrastar</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {showAddForm && <AddTaskForm onClose={() => setShowAddForm(false)} />}
          {pendingTasks.length === 0 ? (
            <Card className="border-dashed py-8 text-center text-muted-foreground text-sm">
              <CardContent className="flex flex-col items-center justify-center p-4">
                <Check className="h-8 w-8 mb-2 text-muted-foreground/40" />
                Nenhuma pendência.
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>

      {/* Coluna Direita */}
      <div className="flex-1 flex flex-col h-full">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Grade Horária do Dia</h2>
            <p className="text-sm text-muted-foreground">Arrastar e Soltar ativo para mapeamento visual</p>
          </div>
          
          <div className="flex items-center gap-2 bg-secondary p-1 rounded-md border">
            <Button
              variant={selectedDate === getFormattedDate(new Date()) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPresetDate(0)}
              className="text-xs h-8"
            >
              Hoje
            </Button>
            <Button
              variant={selectedDate === getFormattedDate(new Date(Date.now() + 86400000)) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPresetDate(1)}
              className="text-xs h-8"
            >
              Amanhã
            </Button>
            <div className="flex items-center gap-1 pl-2 border-l border-muted-foreground/20">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value) }}
                className="bg-transparent border-0 text-xs font-medium focus:outline-none focus:ring-0 text-foreground cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-1">
          {TIME_SLOTS.map((time) => (
            <TimeSlot
              key={time}
              time={time}
              task={currentDayTasks.find((t) => t.scheduledTime === time)}
              onDropTask={handleDropTask}
            />
          ))}
        </div>
      </div>

      {/* Dialog de Erro */}
      <Dialog open={!!error} onOpenChange={() => setError(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Bloqueio de Validação
            </DialogTitle>
            <DialogDescription className="text-base font-medium py-2 text-foreground">
              {error}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setError(null)}>Fechar Alerta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}