// lib/templates.ts — JSON file-based template storage
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.VERCEL ? '/tmp/bulk-email-data' : path.join(process.cwd(), 'data')
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}

export function getTemplates(): EmailTemplate[] {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

export function getTemplate(id: string): EmailTemplate | undefined {
  return getTemplates().find(t => t.id === id)
}

export function saveTemplate(t: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): EmailTemplate {
  const templates = getTemplates()
  const now = new Date().toISOString()

  if (t.id) {
    // Update existing
    const idx = templates.findIndex(x => x.id === t.id)
    if (idx !== -1) {
      templates[idx] = { ...templates[idx], ...t, updatedAt: now }
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
      return templates[idx]
    }
  }

  // Create new
  const newTemplate: EmailTemplate = {
    id: crypto.randomUUID(),
    name: t.name,
    subject: t.subject,
    body: t.body,
    createdAt: now,
    updatedAt: now,
  }
  templates.unshift(newTemplate) // newest first
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
  return newTemplate
}

export function deleteTemplate(id: string): boolean {
  const templates = getTemplates()
  const idx = templates.findIndex(t => t.id === id)
  if (idx === -1) return false
  templates.splice(idx, 1)
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
  return true
}

export function getRandomTemplate(excludeIds: string[] = []): EmailTemplate | undefined {
  const templates = getTemplates().filter(t => !excludeIds.includes(t.id))
  if (templates.length === 0) return undefined
  return templates[Math.floor(Math.random() * templates.length)]
}