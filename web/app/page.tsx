import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Journal App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your personal space for reflection with AI-powered coaching
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          <Card>
            <CardHeader>
              <CardTitle>📝 Journal</CardTitle>
              <CardDescription>
                Write and organize your thoughts with a beautiful, intuitive interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Create, edit, and delete entries</li>
                <li>• Search through your journal</li>
                <li>• Real-time sync across devices</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤖 AI Coach</CardTitle>
              <CardDescription>
                Get personalized insights and guidance from your executive coach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Context-aware responses</li>
                <li>• Professional coaching advice</li>
                <li>• Based on your journal entries</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔒 Secure</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Row-level security</li>
                <li>• Encrypted connections</li>
                <li>• Private and confidential</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
