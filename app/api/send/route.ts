import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sendBrevoEmail, buildEmailHtml } from '@/lib/brevo';
import { getContactsByListId } from '@/lib/contacts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      listId, 
      templateId, 
      senderName, 
      senderEmail, 
      delayPerSend = 1000 
    } = body;

    // Validate required fields
    if (!listId || !templateId || !senderName || !senderEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the template and list details
    const { getTemplates, getContactLists } = await import('@/lib/contacts');
    const [templates, lists] = await Promise.all([
      getTemplates(),
      getContactLists(),
    ]);

    const template = templates.find(t => t.id === templateId);
    const contactList = lists.find(l => l.id === listId);

    if (!template || !contactList) {
      return NextResponse.json(
        { error: 'Invalid template or list' },
        { status: 400 }
      );
    }

    // Get contacts for the selected list
    const contacts = await getContactsByListId(listId);
    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found in the selected list' },
        { status: 400 }
      );
    }

    // Send emails one by one with delay
    let sentCount = 0;
    const totalCount = contacts.length;

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
          subject: template.subject,
          htmlContent: buildEmailHtml(template.body, contact.name || ''),
        };

        await sendBrevoEmail(emailData);
        sentCount++;

        // Wait for the specified delay before sending the next email (except for the last one)
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayPerSend));
        }
      } catch (err) {
        console.error(`Failed to send email to ${contact.email}:`, err);
        // Continue with next email
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${sentCount} out of ${totalCount} emails`,
      sent: sentCount,
      total: totalCount,
    });
  } catch (error) {
    console.error('Error in send API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
