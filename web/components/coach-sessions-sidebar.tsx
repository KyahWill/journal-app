'use client'

import { ChatSession } from '@/lib/api/client'

interface CoachSessionsSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (session: ChatSession) => Promise<void>
  onNewSession: () => void
  onDeleteSession: (sessionId: string) => Promise<void>
  onRenameSession: (sessionId: string, title: string) => Promise<void>
  loading: boolean
}

export function CoachSessionsSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  loading,
}: CoachSessionsSidebarProps) {
  // TODO: Implement chat sessions sidebar
  // This is a placeholder to fix the build error
  // The actual implementation should be done in a separate task
  return (
    <div className="w-64 border-r bg-gray-50 p-4">
      <h3 className="font-semibold mb-4">Chat Sessions</h3>
      <p className="text-sm text-gray-500">
        Sessions sidebar coming soon...
      </p>
    </div>
  )
}
