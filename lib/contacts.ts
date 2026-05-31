// lib/contacts.ts — JSON file-based contact list storage
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.VERCEL ? '/tmp/bulk-email-data' : path.join(process.cwd(), 'data')
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export interface Contact {
  email: string
  name: string
  addedAt: string
  sent: boolean      // true = already emailed
  sentAt?: string    // when last emailed
}

export interface ContactList {
  id: string
  name: string
  description: string
  contacts: Contact[]
  createdAt: string
  updatedAt: string
}

function getAll(): ContactList[] {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

function saveAll(lists: ContactList[]) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(lists, null, 2))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// — Public API —

export function getLists(): ContactList[] {
  return getAll()
}

export function getList(id: string): ContactList | null {
  return getAll().find(l => l.id === id) || null
}

export function createList(name: string, description = ''): ContactList {
  const lists = getAll()
  const list: ContactList = {
    id: uid(),
    name,
    description,
    contacts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  lists.unshift(list)
  saveAll(lists)
  return list
}

export function updateList(id: string, patches: Partial<Pick<ContactList, 'name' | 'description'>>): ContactList | null {
  const lists = getAll()
  const idx = lists.findIndex(l => l.id === id)
  if (idx === -1) return null
  if (patches.name !== undefined) lists[idx].name = patches.name
  if (patches.description !== undefined) lists[idx].description = patches.description
  lists[idx].updatedAt = new Date().toISOString()
  saveAll(lists)
  return lists[idx]
}

export function deleteList(id: string): boolean {
  const lists = getAll()
  const idx = lists.findIndex(l => l.id === id)
  if (idx === -1) return false
  lists.splice(idx, 1)
  saveAll(lists)
  return true
}

export function addContactsToList(listId: string, contacts: Omit<Contact, 'sent' | 'sentAt'>[]): ContactList | null {
  const lists = getAll()
  const idx = lists.findIndex(l => l.id === listId)
  if (idx === -1) return null
  const existing = new Set(lists[idx].contacts.map(c => c.email.toLowerCase()))
  const toAdd = contacts
    .filter(c => !existing.has(c.email.toLowerCase()))
    .map(c => ({ ...c, sent: false }))
  lists[idx].contacts.push(...toAdd)
  lists[idx].updatedAt = new Date().toISOString()
  saveAll(lists)
  return lists[idx]
}

export function removeContact(listId: string, email: string): boolean {
  const lists = getAll()
  const idx = lists.findIndex(l => l.id === listId)
  if (idx === -1) return false
  const before = lists[idx].contacts.length
  lists[idx].contacts = lists[idx].contacts.filter(c => c.email.toLowerCase() !== email.toLowerCase())
  if (lists[idx].contacts.length === before) return false
  lists[idx].updatedAt = new Date().toISOString()
  saveAll(lists)
  return true
}

export function markContactsSent(listId: string, emails: string[]): ContactList | null {
  const lists = getAll()
  const idx = lists.findIndex(l => l.id === listId)
  if (idx === -1) return null
  const sentSet = new Set(emails.map(e => e.toLowerCase()))
  const now = new Date().toISOString()
  for (const c of lists[idx].contacts) {
    if (sentSet.has(c.email.toLowerCase())) {
      c.sent = true
      c.sentAt = now
    }
  }
  lists[idx].updatedAt = now
  saveAll(lists)
  return lists[idx]
}

export function resetSent(listId: string): ContactList | null {
  const lists = getAll()
  const idx = lists.findIndex(l => l.id === listId)
  if (idx === -1) return null
  for (const c of lists[idx].contacts) {
    c.sent = false
    c.sentAt = undefined
  }
  lists[idx].updatedAt = new Date().toISOString()
  saveAll(lists)
  return lists[idx]
}

/** Get up to `limit` contacts that haven't been sent yet, shuffled (for random mode) */
export function getUnsentContacts(listId: string, limit?: number): Contact[] {
  const list = getList(listId)
  if (!list) return []
  const unsent = list.contacts.filter(c => !c.sent)
  // shuffle
  for (let i = unsent.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unsent[i], unsent[j]] = [unsent[j], unsent[i]]
  }
  return limit ? unsent.slice(0, limit) : unsent
}

export function getListStats(listId: string) {
  const list = getList(listId)
  if (!list) return { total: 0, sent: 0, unsent: 0 }
  return {
    total: list.contacts.length,
    sent: list.contacts.filter(c => c.sent).length,
    unsent: list.contacts.filter(c => !c.sent).length,
  }
}