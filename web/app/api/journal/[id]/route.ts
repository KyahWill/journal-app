import { firebaseServer } from '@/lib/firebase/server'
import { NextResponse } from 'next/server'

// GET single journal entry
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await firebaseServer.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await firebaseServer.getDocument('journal_entries', id)

    if (!data || data.user_id !== user.uid) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update journal entry
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await firebaseServer.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existingEntry = await firebaseServer.getDocument('journal_entries', id)
    if (!existingEntry || existingEntry.user_id !== user.uid) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, content } = body

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const data = await firebaseServer.updateDocument('journal_entries', id, updates)

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE journal entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await firebaseServer.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existingEntry = await firebaseServer.getDocument('journal_entries', id)
    if (!existingEntry || existingEntry.user_id !== user.uid) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    await firebaseServer.deleteDocument('journal_entries', id)

    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

