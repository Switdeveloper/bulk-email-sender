'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  useEffect(() => { fetchTemplates() }, [])

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates')
    const data = await res.json()
    if (Array.isArray(data)) setTemplates(data)
  }

  const openNew = () => {
    setForm({ name: '', subject: '', body: '' })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (t: Template) => {
    setForm({ name: t.name, subject: t.subject, body: t.body })
    setEditingId(t.id)
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: editingId }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(`❌ ${data.error}`); return }
      setMsg(editingId ? '✅ Template updated' : '✅ Template saved')
      setShowForm(false)
      setEditingId(null)
      fetchTemplates()
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return
    await fetch(`/api/templates?id=${id}`, { method: 'DELETE' })
    fetchTemplates()
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <div className="status-bar">
        <span>🔴 LIVE SYSTEMS</span>
        <span style={{ color: 'var(--radar-green)' }}>⚡ READY TO TRANSMIT</span>
      </div>

      <nav>
        <div className="logo">⚡ OPERATION<span>MAIL</span></div>
        <div className="nav-links">
          <Link href="/">📊 DASHBOARD</Link>
          <Link href="/compose">✏️ COMPOSE</Link>
          <Link href="/history">📋 HISTORY</Link>
          <Link href="/settings">⚙️ SETTINGS</Link>
          <Link href="/templates" className="active">📝 TEMPLATES</Link>
        </div>
        <div className="online-indicator">
          <span className="radar-dot" />
          <span style={{ fontSize: '11px', color: 'var(--radar-green)', letterSpacing: '2px' }}>SYSTEM ONLINE</span>
        </div>
      </nav>

      <div className="container">
        {msg && <div className="alert alert-success" style={{ marginBottom: '16px' }}>{msg}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: 'var(--blue-accent)', margin: 0, fontSize: '20px' }}>📝 MESSAGE TEMPLATES</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '12px' }}>
              Save messages and pick randomly per recipient — each email gets a different message
            </p>
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ NEW TEMPLATE</button>
        </div>

        {templates.length === 0 && !showForm && (
          <div className="panel" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No templates yet</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Save your first message template to enable random rotation
            </div>
            <button className="btn btn-primary" onClick={openNew}>+ CREATE TEMPLATE</button>
          </div>
        )}

        {/* Template Cards */}
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          {templates.map(t => (
            <div key={t.id} className="panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ color: 'var(--blue-accent)', fontWeight: 'bold', fontSize: '15px' }}>{t.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                    Updated {formatDate(t.updatedAt)} · ID: {t.id.slice(0, 8)}...
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => setPreviewTemplate(previewTemplate?.id === t.id ? null : t)}>
                    {previewTemplate?.id === t.id ? '🔼 HIDE' : '👁 PREVIEW'}
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => openEdit(t)}>✏️ EDIT</button>
                  <button className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--red-alert)' }}
                    onClick={() => handleDelete(t.id, t.name)}>🗑 DELETE</button>
                </div>
              </div>
              <div style={{ color: 'var(--radar-green)', fontSize: '12px', fontFamily: 'monospace', marginBottom: '8px' }}>
                SUBJECT: {t.subject}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', maxHeight: '60px', overflow: 'hidden' }}>
                {t.body.slice(0, 150)}{t.body.length > 150 ? '...' : ''}
              </div>

              {previewTemplate?.id === t.id && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'var(--navy-deep)', borderRadius: '6px', border: '1px solid var(--navy-mid)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>FULL PREVIEW</div>
                  <div style={{ color: 'var(--radar-green)', fontSize: '13px', marginBottom: '8px' }}>{t.subject}</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{t.body}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save/Edit Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div className="panel-title" style={{ margin: 0 }}>
                  {editingId ? '✏️ EDIT TEMPLATE' : '➕ NEW TEMPLATE'}
                </div>
                <button onClick={() => { setShowForm(false); setEditingId(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>

              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>TEMPLATE NAME</label>
                  <input className="form-control" type="text" placeholder="e.g. Cold Outreach #1" required
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>SUBJECT LINE</label>
                  <input className="form-control" type="text" placeholder="Email subject..." required
                    value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>MESSAGE BODY</label>
                  <textarea className="form-control" rows={10} placeholder="Hi&#10;&#10;Your message here..." required
                    value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                    {saving ? 'SAVING...' : (editingId ? '💾 UPDATE TEMPLATE' : '💾 SAVE TEMPLATE')}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditingId(null) }}>
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}