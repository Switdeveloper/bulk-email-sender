import { db } from './db';
import type { Contact, ContactList } from '@/types';

export async function getContactLists() {
  return db.getContactLists();
}

export async function addContactList(data: Omit<ContactList, 'id'>) {
  await db.addContactList(data);
}

export async function updateContactList(id: string, data: Partial<ContactList>) {
  await db.updateContactList(id, data);
}

export async function deleteContactList(id: string) {
  await db.deleteContactList(id);
}

export async function getContacts() {
  return db.getContacts();
}

export async function addContact(data: Omit<Contact, 'id'>) {
  await db.addContact(data);
}

export async function updateContact(id: string, data: Partial<Contact>) {
  await db.updateContact(id, data);
}

export async function deleteContact(id: string) {
  await db.deleteContact(id);
}

export async function updateContactStatus(contactId: string, status: { sent: boolean; lastSentAt?: string }) {
  await db.updateContactStatus(contactId, status);
}
