import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loader for the AI Coach Chat page
 */
export function CoachChatSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
      {/* Sidebar Skeleton - Hidden on mobile usually, but shown in skeleton for desktop view */}
      <div className="hidden lg:block w-80 border-r bg-gray-50/50 p-4 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>

          {/* Personality Selector */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="h-[500px] sm:h-[600px] flex flex-col">
            <CardContent className="flex-1 p-4 sm:p-6 space-y-6">
              {/* Mock Messages */}
              <div className="flex justify-end">
                 <Skeleton className="h-16 w-2/3 rounded-lg rounded-br-none" />
              </div>
              <div className="flex justify-start">
                 <Skeleton className="h-24 w-3/4 rounded-lg rounded-bl-none" />
              </div>
              <div className="flex justify-end">
                 <Skeleton className="h-12 w-1/2 rounded-lg rounded-br-none" />
              </div>
            </CardContent>
            
            {/* Input Area */}
            <div className="border-t p-3 sm:p-4">
               <div className="flex gap-2">
                  <Skeleton className="h-20 flex-1" />
                  <div className="flex flex-col gap-2">
                     <Skeleton className="h-9 w-9" />
                     <Skeleton className="h-9 w-9" />
                  </div>
               </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Sidebar (Prompts) Skeleton */}
      <div className="hidden lg:block w-80 border-l bg-gray-50/50 p-6 space-y-6">
         <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
         </div>
         <div className="space-y-3">
            {[1, 2, 3].map(i => (
               <Skeleton key={i} className="h-16 w-full" />
            ))}
         </div>
         
         <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
               <Skeleton className="h-5 w-5" />
               <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-3">
               {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}

