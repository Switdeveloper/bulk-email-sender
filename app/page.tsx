import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContactLists, getTemplates, getContacts } from '@/lib/contacts';
import { getEmailRecords } from '@/lib/db';
import { addTemplate } from '@/lib/templates';
import { addContactList } from '@/lib/contacts';

export default function Home() {
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    last24h: 0,
    last7d: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [records, lists, templates, contacts] = await Promise.all([
        getEmailRecords(),
        getContactLists(),
        getTemplates(),
        getContacts(),
      ]);

      const total = records.length;
      const sent = records.filter(r => r.status === 'sent').length;
      const failed = records.filter(r => r.status === 'failed').length;

      const now = new Date();
      const last24h = records.filter(r => {
        const sentAt = new Date(r.timestamp);
        return now.getTime() - sentAt.getTime() < 24 * 60 * 60 * 1000;
      }).length;

      const last7d = records.filter(r => {
        const sentAt = new Date(r.timestamp);
        return now.getTime() - sentAt.getTime() < 7 * 24 * 60 * 60 * 1000;
      }).length;

      setStats({ total, sent, failed, last24h, last7d });
      setError(null);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-t-2 border-electric-blue rounded-full animate-spin"></div>
          <p className="mt-2 text-slate-gray">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button 
            onClick={loadStats}
            className="mt-4 naval-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-navy-blue border-b border-electric-blue px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold text-electric-blue">Naval Command Center</span>
            <span className="text-slate-gray">Bulk Email Sender</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/lists" className="hover:text-electric-blue transition-colors">
              Lists
            </Link>
            <Link href="/templates" className="hover:text-electric-blue transition-colors">
              Templates
            </Link>
            <Link href="/history" className="hover:text-electric-blue transition-colors">
              History
            </Link>
            <Link href="/settings" className="hover:text-electric-blue transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="naval-card">
            <h2 className="text-xl font-semibold mb-4 text-electric-blue">Total Emails</h2>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="naval-card">
            <h2 className="text-xl font-semibold mb-4 text-electric-blue">Sent</h2>
            <p className="text-3xl font-bold text-success-500">{stats.sent}</p>
          </div>
          <div className="naval-card">
            <h2 className="text-xl font-semibold mb-4 text-electric-blue">Failed</h2>
            <p className="text-3xl font-bold text-error-500">{stats.failed}</p>
          </div>
          <div className="naval-card">
            <h2 className="text-xl font-semibold mb-4 text-electric-blue">Last 24h</h2>
            <p className="text-3xl font-bold">{stats.last24h}</p>
          </div>
          <div className="naval-card">
            <h2 className="text-xl font-semibold mb-4 text-electric-blue">Last 7d</h2>
            <p className="text-3xl font-bold">{stats.last7d}</p>
          </div>
          <div className="naval-card">
            <h2 className="text-xl font-semibold mb-4 text-electric-blue">Contacts</h2>
            <p className="text-3xl font-bold">0</p> {/* We'll compute this later if needed */}
          </div>
        </div>

        <div className="naval-card">
          <h2 className="text-xl font-semibold mb-6 text-electric-blue">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/lists/new" 
              className="naval-button w-full py-3"
            >
              Create Contact List
            </Link>
            <Link 
              href="/templates/new" 
              className="naval-button w-full py-3"
            >
              Create Email Template
            </Link>
            <Link 
              href="/send" 
              className="naval-button w-full py-3"
            >
              Send Email Campaign
            </Link>
            <Link 
              href="/history" 
              className="naval-button w-full py-3"
            >
              View Send History
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-navy-blue border-t border-electric-blue px-4 py-6 text-center text-slate-gray">
        <p>&copy; {new Date().getFullYear()} Naval Command Center. All rights reserved.</p>
      </footer>
    </div>
  );
}
