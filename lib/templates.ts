import { db } from './db';
import type { Template } from '@/types';

export async function getTemplates() {
  return db.getTemplates();
}

export async function addTemplate(data: Omit<Template, 'id'>) {
  await db.addTemplate(data);
}

export async function updateTemplate(id: string, data: Partial<Template>) {
  await db.updateTemplate(id, data);
}

export async function deleteTemplate(id: string) {
  await db.deleteTemplate(id);
}
