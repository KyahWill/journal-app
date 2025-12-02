import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

/**
 * Skeleton loader for the Settings page
 */
export function SettingsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      {/* Main Header */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Prompts Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Prompts Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Skeleton className="h-6 w-40" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2 pt-2">
                   <Skeleton className="h-8 flex-1" />
                   <Skeleton className="h-8 w-8" />
                   <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

