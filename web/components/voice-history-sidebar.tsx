'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Clock,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  Search,
  X,
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { ConversationMessage } from '@/app/app/ai-agent/page'

interface StoredConversation {
  id: string
  userId: string
  conversationId: string
  transcript: ConversationMessage[]
  duration: number
  startedAt: Date
  endedAt: Date
  summary?: string
}

interface VoiceHistorySidebarProps {
  onLoadConversation?: (conversation: StoredConversation) => void
  currentConversationId?: string | null
}

export function VoiceHistorySidebar({
  onLoadConversation,
  currentConversationId,
}: VoiceHistorySidebarProps) {
  const [conversations, setConversations] = useState<StoredConversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest'>('newest')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Calculate date range based on filter
  const getDateRange = useCallback(() => {
    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date | undefined = now
    
    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = undefined
        endDate = undefined
    }
    
    return { startDate, endDate }
  }, [dateFilter])

  // Load conversation history
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { startDate, endDate } = getDateRange()
      
      const response = await apiClient.getVoiceConversationHistory({
        limit: 50,
        search: searchQuery || undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        sortBy,
      })
      
      // Parse dates
      const parsedConversations = response.conversations.map((conv: any) => ({
        ...conv,
        startedAt: new Date(conv.startedAt),
        endedAt: new Date(conv.endedAt),
        transcript: conv.transcript.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
      
      setConversations(parsedConversations)
    } catch (err: any) {
      console.error('[CoachSessionsSidebar] Failed to load conversations:', err)
      setError(err.message || 'Failed to load conversation history')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, sortBy, getDateRange])

  // Load conversations on mount and when filters change
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      setIsDeleting(true)
      await apiClient.deleteVoiceConversation(conversationId)
      
      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.conversationId !== conversationId))
      
      setDeleteDialogOpen(false)
      setConversationToDelete(null)
    } catch (err: any) {
      console.error('[CoachSessionsSidebar] Failed to delete conversation:', err)
      setError(err.message || 'Failed to delete conversation')
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // Open delete dialog
  const openDeleteDialog = useCallback((conversationId: string) => {
    setConversationToDelete(conversationId)
    setDeleteDialogOpen(true)
  }, [])

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  // Format date
  const formatDate = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Generate summary from transcript
  const generateSummary = (transcript: ConversationMessage[]): string => {
    if (transcript.length === 0) {
      return 'No messages'
    }
    
    // Get first user message or first message
    const firstUserMessage = transcript.find((msg) => msg.role === 'user')
    const firstMessage = firstUserMessage || transcript[0]
    
    // Truncate to 100 characters
    const content = firstMessage.content
    if (content.length > 100) {
      return content.substring(0, 100) + '...'
    }
    
    return content
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Conversation History</span>
            {conversations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {conversations.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        {/* Search and Filter Controls */}
        <div className="px-4 pb-3 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* Filter Controls */}
          <div className="flex gap-2">
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="longest">Longest first</SelectItem>
                <SelectItem value="shortest">Shortest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button
                variant="outline"
                size="sm"
                onClick={loadConversations}
                className="mt-3 w-full"
              >
                Try Again
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-1">
                  Start a conversation to see it here
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2 p-4">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      currentConversationId === conversation.conversationId
                        ? 'border-blue-500 bg-blue-50'
                        : ''
                    }`}
                    onClick={() => onLoadConversation?.(conversation)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Date and Duration */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(conversation.startedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(conversation.duration)}</span>
                          </div>
                        </div>
                        
                        {/* Summary */}
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {conversation.summary || generateSummary(conversation.transcript)}
                        </p>
                        
                        {/* Message Count and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MessageSquare className="h-3 w-3" />
                            <span>{conversation.transcript.length} messages</span>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteDialog(conversation.conversationId)
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (conversationToDelete) {
                  handleDeleteConversation(conversationToDelete)
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
