import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import { LandingHeader } from '@/components/landing-header'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description: 'A warm, personal space for reflection and growth, enhanced with AI-powered insights to guide your journey.',
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-peach-50 to-amber-50 relative overflow-hidden flex flex-col">
      <LandingHeader />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(252,165,165,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 relative z-10">
        <div className="text-center mb-12 sm:mb-16 md:mb-20 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-gray-900 leading-tight px-2">
            Your Journey,{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Beautifully Captured
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            A warm, personal space for reflection and growth, enhanced with AI-powered insights to guide your journey
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-orange-300 text-gray-700 hover:bg-orange-50 hover:border-orange-400 transform hover:scale-105 transition-all duration-200">
                Welcome Back
              </Button>
            </Link>
          </div>
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mt-12 sm:mt-16 md:mt-24">
          {/* Express Yourself */}
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

          {/* AI-Powered Guidance */}
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

          {/* Goals & Milestones */}
          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
              <CardTitle className="text-2xl text-gray-900">Goals & Milestones</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Set meaningful goals, track milestones, and celebrate your progress with a comprehensive goal management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Create and organize goals with customizable categories</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Break down goals into actionable milestones and tasks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Visual progress tracking to stay motivated</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Link journal entries to goals for deeper context</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Weekly Insights */}
          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
              <CardTitle className="text-2xl text-gray-900">Weekly Insights</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Receive AI-generated summaries that reveal patterns, themes, and growth opportunities from your journal entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Automated weekly summaries of your reflections</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Identify recurring themes and emotional patterns</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Track your personal growth over time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Actionable recommendations for self-improvement</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Voice Journaling */}
          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎙️</div>
              <CardTitle className="text-2xl text-gray-900">Voice Journaling</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Speak your thoughts freely with advanced speech-to-text technology that captures your voice naturally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Hands-free journaling with accurate transcription</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Perfect for capturing thoughts on the go</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Voice conversations with your AI coach</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Text-to-speech for listening to past entries</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Theme Customization */}
          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎨</div>
              <CardTitle className="text-2xl text-gray-900">Theme Customization</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Personalize your journaling experience with beautiful themes that match your mood and style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Choose from curated color palettes and themes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Create and save your own custom themes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Light and dark mode support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Seamless experience across all devices</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Google Calendar Sync */}
          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📅</div>
              <CardTitle className="text-2xl text-gray-900">Google Calendar Sync</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Connect your calendar for context-aware coaching and seamless integration with your daily life
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Automatic context from your schedule</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>AI coach understands your commitments</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Schedule journaling and reflection time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Secure OAuth integration with Google</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* AI Coach Personalities */}
          <Card className="border-orange-100 bg-white/80 backdrop-blur hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">💬</div>
              <CardTitle className="text-2xl text-gray-900">AI Coach Personalities</CardTitle>
              <CardDescription className="text-base text-gray-600 mt-2">
                Choose from different coaching styles to find the perfect match for your personal growth journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Multiple coaching personalities to choose from</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>From gentle encouragement to direct accountability</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Switch styles based on your current needs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">✓</span>
                  <span>Personalized approach that evolves with you</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Private & Secure */}
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
