'use client'

import * as React from 'react'
import { Send, Mic, Bot, User, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNeuroTask } from '@/components/neuro-task-provider'
import { cn } from '@/lib/utils'

export function ChatView() {
  const { chatMessages, sendMessage, isChatLoading } = useNeuroTask()
  const [input, setInput] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isChatLoading) return

    const message = input.trim()
    setInput('')
    await sendMessage(message)
    inputRef.current?.focus()
  }

  const handleMicClick = () => {
    // Simulated voice input - in production this would use Web Speech API
    const simulatedVoice = 'Decompor TCC'
    setInput(simulatedVoice)
  }

  const suggestedCommands = [
    { label: 'Decompor TCC', description: 'Quebra o TCC em micro-tarefas' },
    { label: 'Decompor Projeto', description: 'Divide um projeto em etapas' },
    { label: 'Priorizar', description: 'Reordena tarefas por urgência' },
    { label: 'Adicionar tarefa - Trabalho', description: 'Cria uma nova tarefa' },
  ]

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Neuro IA Chat</h2>
        <p className="text-sm text-muted-foreground">
          Converse com a IA para gerenciar suas tarefas
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border border-border bg-card/50 p-4"
      >
        <div className="space-y-4">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
              )}
              <Card
                className={cn(
                  'max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                )}
              >
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      'mt-1 text-xs',
                      message.role === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </CardContent>
              </Card>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isChatLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
                <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <Card className="bg-card">
                <CardContent className="flex items-center gap-2 p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Quick Commands */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Comandos Sugeridos:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedCommands.map((cmd) => (
            <Button
              key={cmd.label}
              variant="outline"
              size="sm"
              onClick={() => setInput(cmd.label)}
              className="text-xs"
            >
              {cmd.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite um comando ou mensagem..."
              disabled={isChatLoading}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleMicClick}
              disabled={isChatLoading}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Mic className="h-4 w-4" />
              <span className="sr-only">Entrada de voz (simulada)</span>
            </Button>
          </div>
          <Button type="submit" disabled={!input.trim() || isChatLoading}>
            {isChatLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Enviar mensagem</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
