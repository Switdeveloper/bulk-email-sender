// app/api/send/route.ts — Send bulk emails via Brevo (with random template support)
import { NextRequest, NextResponse } from 'next/server'
import { sendBrevoEmail, buildEmailHtml } from '@/lib/brevo'
import { getSettings, addRecords, EmailRecord } from '@/lib/db'
import { getTemplates, getRandomTemplate } from '@/lib/templates'
import { markContactsSent } from '@/lib/contacts'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, body, randomMode, templateIds, listId } = await req.json()

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    const settings = getSettings()
    const smtpConfigured = settings.brevoApiKey
    if (!smtpConfigured) {
      return NextResponse.json({ error: 'Brevo SMTP not configured. Add your API key in Settings.' }, { status: 400 })
    }

    const results: { email: string; name: string; success: boolean; error?: string }[] = []
    const records: EmailRecord[] = []
    const usedTemplateIds: string[] = []

    for (const recipient of recipients) {
      // Pick subject/body: random template OR provided values
      let emailSubject = subject
      let emailBody = body
      let usedTemplateName = ''

      if (randomMode) {
        const template = getRandomTemplate(usedTemplateIds)
        if (template) {
          emailSubject = template.subject
          emailBody = template.body
          usedTemplateIds.push(template.id)
          usedTemplateName = template.name
        }
      }

      if (!emailSubject || !emailBody) {
        results.push({ email: recipient.email, name: recipient.name || '', success: false, error: 'No subject or body' })
        continue
      }

      const html = buildEmailHtml(recipient.name || recipient.email.split('@')[0], emailBody, emailSubject)
      const result = await sendBrevoEmail(
        {
          to: [{ email: recipient.email, name: recipient.name }],
          subject: emailSubject,
          htmlContent: html,
          from: { email: settings.senderEmail, name: settings.senderName },
        },
        settings
      )

      const errorMsg = result.success ? undefined : (result.error || 'Unknown error')
      results.push({
        email: recipient.email,
        name: recipient.name || '',
        success: result.success,
        error: errorMsg,
      })

      records.push({
        id: crypto.randomUUID(),
        to: recipient.email,
        toName: recipient.name || '',
        subject: emailSubject,
        body: emailBody,
        status: result.success ? 'sent' : 'failed',
        error: errorMsg,
        sentAt: new Date().toISOString(),
        senderEmail: settings.senderEmail,
        senderName: settings.senderName,
      })

      // Rate limit: 1 email per second
      await new Promise(r => setTimeout(r, 1000))
    }

    addRecords(records)

    // Mark successfully sent contacts in the list
    if (listId) {
      const successfullySentEmails = results.filter(r => r.success).map(r => r.email)
      if (successfullySentEmails.length > 0) {
        markContactsSent(listId, successfullySentEmails)
      }
    }

    const sent = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({ sent, failed, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}