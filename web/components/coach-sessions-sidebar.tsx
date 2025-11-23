'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  MessageSquare,
  Menu,
  ChevronLeft,
} from 'lucide-react'
import { ChatSession } from '@/lib/api/client'
import { formatDistanceToNow, format } from 'date-fns'

interface CoachSessionsSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (session: ChatSession) => void
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, title: string) => void
  loading?: boolean
}

export function CoachSessionsSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  loading = false,
}: CoachSessionsSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Track client-side mount to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id)
    setEditTitle(session.title || 'Untitled Session')
  }

  const handleSaveEdit = async (sessionId: string) => {
    if (editTitle.trim()) {
      await onRenameSession(sessionId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const getSessionTitle = (session: ChatSession) => {
    if (session.title) return session.title
    if (session.messages.length > 0) {
      const firstUserMessage = session.messages.find((m) => m.role === 'user')
      if (firstUserMessage) {
        return firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
      }
    }
    return 'New Session'
  }

  const getSessionPreview = (session: ChatSession) => {
    if (session.messages.length === 0) return 'No messages yet'
    const lastMessage = session.messages[session.messages.length - 1]
    return lastMessage.content.substring(0, 60) + (lastMessage.content.length > 60 ? '...' : '')
  }

  if (isCollapsed) {
    return (
      <div className="fixed top-20 left-4 z-50 lg:hidden">
        <Button
          onClick={() => setIsCollapsed(false)}
          size="icon"
          className="rounded-full shadow-lg"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'}
          w-full sm:w-80 bg-background border-r flex flex-col
          ${isCollapsed ? 'hidden' : 'flex'}
        `}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-base sm:text-lg">Coach Sessions</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onNewSession} className="w-full" disabled={loading} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {sessions.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500 px-4">
              <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sessions yet</p>
              <p className="text-xs mt-1">Start a conversation to create one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`
                    cursor-pointer transition-all hover:shadow-md
                    ${currentSessionId === session.id ? 'ring-2 ring-primary' : ''}
                  `}
                  onClick={() => {
                    if (editingId !== session.id) {
                      onSessionSelect(session)
                      if (isMobile) setIsCollapsed(true)
                    }
                  }}
                >
                  <CardContent className="p-3">
                    {editingId === session.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(session.id)
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          autoFocus
                          className="text-sm"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(session.id)}
                            className="h-7 px-2"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-7 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm line-clamp-1 flex-1">
                            {getSessionTitle(session)}
                          </h4>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartEdit(session)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Delete this session?')) {
                                  onDeleteSession(session.id)
                                }
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-1">
                          {getSessionPreview(session)}
                        </p>
                        <p className="text-xs text-gray-400" suppressHydrationWarning>
                          {isMounted && session.updated_at
                            ? formatDistanceToNow(new Date(session.updated_at), {
                                addSuffix: true,
                              })
                            : ''}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

