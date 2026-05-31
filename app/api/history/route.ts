// app/api/history/route.ts — Get email history
import { NextResponse } from 'next/server'
import { getHistory, getStats } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const history = getHistory()
    const stats = getStats()
    return NextResponse.json({ history, stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}