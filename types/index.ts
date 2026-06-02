export interface EmailRecord {
  id: string;
  email: string;
  name: string | null;
  subject: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface ContactList {
  id: string;
  name: string;
}

export interface Contact {
  id: string;
  email: string;
  name: string | null;
  listId: string;
  sent: boolean;
  lastSentAt?: string;
}
