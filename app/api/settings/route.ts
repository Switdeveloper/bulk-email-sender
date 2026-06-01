// app/api/settings/route.ts — Get/Save settings
import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings, Settings } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = getSettings()
    // Mask sensitive fields
    const safe = {
      ...settings,
      brevoApiKey: settings.brevoApiKey ? '••••••••' + settings.brevoApiKey.slice(-4) : '',
      brevoSmtpPass: settings.brevoSmtpPass ? '••••••••' : '',
      yelpApiKey: settings.yelpApiKey ? '••••••••' + settings.yelpApiKey.slice(-4) : '',
    }
    return NextResponse.json(safe)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data: Settings = await req.json()
    const current = getSettings()
    // Preserve masked fields if not provided
    if (data.brevoApiKey && data.brevoApiKey.includes('••••')) {
      data.brevoApiKey = current.brevoApiKey
    }
    if (data.brevoSmtpPass && data.brevoSmtpPass.includes('••••')) {
      data.brevoSmtpPass = current.brevoSmtpPass
    }
    if (data.yelpApiKey && data.yelpApiKey.includes('••••')) {
      data.yelpApiKey = current.yelpApiKey
    }
    saveSettings({ ...current, ...data })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}