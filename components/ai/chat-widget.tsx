'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  Calendar,
  ChevronDown,
  Clock,
  CookingPot,
  CornerDownLeft,
  Flame,
  MessageSquare,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { useSchedule } from '@/components/schedule-provider'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string
}

const quickPrompts = [
  { icon: Calendar, label: "What's my next class?", prompt: "What is my next class today and which room is it in?" },
  { icon: Clock, label: 'Wake-up alarm advice', prompt: 'When should I set my alarm for tomorrow based on my class schedule?' },
  { icon: CookingPot, label: 'Dorm microwave meal', prompt: 'Suggest a quick 5-minute dorm microwave meal I can make between classes.' },
  { icon: Flame, label: 'Workload summary', prompt: 'Summarize my upcoming exams and deadlines for this week.' },
]

export function DormosaurAiChat() {
  const { classes, alarms, profile, deadlines } = useSchedule()
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey ${profile.name || 'there'}! 👋 I'm Dormosaur AI (powered by Llama 3).\n\nI have live access to your ${classes.length} classes, ${alarms.length} alarms, and dorm kitchen preferences.\n\nHow can I help you today?`,
    },
  ])
  const [input, setInput] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Keep welcome message synced with the logged-in user's real profile name
  React.useEffect(() => {
    setMessages((prev) => {
      const updatedWelcome: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hey ${profile.name || 'there'}! 👋 I'm Dormosaur AI (powered by Llama 3).\n\nI have live access to your ${classes.length} classes, ${alarms.length} alarms, and dorm kitchen preferences.\n\nHow can I help you today?`,
      }
      if (prev.length === 0 || prev[0].id === 'welcome') {
        return [updatedWelcome, ...prev.slice(1)]
      }
      return prev
    })
  }, [profile.name, classes.length, alarms.length])

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    const handleToggle = () => setIsOpen((prev) => !prev)
    const handleClose = () => setIsOpen(false)
    window.addEventListener('open-dormosaur-ai', handleOpen)
    window.addEventListener('toggle-dormosaur-ai', handleToggle)
    window.addEventListener('close-dormosaur-ai', handleClose)
    return () => {
      window.removeEventListener('open-dormosaur-ai', handleOpen)
      window.removeEventListener('toggle-dormosaur-ai', handleToggle)
      window.removeEventListener('close-dormosaur-ai', handleClose)
    }
  }, [])

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || isTyping) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    }

    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInput('')
    setIsTyping(true)

    try {
      const now = new Date()
      const clientPayload = {
        profile: {
          name: profile.name,
          school: profile.school,
          year: profile.year,
          dorm: profile.dorm,
          dietary: profile.dietary_preference || 'none',
          dietaryNote: profile.dietary_note || '',
          appliances: profile.appliances,
        },
        classes,
        alarms,
        deadlines,
        clientTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        clientDay: now.toLocaleDateString('en-US', { weekday: 'short' }),
        clientFullDate: now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila',
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          context: clientPayload,
          userContext: clientPayload,
        }),
      })

      const data = await res.json()
      const replyContent =
        data.content ||
        data.error ||
        "I'm here! What would you like to check about your schedule or classes?"

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          model: data.model || 'Dormosaur AI',
        },
      ])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            "Hey! I'm ready to help with your classes, alarms, or dorm meals! What would you like to know?",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {/* ── Floating AI Trigger Button (Desktop Only — on mobile accessed via dock '+' menu) ── */}
      <div className="fixed bottom-6 right-6 z-40 hidden lg:flex">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center gap-2.5 rounded-full bg-[#1f6f50] pl-3 pr-4.5 py-2 text-white shadow-[0_10px_30px_rgba(31,111,80,0.4)] transition-all hover:bg-[#1a6148]"
        >
          <img
            src="/ai-dormosaur.png"
            alt="AI Dormosaur"
            className="size-7.5 object-contain drop-shadow-xs"
          />
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
          <span className="text-[14px] font-bold tracking-tight">Dormosaur AI</span>
        </motion.button>
      </div>

      {/* ── AI Drawer / Sheet ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile / Tablet backdrop overlay to easily dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              onTouchStart={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 400) {
                  setIsOpen(false)
                }
              }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-border/80 bg-card/95 shadow-[0_-12px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:inset-x-auto md:w-[460px] md:max-h-[85vh] md:rounded-3xl md:border lg:right-6 lg:left-auto lg:translate-x-0 lg:w-[420px]"
            >
              {/* Mobile Drag/Grab Indicator with swipe dismiss */}
              <div
                className="flex w-full cursor-grab justify-center py-2.5 active:cursor-grabbing lg:hidden select-none"
                aria-label="Drag down to dismiss"
              >
                <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/50" />
              </div>
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-fill/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src="/ai-dormosaur.png"
                  alt="Dormosaur Copilot"
                  className="size-12 object-contain filter drop-shadow-sm shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[14.5px] font-bold text-foreground">Dormosaur Copilot</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Llama 3
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Connected to {classes.length} classes & {alarms.length} alarms
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown className="size-4.5" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[50vh] min-h-[260px]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <img
                      src="/ai-dormosaur.png"
                      alt="AI Dormosaur"
                      className="size-10.5 shrink-0 object-contain filter drop-shadow-xs mt-0.5"
                    />
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-xs shadow-sm'
                        : 'bg-fill text-foreground border border-border/40 rounded-bl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {msg.content.replace(/\*{1,2}/g, '')}
                    </div>
                    {msg.model && (
                      <p className="mt-1 text-[9.5px] opacity-60">
                        {msg.model}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 justify-start">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-fill px-4 py-3 border border-border/40">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="flex gap-1.5 overflow-x-auto px-4 py-2 border-t border-border/40 no-scrollbar">
              {quickPrompts.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => handleSend(item.prompt)}
                    disabled={isTyping}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground active:scale-95 disabled:opacity-50"
                  >
                    <Icon className="size-3 text-primary" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-border/60 bg-card pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2 rounded-2xl border border-border bg-fill px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Dormosaur AI..."
                  disabled={isTyping}
                  className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
                >
                  <CornerDownLeft className="size-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  )
}
