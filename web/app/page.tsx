import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import { LandingHeader } from '@/components/landing-header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-peach-50 to-amber-50 relative overflow-hidden flex flex-col">
      <LandingHeader />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(252,165,165,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-20 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-gray-900 leading-tight">
            Your Journey,{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Beautifully Captured
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            A warm, personal space for reflection and growth, enhanced with AI-powered insights to guide your journey
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-orange-300 text-gray-700 hover:bg-orange-50 hover:border-orange-400 transform hover:scale-105 transition-all duration-200">
                Welcome Back
              </Button>
            </Link>
          </div>
        </div>

        <div id="features" className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24">
          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📝</div>
              <CardTitle className="text-2xl text-gray-900">Express Yourself</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Write and organize your thoughts with a beautiful, intuitive interface designed for mindful reflection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Create, edit, and organize journal entries effortlessly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Powerful search to rediscover past insights and memories</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Real-time sync keeps your thoughts accessible anywhere</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Rich formatting options to capture your unique voice</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <CardTitle className="text-2xl text-gray-900">AI-Powered Guidance</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Get personalized insights and thoughtful guidance from your AI executive coach who understands your journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Context-aware responses based on your complete journal history</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Professional coaching advice tailored to your goals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Thoughtful questions that deepen self-reflection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Supportive guidance to help you grow and thrive</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🔒</div>
              <CardTitle className="text-2xl text-gray-900">Private & Secure</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Your personal thoughts deserve the highest level of protection with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Row-level security ensures your data stays truly private</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>End-to-end encrypted connections protect your entries</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Complete confidentiality - your journal is eyes-only</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Regular security audits and best-practice compliance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}
