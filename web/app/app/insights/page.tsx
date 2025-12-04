'use client'

import { useState, useEffect } from 'react'
import { useWeeklyInsights } from '@/lib/hooks/useWeeklyInsights'
import { useAuthReady } from '@/lib/hooks/useAuthReady'
import { WeeklyInsight } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  RefreshCw, 
  Loader2, 
  Calendar,
  BookOpen,
  Brain,
  Lightbulb,
  TrendingUp,
  Heart,
  Target,
  ChevronRight,
  ChevronLeft,
  History,
  Clock,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import Link from 'next/link'

export default function InsightsPage() {
  const isAuthReady = useAuthReady()
  const {
    currentInsight,
    insightHistory,
    weekStart,
    weekEnd,
    loading,
    loadingHistory,
    error,
    usageWarning,
    isExisting,
    checkCurrentWeek,
    fetchHistory,
    generateInsights,
    deleteInsight,
    setCurrentInsight,
    clearInsight,
  } = useWeeklyInsights()

  const [streamedContent, setStreamedContent] = useState<string>('')
  const [hasChecked, setHasChecked] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [viewingHistorical, setViewingHistorical] = useState(false)

  // Check current week on mount
  useEffect(() => {
    if (isAuthReady && !hasChecked) {
      handleCheckCurrentWeek()
    }
  }, [isAuthReady])

  async function handleCheckCurrentWeek() {
    try {
      setHasChecked(true)
      setStreamedContent('')
      setViewingHistorical(false)
      
      const result = await checkCurrentWeek()
      
      // If no existing insight, automatically generate
      if (!result.insight) {
        handleGenerate(false)
      }
    } catch (err: any) {
      console.error('Failed to check current week:', err)
    }
  }

  async function handleGenerate(forceRegenerate: boolean = false) {
    try {
      setStreamedContent('')
      setViewingHistorical(false)
      
      await generateInsights(forceRegenerate, (chunk) => {
        setStreamedContent((prev) => prev + chunk)
      })
    } catch (err: any) {
      console.error('Failed to generate insights:', err)
    }
  }

  async function handleLoadHistory() {
    if (insightHistory.length === 0) {
      await fetchHistory()
    }
    setShowHistory(true)
  }

  function handleViewHistoricalInsight(insight: WeeklyInsight) {
    setCurrentInsight(insight)
    setViewingHistorical(true)
    setShowHistory(false)
    setStreamedContent('')
  }

  function handleBackToCurrentWeek() {
    clearInsight()
    setViewingHistorical(false)
    setStreamedContent('')
    handleCheckCurrentWeek()
  }

  async function handleDeleteInsight(id: string) {
    if (confirm('Are you sure you want to delete this weekly insight?')) {
      try {
        await deleteInsight(id)
        if (viewingHistorical) {
          handleBackToCurrentWeek()
        }
      } catch (err) {
        console.error('Failed to delete insight:', err)
      }
    }
  }

  // Format date for display
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
    })
  }

  const formatFullDate = (date: Date | string | null | undefined) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Display content - prefer streamed content, then current insight content
  const displayContent = streamedContent || currentInsight?.content || ''
  const displayWeekStart = viewingHistorical && currentInsight ? new Date(currentInsight.week_start) : weekStart
  const displayWeekEnd = viewingHistorical && currentInsight ? new Date(currentInsight.week_end) : weekEnd
  const displayEntryCount = currentInsight?.entry_count || 0

  // Custom markdown components
  const markdownComponents: Components = {
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-orange-200 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-6 mb-3 text-orange-900">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 leading-relaxed text-gray-700">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 ml-4 space-y-2 list-disc marker:text-orange-400">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-4 space-y-2 list-decimal marker:text-orange-400">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-gray-700">{children}</li>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-orange-900">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-600">{children}</em>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-orange-300 pl-4 italic my-4 text-gray-600 bg-orange-50/50 py-2 rounded-r-lg">
        {children}
      </blockquote>
    ),
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl shadow-lg shadow-orange-200">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Weekly Insights
                  </h1>
                </div>
                <p className="text-gray-600 text-lg max-w-xl">
                  {viewingHistorical 
                    ? 'Viewing a past weekly reflection'
                    : 'AI-powered analysis of your journal entries. Reviews run Saturday to Friday.'}
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {displayWeekStart && displayWeekEnd 
                      ? `${formatDate(displayWeekStart)} – ${formatDate(displayWeekEnd)}`
                      : 'Saturday – Friday'}
                  </span>
                </div>
                {displayEntryCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                    <BookOpen className="h-4 w-4" />
                    <span>{displayEntryCount} {displayEntryCount === 1 ? 'entry' : 'entries'} analyzed</span>
                  </div>
                )}
                {isExisting && !viewingHistorical && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Saved</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            {viewingHistorical && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToCurrentWeek}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Current Week
              </Button>
            )}
            {!viewingHistorical && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isExisting ? 'Regenerate' : 'Generate'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadHistory}
              disabled={loadingHistory}
              className="gap-2"
            >
              {loadingHistory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <History className="h-4 w-4" />
              )}
              History
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            {currentInsight?.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteInsight(currentInsight.id)}
                className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Link href="/app/coach">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-orange-600">
                Chat with AI Coach
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <Card className="mb-6 border-orange-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-orange-500" />
                  Past Weekly Insights
                </CardTitle>
                <CardDescription>
                  Browse your previous weekly reflections
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                </div>
              ) : insightHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No past insights yet. Your weekly reflections will appear here.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {insightHistory.map((insight) => (
                    <button
                      key={insight.id}
                      onClick={() => handleViewHistoricalInsight(insight)}
                      className="w-full p-3 rounded-lg border border-orange-100 hover:bg-orange-50 text-left transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {formatDate(insight.week_start)} – {formatDate(insight.week_end)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {insight.entry_count} {insight.entry_count === 1 ? 'entry' : 'entries'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Usage Warning */}
        {usageWarning && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 text-yellow-900">
            <AlertDescription className="flex items-center gap-2">
              <span className="font-semibold">⚠️ Note:</span> {usageWarning}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && !displayContent && (
          <Card className="border-orange-100">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-200 rounded-full blur-xl opacity-50 animate-pulse" />
                  <div className="relative p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full">
                    <Sparkles className="h-8 w-8 text-orange-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-2">Generating Your Weekly Insights</h3>
                <p className="text-gray-500 max-w-sm">
                  Analyzing your journal entries to uncover patterns, highlights, and opportunities for growth...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights Content */}
        {displayContent && (
          <Card className="border-orange-100 shadow-lg shadow-orange-100/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {viewingHistorical ? 'Past Week Review' : 'Your Week in Review'}
                    </CardTitle>
                    <CardDescription>
                      {displayWeekStart && displayWeekEnd 
                        ? `${formatFullDate(displayWeekStart)} – ${formatFullDate(displayWeekEnd)}`
                        : 'Saturday – Friday'}
                    </CardDescription>
                  </div>
                </div>
                {currentInsight?.created_at && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    Generated {new Date(currentInsight.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="prose prose-orange max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
              
              {loading && (
                <div className="flex items-center gap-2 mt-4 text-sm text-orange-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Generating...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Entries State */}
        {!loading && !displayContent && hasChecked && displayEntryCount === 0 && (
          <Card className="border-orange-100">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Journal Entries This Week</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  Start writing in your journal to get personalized weekly insights. 
                  Your reflections from Saturday through Friday will be analyzed.
                </p>
                <Link href="/app/journal/new">
                  <Button className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    <BookOpen className="h-4 w-4" />
                    Write Your First Entry
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Heart className="h-4 w-4 text-pink-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Emotional Patterns</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Track your emotional journey through the week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-100 bg-gradient-to-br from-white to-amber-50/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Progress & Wins</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Celebrate your accomplishments big and small
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-100 bg-gradient-to-br from-white to-yellow-50/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Saturday Cadence</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Weekly reviews every Saturday to Friday
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
