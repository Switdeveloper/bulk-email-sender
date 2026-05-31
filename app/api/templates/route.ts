// app/api/templates/route.ts — CRUD for email templates
import { NextRequest, NextResponse } from 'next/server'
import { getTemplates, getTemplate, saveTemplate, deleteTemplate } from '@/lib/templates'

export const runtime = 'nodejs'

export async function GET() {
  const templates = getTemplates()
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, subject, body: templateBody, id } = body

    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 })
    }

    const saved = saveTemplate({ id, name, subject, body: templateBody })
    return NextResponse.json(saved, { status: id ? 200 : 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const deleted = deleteTemplate(id)
    if (!deleted) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}