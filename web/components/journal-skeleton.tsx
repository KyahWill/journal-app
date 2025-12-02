import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loader for journal list view
 */
export function JournalListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>

      {/* Grouped Entries Skeleton */}
      <div className="space-y-8">
        {[1, 2].map((groupIndex) => (
          <div key={groupIndex}>
            {/* Date Header */}
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            
            {/* Grid of Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((cardIndex) => (
                <Card key={cardIndex} className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-24 mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton loader for journal entry detail view
 */
export function JournalEntrySkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      {/* Back Button */}
      <Skeleton className="h-10 w-24 mb-6" />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Skeleton loader for new/edit journal entry form
 */
export function JournalFormSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      <Skeleton className="h-10 w-24 mb-6" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

