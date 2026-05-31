import { NextResponse } from 'next/server'
import {
  getList, addContactsToList, removeContact,
  markContactsSent, resetSent, getUnsentContacts, getListStats
} from '@/lib/contacts'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const unsent = searchParams.get('unsent')
    const limit = searchParams.get('limit')

    if (unsent === '1' && id) {
      const contacts = getUnsentContacts(id, limit ? parseInt(limit) : undefined)
      return NextResponse.json({ contacts, stats: getListStats(id) })
    }

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const list = getList(id)
    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ list, stats: getListStats(id) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { listId, contacts, markSent } = await req.json()
    if (!listId) return NextResponse.json({ error: 'listId required' }, { status: 400 })
    const updated = addContactsToList(listId, contacts || [])
    if (!updated) return NextResponse.json({ error: 'List not found' }, { status: 404 })

    if (markSent && Array.isArray(markSent)) {
      markContactsSent(listId, markSent)
    }

    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { listId, removeEmail, resetSent: doReset } = await req.json()
    if (!listId) return NextResponse.json({ error: 'listId required' }, { status: 400 })

    if (removeEmail) {
      removeContact(listId, removeEmail)
    }

    if (doReset) {
      resetSent(listId)
    }

    const list = getList(listId)
    if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ list, stats: getListStats(listId) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}