import { firebaseServer } from '@/lib/firebase/server'
import { NextResponse } from 'next/server'
import { AICoach } from '@/lib/ai/coach'
import { ChatRequest } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const user = await firebaseServer.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ChatRequest = await request.json()
    const { message, history } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Fetch user's journal entries
    const entries = await firebaseServer.getCollection('journal_entries', user.uid)

    // Initialize AI coach
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const coach = new AICoach(apiKey)

    // Get AI response
    const response = await coach.sendMessage(message, entries || [], history || [])

    return NextResponse.json({ message: response })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

