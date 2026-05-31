import { NextResponse } from 'next/server'
import { getLists, createList, updateList, deleteList } from '@/lib/contacts'

export async function GET() {
  try {
    return NextResponse.json(getLists())
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'List name required' }, { status: 400 })
    return NextResponse.json(createList(name.trim(), description?.trim() || ''))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, description } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const updated = updateList(id, { name, description })
    if (!updated) return NextResponse.json({ error: 'List not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const ok = deleteList(id)
    if (!ok) return NextResponse.json({ error: 'List not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}