import type { EmailRecord } from '@/types';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export interface BrevoEmailData {
  sender: { name: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
}

export interface BrevoResponse {
  messageId: string;
}

/**
 * Send an email via Brevo Transactional API
 */
export async function sendBrevoEmail(data: BrevoEmailData): Promise<BrevoResponse> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('Brevo API key is not configured');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Build HTML email content from template and recipient data
 */
export function buildEmailHtml(templateBody: string, recipientName: string): string {
  // Simple personalization: replace {{name}} or {{recipient_name}} with actual name
  const personalizedBody = templateBody
    .replace(/{{\s*name\s*}}/gi, recipientName)
    .replace(/{{\s*recipient_name\s*}}/gi, recipientName);

  // Convert newlines to paragraphs
  const paragraphs = personalizedBody
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0a1628; color: #00d4ff; padding: 20px; text-align: center;">
        <h1>Naval Command Center</h1>
      </div>
      <div style="padding: 20px;">
        ${paragraphs}
      </div>
      <div style="background-color: #1e293b; color: #64748b; text-align: center; padding: 15px; font-size: 0.9rem;">
        <p>This email was sent via the Bulk Email Sender system</p>
        <p>© ${new Date().getFullYear()} Naval Command Center. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Save email sending record to history
 */
export async function saveEmailRecord(record: Omit<EmailRecord, 'id'>): Promise<void> {
  // This will be implemented in db.ts
  const { default: db } = await import('./db');
  await db.addEmailRecord(record);
}
