'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatSession } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoachSessionsSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (session: ChatSession) => Promise<void>
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => Promise<void>
  onRenameSession: (sessionId: string, title: string) => Promise<void>
  loading: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CoachSessionsSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  loading,
  open = true,
  onOpenChange,
}: CoachSessionsSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (editingSessionId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingSessionId])

  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditingTitle(session.title || 'Untitled Session')
  }

  const handleCancelEdit = () => {
    setEditingSessionId(null)
    setEditingTitle('')
  }

  const handleSaveEdit = async (sessionId: string) => {
    if (editingTitle.trim()) {
      await onRenameSession(sessionId, editingTitle.trim())
    }
    setEditingSessionId(null)
    setEditingTitle('')
  }

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      await onDeleteSession(sessionToDelete)
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getSessionPreview = (session: ChatSession) => {
    const firstUserMessage = session.messages.find(m => m.role === 'user')
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    }
    return 'New conversation'
  }

  const handleSessionSelect = async (session: ChatSession) => {
    await onSessionSelect(session)
    // Close sidebar on mobile after selection
    if (onOpenChange) {
      // Use media query to check if we're on mobile
      const isMobile = window.matchMedia('(max-width: 1023px)').matches
      if (isMobile) {
        onOpenChange(false)
      }
    }
  }

  const handleNewSession = () => {
    onNewSession()
    // Close sidebar on mobile after creating new session
    if (onOpenChange) {
      // Use media query to check if we're on mobile
      const isMobile = window.matchMedia('(max-width: 1023px)').matches
      if (isMobile) {
        onOpenChange(false)
      }
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && onOpenChange && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'w-64 lg:w-72 border-r bg-gray-50 flex flex-col h-full',
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
        'transform transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Sessions
            </h3>
            {onOpenChange && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        <Button
          onClick={handleNewSession}
          size="sm"
          className="w-full"
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No chat sessions yet</p>
              <p className="text-xs text-gray-400">
                Start a conversation to create your first session
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => {
                const isActive = session.id === currentSessionId
                const isEditing = editingSessionId === session.id
                const isHovered = hoveredSessionId === session.id

                return (
                  <div
                    key={session.id}
                    className={cn(
                      'group relative rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-white hover:bg-gray-100',
                      'cursor-pointer'
                    )}
                    onMouseEnter={() => setHoveredSessionId(session.id)}
                    onMouseLeave={() => setHoveredSessionId(null)}
                    onClick={() => !isEditing && handleSessionSelect(session)}
                  >
                    {isEditing ? (
                      <div className="p-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          ref={inputRef}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(session.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          className="h-8 text-sm"
                          placeholder="Session title"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 flex-1"
                            onClick={() => handleSaveEdit(session.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 flex-1"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              'font-medium text-sm truncate',
                              isActive ? 'text-primary-foreground' : 'text-gray-900'
                            )}>
                              {session.title || 'Untitled Session'}
                            </h4>
                            <p className={cn(
                              'text-xs mt-0.5 line-clamp-2',
                              isActive ? 'text-primary-foreground/80' : 'text-gray-500'
                            )}>
                              {getSessionPreview(session)}
                            </p>
                          </div>
                          {(isHovered || isActive) && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className={cn(
                                  'h-6 w-6 p-0',
                                  isActive && 'hover:bg-primary-foreground/20'
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEdit(session)
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={cn(
                                  'h-6 w-6 p-0',
                                  isActive && 'hover:bg-primary-foreground/20'
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(session.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          'text-xs mt-1',
                          isActive ? 'text-primary-foreground/70' : 'text-gray-400'
                        )}>
                          {formatDate(session.updated_at)}
                          {session.messages.length > 0 && (
                            <span className="ml-2">
                              • {session.messages.length} {session.messages.length === 1 ? 'message' : 'messages'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat session and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  )
}
