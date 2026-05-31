// lib/db.ts — JSON file-based storage for email history + settings
// Works in both local dev and Vercel serverless (writes to /tmp on Vercel)

import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.VERCEL ? '/tmp/bulk-email-data' : path.join(process.cwd(), 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// — Types —
export interface EmailRecord {
  id: string
  to: string
  toName: string
  subject: string
  body: string
  status: 'sent' | 'failed'
  error?: string
  sentAt: string
  senderEmail: string
  senderName: string
}

export interface Settings {
  brevoApiKey: string
  brevoSmtpHost: string
  brevoSmtpPort: number
  brevoSmtpUser: string
  brevoSmtpPass: string
  senderEmail: string
  senderName: string
  defaultSubject: string
}

// — Settings helpers —
export function getSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
    }
  } catch {}
  return {
    brevoApiKey: '',
    brevoSmtpHost: 'smtp-relay.brevo.com',
    brevoSmtpPort: 587,
    brevoSmtpUser: '',
    brevoSmtpPass: '',
    senderEmail: 'switdeveloper@gmail.com',
    senderName: 'Swit Developer',
    defaultSubject: 'Quick question about your website',
  }
}

export function saveSettings(s: Settings): void {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2))
}

// — History helpers —
export function getHistory(): EmailRecord[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

export function addRecords(records: EmailRecord[]): void {
  const existing = getHistory()
  const updated = [...records, ...existing].slice(0, 1000) // keep last 1000
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2))
}

export function getStats() {
  const history = getHistory()
  const total = history.length
  const sent = history.filter(r => r.status === 'sent').length
  const failed = history.filter(r => r.status === 'failed').length
  const last24h = history.filter(r => {
    const diff = Date.now() - new Date(r.sentAt).getTime()
    return diff < 24 * 60 * 60 * 1000
  }).length
  const last7d = history.filter(r => {
    const diff = Date.now() - new Date(r.sentAt).getTime()
    return diff < 7 * 24 * 60 * 60 * 1000
  }).length
  return { total, sent, failed, last24h, last7d }
}