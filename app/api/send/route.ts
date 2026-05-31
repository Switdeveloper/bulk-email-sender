// app/api/send/route.ts — Send bulk emails via Brevo
import { NextRequest, NextResponse } from 'next/server'
import { sendBrevoEmail, buildEmailHtml } from '@/lib/brevo'
import { getSettings, addRecords, EmailRecord } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, body } = await req.json()

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    const settings = getSettings()

    // Fallback to default sender if no SMTP credentials
    const smtpConfigured = settings.brevoSmtpUser || settings.brevoSmtpPass || settings.brevoApiKey
    if (!smtpConfigured) {
      return NextResponse.json({ error: 'Brevo SMTP not configured. Add your API key in Settings.' }, { status: 400 })
    }

    const results: { email: string; name: string; success: boolean; error?: string }[] = []
    const records: EmailRecord[] = []

    for (const recipient of recipients) {
      const html = buildEmailHtml(recipient.name || recipient.email.split('@')[0], body, subject)
      const result = await sendBrevoEmail(
        {
          to: [{ email: recipient.email, name: recipient.name }],
          subject,
          htmlContent: html,
          from: { email: settings.senderEmail, name: settings.senderName },
        },
        settings
      )

      results.push({
        email: recipient.email,
        name: recipient.name || '',
        success: result.success,
        error: result.error,
      })

      records.push({
        id: crypto.randomUUID(),
        to: recipient.email,
        toName: recipient.name || '',
        subject,
        body,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
        sentAt: new Date().toISOString(),
        senderEmail: settings.senderEmail,
        senderName: settings.senderName,
      })

      // Rate limit: 1 email per second
      await new Promise(r => setTimeout(r, 1000))
    }

    addRecords(records)

    const sent = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({ sent, failed, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}