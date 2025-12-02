import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loader for the main dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Banner (Optional) */}
      <Skeleton className="h-32 w-full mb-6 rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goal Dashboard Widget Skeleton */}
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div className="space-y-2">
                   <Skeleton className="h-6 w-40" />
                   <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-9 w-24" />
             </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
               {[1, 2, 3].map(i => (
                 <div key={i} className="space-y-2">
                   <Skeleton className="h-4 w-20" />
                   <Skeleton className="h-8 w-12" />
                 </div>
               ))}
            </div>
            <div className="space-y-4">
               <Skeleton className="h-5 w-32" />
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-2 w-24 rounded-full" />
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

