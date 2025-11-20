import { firebaseServer } from '@/lib/firebase/server'
import { NextResponse } from 'next/server'

// GET all journal entries
export async function GET() {
  try {
    const user = await firebaseServer.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await firebaseServer.getCollection('journal_entries', user.uid)

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new journal entry
export async function POST(request: Request) {
  try {
    const user = await firebaseServer.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const data = await firebaseServer.addDocument('journal_entries', {
      user_id: user.uid,
      title,
      content,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

