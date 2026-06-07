'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Contact { email: string; name: string; addedAt: string; sent: boolean; sentAt?: string }
interface ContactList { id: string; name: string; description: string; contacts: Contact[]; createdAt: string }

function parseContacts(raw: string): Array<{ name: string; email: string; addedAt: string }> {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const out = []
  for (const line of lines) {
    const bracket = line.match(/^(.+?)\s*<(.+?)>$/)
    if (bracket) { out.push({ name: bracket[1].trim(), email: bracket[2].trim().toLowerCase(), addedAt: new Date().toISOString() }); continue }
    const parts = line.split(/[,;]/).map(p => p.trim().replace(/^["']|["']$/g, ''))
    if (parts.length >= 1) {
      const emailPart = parts.find(p => p.includes('@'))
      if (emailPart) { out.push({ name: parts.find(p => !p.includes('@')) || emailPart.split('@')[0], email: emailPart.toLowerCase(), addedAt: new Date().toISOString() }) }
    }
    if (!line.includes(',') && !line.includes(';')) {
      const m = line.match(/^[^<]+@[^>]+$/)
      if (m) out.push({ name: line.split('@')[0], email: line.toLowerCase(), addedAt: new Date().toISOString() })
    }
  }
  return out
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Lists() {
  const [lists, setLists] = useState<ContactList[]>([])
  const [selected, setSelected] = useState<ContactList | null>(null)
  const [stats, setStats] = useState({ total: 0, sent: 0, unsent: 0 })
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [tab, setTab] = useState('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [previews, setPreviews] = useState<Array<{ name: string; email: string; ok: boolean; dup: boolean }>>([])
  const [importMode, setImportMode] = useState('merge')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetch('/api/contacts').then(r => r.json()).then(d => Array.isArray(d) && setLists(d)).catch(() => {}) }, [])

  const load = (id: string) => {
    fetch(`/api/contacts/${id}`).then(r => r.json()).then(d => { if (d.list) { setSelected(d.list); setStats(d.stats) } }).catch(() => {})
  }

  const createList = async () => {
    if (!newName.trim()) return
    const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }) })
    const d = await res.json()
    if (res.ok) { setLists(prev => [d, ...prev]); setShowCreate(false); setNewName(''); setNewDesc(''); load(d.id) }
  }

  const delList = async (id: string) => {
    if (!confirm('Delete list?')) return
    await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' })
    setLists(prev => prev.filter(l => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const doPreview = useCallback((raw: string) => {
    if (!raw.trim()) { setPreviews([]); return }
    const parsed = parseContacts(raw)
    const existSet = new Set((selected?.contacts || []).map(c => c.email.toLowerCase()))
    const seen = new Set<string>()
    setPreviews(parsed.map(c => {
      const ok = validEmail(c.email)
      const dup = seen.has(c.email.toLowerCase()) || (importMode === 'merge' && existSet.has(c.email.toLowerCase()))
      seen.add(c.email.toLowerCase())
      return { name: c.name, email: c.email, ok, dup }
    }))
  }, [selected, importMode])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    file.text().then(doPreview).catch(() => setErr('Failed to read file'))
  }, [doPreview])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then(doPreview).catch(() => setErr('Failed to read file'))
  }

  const doImport = async () => {
    if (!selected || previews.length === 0) return
    const valid = previews.filter(p => p.ok && !p.dup)
    if (valid.length === 0) { setErr('No valid new contacts to import'); return }
    setUploading(true); setErr(''); setDone('')
    try {
      if (importMode === 'replace') {
        for (const c of selected.contacts) {
          await fetch(`/api/contacts/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId: selected.id, removeEmail: c.email }) })
        }
      }
      const res = await fetch(`/api/contacts/${selected.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: selected.id, contacts: valid.map(c => ({ name: c.name, email: c.email, addedAt: new Date().toISOString() })) }),
      })
      const d = await res.json()
      if (res.ok) {
        setSelected(d.list || d)
        const s = d.stats || { total: d.contacts?.length || 0, sent: 0, unsent: valid.length }
        setStats(s)
        const dupN = previews.filter(p => p.dup).length
        setDone(`Imported ${valid.length} contact${valid.length !== 1 ? 's' : ''}!` + (dupN > 0 ? ` (${dupN} duplicate${dupN !== 1 ? 's' : ''} skipped)` : ''))
        setPreviews([]); setPasteText('')
      } else { setErr(`Error: ${d.error || 'Import failed'}`) }
    } catch (e: unknown) { setErr(`Error: ${e instanceof Error ? e.message : 'Unknown'}`) }
    setUploading(false)
  }

  const rmContact = async (email: string) => {
    if (!selected) return
    const res = await fetch(`/api/contacts/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId: selected.id, removeEmail: email }) })
    const d = await res.json()
    if (res.ok && d.list) { setSelected(d.list); setStats(d.stats) }
  }

  const resetSent = async () => {
    if (!selected) return
    const res = await fetch(`/api/contacts/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId: selected.id, resetSent: true }) })
    const d = await res.json()
    if (res.ok && d.list) { setSelected(d.list); setStats(d.stats) }
  }

  const clearSent = async () => {
    if (!selected) return
    if (!confirm('Remove all sent contacts?')) return
    for (const c of selected.contacts.filter(c => c.sent)) {
      await fetch(`/api/contacts/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId: selected.id, removeEmail: c.email }) })
    }
    load(selected.id)
  }

  const clearAll = () => { setPreviews([]); setPasteText(''); if (fileRef.current) fileRef.current.value = '' }

  const okCount = previews.filter(p => p.ok && !p.dup).length
  const dupCount = previews.filter(p => p.dup).length
  const badCount = previews.filter(p => !p.ok).length

  return (
    <div className="container">
      <div className="grid-sidebar">

        {/* LEFT SIDEBAR */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-header-icon indigo" />
              SAVED LISTS
            </div>
            <button onClick={() => setShowCreate(s => !s)} className="btn btn-outline btn-sm" style={{ width: '100%', marginBottom: '12px' }}>
              {showCreate ? 'CANCEL' : '+ NEW LIST'}
            </button>
            {showCreate && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="List name..." className="form-control" style={{ marginBottom: '8px' }} />
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="form-control" style={{ marginBottom: '8px' }} />
                <button onClick={createList} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  CREATE LIST
                </button>
              </div>
            )}
            {lists.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>No lists yet.</div>
            )}
            {lists.map(list => (
              <div key={list.id} onClick={() => load(list.id)} style={{ padding: '12px', marginBottom: '8px', borderRadius: '8px', background: 'var(--bg-surface)', cursor: 'pointer', border: `1px solid ${selected?.id === list.id ? 'var(--success)' : 'transparent'}`, position: 'relative', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{list.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{list.contacts.length} contact{list.contacts.length !== 1 ? 's' : ''}{list.description ? ' · ' + list.description : ''}</div>
                <button onClick={e => { e.stopPropagation(); delList(list.id) }} title="Delete" style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', opacity: 0, color: 'var(--text-muted)', fontFamily: 'inherit', transition: 'opacity 0.2s' }}>🗑️</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div>
          {!selected && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '14px', letterSpacing: '2px' }}>SELECT A LIST</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.6 }}>Or create a new one from the sidebar</div>
            </div>
          )}

          {selected && (
            <div>
              {/* Header */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  <span className="card-header-icon indigo" />
                  <div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '13px', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>{selected.name}</div>
                    {selected.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selected.description}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={resetSent} className="btn btn-outline btn-sm">RESET SENT</button>
                    <button onClick={clearSent} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>REMOVE SENT</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {[{ label: 'TOTAL', val: stats.total, col: 'var(--accent)' }, { label: 'UNSENT', val: stats.unsent, col: 'var(--success)' }, { label: 'SENT', val: stats.sent, col: 'var(--amber)' }].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '14px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '26px', fontFamily: "'Orbitron', sans-serif", color: s.col }}>{s.val}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: '4px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => setTab('upload')} className={`btn btn-sm ${tab === 'upload' ? 'btn-primary' : 'btn-outline'}`}>IMPORT</button>
                  <button onClick={() => setTab('yelp')} style={{ padding: '6px 16px', background: tab === 'yelp' ? 'var(--success)' : 'transparent', border: '1px solid var(--success)', color: tab === 'yelp' ? 'var(--bg-deep)' : 'var(--success)', borderRadius: '6px', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === 'yelp' ? 'bold' : 'normal' }}>🔍 YELP</button>
                  <button onClick={() => setTab('contacts')} className={`btn btn-sm ${tab === 'contacts' ? 'btn-primary' : 'btn-outline'}`}>CONTACTS ({selected.contacts.length})</button>
                </div>
              </div>

              {/* UPLOAD TAB */}
              {tab === 'upload' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-header-icon indigo" />
                    Import Contacts
                  </div>

                  {/* Mode toggle */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <button onClick={() => { setImportMode('merge'); setPreviews([]) }} style={{ padding: '6px 14px', background: importMode === 'merge' ? 'var(--accent)' : 'transparent', border: '1px solid var(--accent)', color: importMode === 'merge' ? 'var(--bg-deep)' : 'var(--accent)', borderRadius: '6px', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: importMode === 'merge' ? 'bold' : 'normal' }}>
                      + MERGE — Add to existing
                    </button>
                    <button onClick={() => { setImportMode('replace'); setPreviews([]) }} style={{ padding: '6px 14px', background: importMode === 'replace' ? 'var(--danger)' : 'transparent', border: '1px solid var(--danger)', color: importMode === 'replace' ? 'white' : 'var(--danger)', borderRadius: '6px', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: importMode === 'replace' ? 'bold' : 'normal' }}>
                      REPLACE — Clear & import new
                    </button>
                  </div>

                  {/* Drop zone */}
                  <div
                    ref={dropRef}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className="drop-zone"
                    style={{
                      borderColor: isDragging ? 'var(--success)' : undefined,
                      background: isDragging ? 'rgba(0,255,136,0.05)' : undefined,
                    }}
                  >
                    <div style={{ fontSize: '40px', marginBottom: '12px', opacity: isDragging ? 0.3 : 1 }}>📂</div>
                    <div style={{ fontSize: '14px', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '6px' }}>
                      {isDragging ? 'DROP FILE HERE' : 'DRAG & DROP FILE'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CSV or TXT · click to browse</div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(0,212,255,0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>.csv</span>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(0,212,255,0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>.txt</span>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(0,212,255,0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>Name email</span>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(0,212,255,0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>Name, email</span>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(0,212,255,0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>email only</span>
                    </div>
                  </div>

                  <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={onFileChange} />

                  {/* Divider */}
                  <div className="divider">OR PASTE TEXT</div>

                  {/* Paste area */}
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={"Paste emails here — one per line\n\nExamples:\nJohn Doe <john@example.com>\njane@example.com\nJane, jane@example.com"}
                    className="form-control"
                    style={{ minHeight: '110px', resize: 'vertical', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => doPreview(pasteText)} disabled={!pasteText.trim()} className="btn btn-outline btn-sm" style={{ opacity: pasteText.trim() ? 1 : 0.4, cursor: pasteText.trim() ? 'pointer' : 'not-allowed' }}>
                      PREVIEW PARSED
                    </button>
                    <button onClick={clearAll} className="btn btn-outline btn-sm">
                      CLEAR
                    </button>
                  </div>

                  {/* Preview */}
                  {previews.length > 0 && (
                    <div style={{ marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12px', letterSpacing: '1px' }}>
                          PREVIEW — <span style={{ color: 'var(--accent)' }}>{previews.length}</span> found
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {okCount > 0 && <span className="badge badge-success">{okCount} valid</span>}
                          {dupCount > 0 && <span className="badge badge-warning">{dupCount} dup</span>}
                          {badCount > 0 && <span className="badge badge-danger">{badCount} bad</span>}
                        </div>
                      </div>

                      <div className="table-wrapper" style={{ maxHeight: '240px' }}>
                        <table>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', padding: '8px 14px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}></th>
                              <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', padding: '8px 14px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}>NAME</th>
                              <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', padding: '8px 14px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}>EMAIL</th>
                              <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px', padding: '8px 14px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase', width: '70px' }}>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previews.slice(0, 50).map((p, i) => (
                              <tr key={i} style={{ opacity: p.ok && !p.dup ? 1 : 0.45 }}>
                                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', fontSize: '14px' }}>
                                  {p.ok ? <span style={{ color: 'var(--success)' }}>&#10003;</span> : <span style={{ color: 'var(--danger)' }}>&#10007;</span>}
                                </td>
                                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', fontSize: '12px' }}>{p.name || '—'}</td>
                                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', fontSize: '12px', color: p.ok ? 'var(--accent)' : 'var(--danger)' }}>{p.email}</td>
                                <td style={{ padding: '8px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)' }}>
                                  {p.dup
                                    ? <span className="badge badge-warning">DUP</span>
                                    : !p.ok
                                    ? <span className="badge badge-danger">BAD</span>
                                    : <span className="badge badge-success">OK</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {previews.length > 50 && (
                          <div style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                            ...and {previews.length - 50} more
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '14px 16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Will import <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{okCount}</span> new contact{okCount !== 1 ? 's' : ''}
                          {dupCount > 0 && <span> · {dupCount} skipped</span>}
                          {badCount > 0 && <span> · {badCount} invalid</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={clearAll} className="btn btn-outline btn-sm">CANCEL</button>
                          <button onClick={doImport} disabled={uploading || okCount === 0} className="btn btn-primary btn-sm" style={{ opacity: okCount > 0 && !uploading ? 1 : 0.4, cursor: okCount > 0 && !uploading ? 'pointer' : 'not-allowed' }}>
                            {uploading ? 'IMPORTING...' : `IMPORT ${okCount} CONTACT${okCount !== 1 ? 'S' : ''}`}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {done && (
                    <div className="alert alert-success" style={{ marginTop: '12px' }}>
                      {done}
                    </div>
                  )}
                  {err && (
                    <div className="alert alert-danger" style={{ marginTop: '12px' }}>
                      {err}
                    </div>
                  )}
                </div>
              )}

              {/* YELP SEARCH TAB */}
              {tab === 'yelp' && (
                <YelpSearchTab selected={selected} onImported={() => load(selected.id)} />
              )}

              {/* CONTACTS TAB */}
              {tab === 'contacts' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-header-icon indigo" />
                    Contacts ({selected.contacts.length})
                  </div>
                  {selected.contacts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                      <div style={{ fontSize: '13px' }}>No contacts yet</div>
                      <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>Go to IMPORT to bulk-upload</div>
                    </div>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {selected.contacts.map(c => (
                        <div key={c.email} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid rgba(30,58,95,0.5)', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>{c.sent ? '✅' : '⭕'}</span>
                          <span style={{ flex: 1 }}>
                            <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{c.name ? c.name + ' ' : ''}</span>
                            <span style={{ color: c.sent ? 'var(--success)' : 'var(--accent)', fontSize: '13px' }}>{c.email}</span>
                            {c.sent && c.sentAt && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>— sent {new Date(c.sentAt).toLocaleDateString()}</span>
                            )}
                          </span>
                          <button onClick={() => rmContact(c.email)} title="Remove" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 6px', fontSize: '14px', borderRadius: '4px', fontFamily: 'inherit', transition: 'color 0.2s' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// — YelpSearchTab component —
interface YelpBusiness {
  id: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  category: string
  rating: number
  reviewCount: number
  price: string
}

interface Props {
  selected: ContactList | null
  onImported: () => void
}

function YelpSearchTab({ selected, onImported }: Props) {
  const [term, setTerm] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<YelpBusiness[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [totalResults, setTotalResults] = useState(0)

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!term.trim() || !location.trim()) return
    setLoading(true)
    setMsg(null)
    setSearched(false)
    setResults([])
    setSelectedIds(new Set())
    try {
      const url = `/api/yelp?term=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&limit=20`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: 'err', text: data.error || 'Search failed' })
      } else {
        setResults(data.businesses || [])
        setTotalResults(data.total || 0)
        setSearched(true)
        const ids: Set<string> = new Set((data.businesses || []).map((b: YelpBusiness) => b.id))
        setSelectedIds(ids)
      }
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Network error' })
    }
    setLoading(false)
  }

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === results.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(results.map(b => b.id)))
  }

  const doImport = async () => {
    if (!selected || selectedIds.size === 0) return
    setImporting(true)
    setMsg(null)
    const selectedBusinesses = results.filter(b => selectedIds.has(b.id))
    const contacts = selectedBusinesses.map(b => ({
      email: b.phone || `no-phone-${b.id}@yelp.import`,
      name: b.name,
      addedAt: new Date().toISOString(),
    }))
    try {
      const res = await fetch(`/api/contacts/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: selected.id, contacts }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'ok', text: `✅ Imported ${selectedBusinesses.length} business${selectedBusinesses.length !== 1 ? 'es' : ''}! Yelp provides no emails — phone used as identifier.` })
        onImported()
        setSelectedIds(new Set())
      } else {
        setMsg({ type: 'err', text: data.error || 'Import failed' })
      }
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Import error' })
    }
    setImporting(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon green" />
        🔍 Yelp Business Search
      </div>

      <div className="alert alert-info" style={{ marginBottom: '18px', fontSize: '12px', lineHeight: '1.6' }}>
        ℹ️ <strong style={{ color: 'var(--accent)' }}>Yelp provides:</strong> business name, phone, address, rating, category — <strong style={{ color: 'var(--amber)' }}>NO email addresses.</strong><br />
        Imported contacts will use <strong style={{ color: 'var(--success)' }}>phone as the contact identifier</strong>. You'll need a separate email sourcing tool to follow up via email.
      </div>

      <form onSubmit={doSearch} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" value={term} onChange={e => setTerm(e.target.value)} placeholder="e.g. restaurants, dentists, plumbers" className="form-control" style={{ flex: '2', minWidth: '160px' }} />
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, state or zip" className="form-control" style={{ flex: '1', minWidth: '120px' }} />
        <button type="submit" disabled={loading || !term.trim() || !location.trim()} style={{ padding: '8px 18px', background: loading ? 'var(--border)' : 'var(--success)', border: 'none', color: loading ? 'var(--text-muted)' : 'var(--bg-deep)', borderRadius: '6px', fontSize: '12px', letterSpacing: '1px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>
          {loading ? 'SEARCHING...' : '🔍 SEARCH'}
        </button>
      </form>

      {searched && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {totalResults > 20 && <span>Showing 20 of </span>}
              <span style={{ color: 'var(--success)' }}>{totalResults}</span> businesses found
              {selectedIds.size > 0 && <span> — <span style={{ color: 'var(--accent)' }}>{selectedIds.size}</span> selected</span>}
            </div>
            <button onClick={toggleAll} className="btn btn-outline btn-sm">
              {selectedIds.size === results.length ? 'DESELECT ALL' : 'SELECT ALL'}
            </button>
          </div>

          {results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>No businesses found. Try different keywords or location.</div>
          )}

          <div className="table-wrapper" style={{ maxHeight: '360px', marginBottom: '14px' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '36px', textAlign: 'center', fontSize: '10px', color: 'var(--success)', letterSpacing: '2px', padding: '8px 6px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}></th>
                  <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--success)', letterSpacing: '2px', padding: '8px 10px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase' }}>BUSINESS</th>
                  <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--success)', letterSpacing: '2px', padding: '8px 10px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase', width: '110px' }}>PHONE</th>
                  <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--success)', letterSpacing: '2px', padding: '8px 10px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase', width: '100px' }}>LOCATION</th>
                  <th style={{ textAlign: 'left', fontSize: '10px', color: 'var(--success)', letterSpacing: '2px', padding: '8px 10px', borderBottom: '2px solid var(--border)', textTransform: 'uppercase', width: '70px' }}>RATING</th>
                </tr>
              </thead>
              <tbody>
                {results.map(b => (
                  <tr key={b.id} onClick={() => toggle(b.id)} style={{ cursor: 'pointer', background: selectedIds.has(b.id) ? 'rgba(0,255,136,0.06)' : 'transparent', transition: 'background 0.1s' }}>
                    <td style={{ textAlign: 'center', padding: '8px 6px', borderBottom: '1px solid rgba(30,58,95,0.5)', fontSize: '14px' }}>
                      <span style={{ color: selectedIds.has(b.id) ? 'var(--success)' : 'var(--border)', fontSize: '16px' }}>
                        {selectedIds.has(b.id) ? '☑️' : '⬜'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(30,58,95,0.5)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b.category}</div>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(30,58,95,0.5)', fontSize: '12px', color: b.phone ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {b.phone || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(30,58,95,0.5)', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {b.city}{b.state ? `, ${b.state}` : ''}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(30,58,95,0.5)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--amber)', fontWeight: 'bold' }}>★ {b.rating}</span>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b.reviewCount} reviews</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {selectedIds.size} business{selectedIds.size !== 1 ? 'es' : ''} selected
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setSearched(false); setResults([]); setSelectedIds(new Set()) }} className="btn btn-outline btn-sm">
                CLEAR
              </button>
              <button onClick={doImport} disabled={importing || selectedIds.size === 0} style={{ padding: '6px 16px', background: selectedIds.size > 0 && !importing ? 'var(--success)' : 'var(--border)', border: 'none', color: selectedIds.size > 0 && !importing ? 'var(--bg-deep)' : 'var(--text-muted)', borderRadius: '6px', fontSize: '11px', letterSpacing: '1px', cursor: selectedIds.size > 0 && !importing ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 'bold' }}>
                {importing ? 'IMPORTING...' : `📥 IMPORT ${selectedIds.size} BUSINESS${selectedIds.size !== 1 ? 'ES' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`alert ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`} style={{ marginTop: '12px' }}>
          {msg.text}
        </div>
      )}
    </div>
  )
}
