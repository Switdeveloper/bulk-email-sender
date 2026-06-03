import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getContactLists, getTemplates } from '@/lib/contacts';
import { getEmailRecords } from '@/lib/db';

export default function SendPage() {
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [delayPerSend, setDelayPerSend] = useState<number>(1000); // in milliseconds
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lists, templateList] = await Promise.all([
        getContactLists(),
        getTemplates(),
      ]);
      setContactLists(lists);
      setTemplates(templateList);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSentCount(0);

    if (!selectedListId || !selectedTemplateId || !senderName || !senderEmail) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Get the selected list and template details
      const selectedList = contactLists.find(list => list.id === selectedListId);
      const selectedTemplate = templates.find(template => template.id === selectedTemplateId);

      if (!selectedList || !selectedTemplate) {
        setError('Invalid selection');
        return;
      }

      // Get contacts for the selected list
      const { getContactsByListId } = await import('@/lib/contacts');
      const contacts = await getContactsByListId(selectedListId);

      if (!contacts || contacts.length === 0) {
        setError('No contacts found in the selected list');
        return;
      }

      setTotalCount(contacts.length);

      // Import the send function from lib/brevo
      const { sendBrevoEmail, buildEmailHtml } = await import('@/lib/brevo');

      // Send emails one by one with delay
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        try {
          const emailData = {
            sender: {
              name: senderName,
              email: senderEmail,
            },
            to: [
              {
                email: contact.email,
                name: contact.name || '',
              },
            ],
            subject: selectedTemplate.subject,
            htmlContent: buildEmailHtml(selectedTemplate.body, contact.name || ''),
          };

          await sendBrevoEmail(emailData);
          setSentCount(i + 1);

          // Wait for the specified delay before sending the next email (except for the last one)
          if (i < contacts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayPerSend));
          }
        } catch (err) {
          console.error(`Failed to send email to ${contact.email}:`, err);
          // Continue with next email
        }
      }

      setSuccess(`Successfully sent ${sentCount} out of ${totalCount} emails!`);
    } catch (err) {
      setError('Failed to send emails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Bulk Email Sender
        </h1>

        {error && (
          <div className="bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-600/20 border border-green-500/30 text-green-400 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Sender Name</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sender Email</label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Contact List</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="">Select a contact list</option>
                {contactLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.contact_count || 0} contacts)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Delay Between Sends (ms)
            </label>
            <input
              type="number"
              value={delayPerSend}
              onChange={(e) => setDelayPerSend(parseInt(e.target.value) || 1000)}
              min="0"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <p className="text-sm text-slate-400 mt-1">
              Set delay in milliseconds to avoid rate limiting (e.g., 1000 = 1 second)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {totalCount > 0 && (
                <span>
                  Will send to {totalCount} contact(s) from the selected list
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Sending...' : 'Send Bulk Email'}
            </button>
          </div>

          {sentCount > 0 && totalCount > 0 && (
            <div className="mt-4 p-4 bg-slate-800/30 rounded-lg">
              <p className="text-sm text-slate-400">
                Progress: {sentCount}/{totalCount} emails sent
              </p>
              <div className="w-full bg-slate-700/30 rounded-full h-2.5 mt-2">
                <div
                  className={`bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full transition-all duration-300`}
                  style={{ width: `${(sentCount / totalCount) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8">
          <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
