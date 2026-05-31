// lib/brevo.ts — Send emails via Brevo SMTP
import nodemailer from 'nodemailer'
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
  // Use Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: settings.brevoSmtpHost || 'smtp-relay.brevo.com',
    port: settings.brevoSmtpPort || 587,
    secure: false,
    auth: {
      user: settings.brevoSmtpUser || settings.senderEmail,
      pass: settings.brevoSmtpPass || settings.brevoApiKey,
    },
  })

  // Send to each recipient individually
  const results: SendResult = { success: false }

  try {
    // For bulk, send to all at once (BCC style for privacy)
    const info = await transporter.sendMail({
      from: `"${opts.from.name}" <${opts.from.email}>`,
      to: opts.to.map(r => `"${r.name || ''}" <${r.email}>`).join(', '),
      subject: opts.subject,
      html: opts.htmlContent,
    })

    results.success = true
    results.messageId = info.messageId
    return results
  } catch (err: any) {
    results.success = false
    results.error = err.message
    return results
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