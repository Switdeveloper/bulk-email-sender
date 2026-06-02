import type { EmailRecord, Template, ContactList, Contact } from '@/types';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Determine storage path based on environment
const getStoragePath = () => {
  if (process.env.VERCEL) {
    return '/tmp/bulk-email-data';
  }
  return join(process.cwd(), 'data');
};

const ensureDirectory = async (dir: string) => {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    // Ignore if directory already exists
    if (err.code !== 'EEXIST') throw err;
  }
};

const readJsonFile = async <T>(filePath: string): Promise<T> => {
  try {
    await ensureDirectory(getStoragePath());
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Return default based on type
      return [] as unknown as T;
    }
    throw err;
  }
};

const writeJsonFile = async <T>(filePath: string, data: T): Promise<void> => {
  await ensureDirectory(getStoragePath());
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

export class DB {
  private static instance: DB;

  private constructor() {}

  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  // Email Records
  private emailRecordsPath = join(getStoragePath(), 'emailRecords.json');
  private templatesPath = join(getStoragePath(), 'templates.json');
  private contactListsPath = join(getStoragePath(), 'contactLists.json');
  private contactsPath = join(getStoragePath(), 'contacts.json');

  async getEmailRecords(): Promise<EmailRecord[]> {
    return readJsonFile<EmailRecord[]>(this.emailRecordsPath);
  }

  async addEmailRecord(record: Omit<EmailRecord, 'id'>): Promise<void> {
    const records = await this.getEmailRecords();
    const newRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    // Keep only last 1000 records
    const updatedRecords = [newRecord, ...records].slice(0, 1000);
    await writeJsonFile<EmailRecord[]>(this.emailRecordsPath, updatedRecords);
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return readJsonFile<Template[]>(this.templatesPath);
  }

  async addTemplate(template: Omit<Template, 'id'>): Promise<void> {
    const templates = await this.getTemplates();
    const newTemplate = { ...template, id: crypto.randomUUID() };
    await writeJsonFile<Template[]>(this.templatesPath, [...templates, newTemplate]);
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<void> {
    const templates = await this.getTemplates();
    const updatedTemplates = templates.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    await writeJsonFile<Template[]>(this.templatesPath, updatedTemplates);
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await writeJsonFile<Template[]>(this.templatesPath, filtered);
  }

  // Contact Lists
  async getContactLists(): Promise<ContactList[]> {
    return readJsonFile<ContactList[]>(this.contactListsPath);
  }

  async addContactList(list: Omit<ContactList, 'id'>): Promise<void> {
    const lists = await this.getContactLists();
    const newList = { ...list, id: crypto.randomUUID() };
    await writeJsonFile<ContactList[]>(this.contactListsPath, [...lists, newList]);
  }

  async updateContactList(id: string, updates: Partial<ContactList>): Promise<void> {
    const lists = await this.getContactLists();
    const updatedLists = lists.map(l =>
      l.id === id ? { ...l, ...updates } : l
    );
    await writeJsonFile<ContactList[]>(this.contactListsPath, updatedLists);
  }

  async deleteContactList(id: string): Promise<void> {
    const lists = await this.getContactLists();
    const filtered = lists.filter(l => l.id !== id);
    await writeJsonFile<ContactList[]>(this.contactListsPath, filtered);
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return readJsonFile<Contact[]>(this.contactsPath);
  }

  async addContact(contact: Omit<Contact, 'id'>): Promise<void> {
    const contacts = await this.getContacts();
    const newContact = { ...contact, id: crypto.randomUUID() };
    await writeJsonFile<Contact[]>(this.contactsPath, [...contacts, newContact]);
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    const contacts = await this.getContacts();
    const updatedContacts = contacts.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    await writeJsonFile<Contact[]>(this.contactsPath, updatedContacts);
  }

  async deleteContact(id: string): Promise<void> {
    const contacts = await this.getContacts();
    const filtered = contacts.filter(c => c.id !== id);
    await writeJsonFile<Contact[]>(this.contactsPath, filtered);
  }

  // Update contact status (e.g., mark as sent)
  async updateContactStatus(contactId: string, status: { sent: boolean; lastSentAt?: string }): Promise<void> {
    const contacts = await this.getContacts();
    const updatedContacts = contacts.map(c =>
      c.id === contactId ? { ...c, ...status } : c
    );
    await writeJsonFile<Contact[]>(this.contactsPath, updatedContacts);
  }
}

export const db = DB.getInstance();
