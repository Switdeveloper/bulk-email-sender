// lib/brevo.ts — Send emails via Brevo Transactional API (more reliable than SMTP)
import type { Settings } from './db'

export interface SendResult {
  success: boolean
  error?: string
  messageId?: string
}

export async function sendBrevoEmail(
  opts: {
    to: { email: string; name?: string }[]
    subject: string
    htmlContent: string
    from: { email: string; name: string }
  },
  settings: Settings
): Promise<SendResult> {
  const apiKey = settings.brevoApiKey

  try {
    // Use Brevo Transactional API v3
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: opts.from.email, name: opts.from.name },
        to: opts.to.map(r => ({ email: r.email, name: r.name || undefined })),
        subject: opts.subject,
        htmlContent: opts.htmlContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const msg = errorData?.message || `HTTP ${response.status}`
      return { success: false, error: msg }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export function buildEmailHtml(recipientName: string, body: string, subject: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { background: white; border-radius: 8px; padding: 32px; max-width: 600px; margin: 0 auto; }
    .header { border-bottom: 3px solid #00d4ff; padding-bottom: 16px; margin-bottom: 24px; }
    .header h2 { color: #0a1628; margin: 0; font-size: 20px; }
    .body { color: #333; font-size: 15px; line-height: 1.8; }
    .body p { margin: 0 0 16px; }
    .signature { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    .highlight { color: #00d4ff; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📧 New Message</h2>
    </div>
    <div class="body">
      <p>Hi <span class="highlight">${recipientName}</span>,</p>
      ${body.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
    <div class="signature">
      Best regards,<br />
      <strong>Swit Developer</strong><br />
      <span style="color: #00d4ff;">https://switdeveloper.com</span>
    </div>
  </div>
</body>
</html>
  `.trim()
}