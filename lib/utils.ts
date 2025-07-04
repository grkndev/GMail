import { GmailMessage } from "@/components/MailList/email.type"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CONSTANTS = {
  BASE_URL: "https://gmail.googleapis.com",
  LOCAL_BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
}

export const BADGE_VARIANTS: Record<string, string> = {
  primary: "",
  updates: "bg-blue-500 text-white",
  important: "bg-red-500 text-white",
  spam: "bg-yellow-500 text-white",
  draft: "bg-gray-500 text-white",
  sent: "bg-green-500 text-white",
  trash: "bg-red-500 text-white",
  inbox: "bg-blue-500 text-white",
  forums: "bg-yellow-500 text-white",
  social: "bg-gray-500 text-white",
}
export const dumyGmailMessage: GmailMessage[] = [
  {
    id: "1",
    historyId: "1001",
    threadId: "thread-1",
    labelIds: ["INBOX", "IMPORTANT"],
    snippet: "This is a sample email snippet for demonstration purposes.",
    subject: "Welcome to Gmail Clone!",
    from_name: "John Doe",
    from_email: "john.doe@example.com",
    to: "you@example.com",
    cc: "",
    category: "primary",
    date: "2024-06-01T10:00:00Z",
    formattedDate: "Jun 1, 2024 - 10:00 AM",
    internalDate: "1717236000000",
    isImportant: true,
    isSpam: false,
    isTrash: false,
    isUnread: true,
    sizeEstimate: 2048
  },
  {
    id: "2",
    historyId: "1002",
    threadId: "thread-2",
    labelIds: ["INBOX", "IMPORTANT"],
    snippet: "This is a sample email snippet for demonstration purposes.",
    subject: "Welcome to Gmail Clone 2! Welcome to Gmail CloneWelcome to Gmail CloneWelcome to Gmail CloneWelcome to Gmail CloneWelcome to Gmail CloneWelcome to Gmail CloneWelcome to Gmail Clone",
    from_name: "John Doe 2",
    from_email: "john.doe2@example.com",
    to: "you@example.com",
    cc: "",
    category: "primary",
    date: "2025-06-01T10:00:00Z",
    formattedDate: "Jun 1, 2025 - 10:00 AM",
    internalDate: "1717236000000",
    isImportant: true,
    isSpam: false,
    isTrash: false,
    isUnread: false,
    sizeEstimate: 2048
  }
]


export const getCategoryQuery = (category: string) => {
  switch (category.toLowerCase()) {
    case 'primary':
      return 'category:primary'
    case 'social':
      return 'category:social'
    case 'promotions':
      return 'category:promotions'
    case 'updates':
      return 'category:updates'
    case 'forums':
      return 'category:forums'
    case 'unread':
      return 'is:unread'
    case 'important':
      return 'is:important'
    case 'starred':
      return 'is:starred'
    default:
      return 'category:primary'
  }
}
export const getMessageCategory = (labelIds: string[]) => {
  if (labelIds?.includes('CATEGORY_SOCIAL')) return 'social'
  if (labelIds?.includes('CATEGORY_PROMOTIONS')) return 'promotions'
  if (labelIds?.includes('CATEGORY_UPDATES')) return 'updates'
  if (labelIds?.includes('CATEGORY_FORUMS')) return 'forums'
  return 'primary'
}

export const getPriority = (labelIds: string[]) => {
  if (labelIds?.includes('IMPORTANT')) return 'high'
  if (labelIds?.includes('STARRED')) return 'starred'
  return 'normal'
}

export const parseEmailHeader = (emailString: string) => {
  if (!emailString) return { name: '', email: '' }

  const match = emailString.match(/^(.+?)\s*<(.+?)>$/)
  if (match) {
    return {
      name: match[1].replace(/"/g, '').trim(),
      email: match[2].trim()
    }
  }
  return {
    name: emailString.includes('@') ? '' : emailString,
    email: emailString.includes('@') ? emailString : ''
  }
}


export const getHeader = (name: string, headers: any[]) => {
  const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
  return header?.value || ''
}

// Generate a unique boundary for MIME multipart
export const generateBoundary = () => {
  return `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Build email message in RFC 2822 format with MIME multipart support
export const buildEmailMessage = (attachments: any[], to: string[], cc: string[], bcc: string[], subject: string, emailBody: string) => {
  const hasAttachments = attachments && attachments.length > 0
  const boundary = hasAttachments ? generateBoundary() : null

  let message = ""

  // Recipients
  message += `To: ${to.join(', ')}\r\n`

  if (cc && cc.length > 0) {
    message += `Cc: ${cc.join(', ')}\r\n`
  }

  if (bcc && bcc.length > 0) {
    message += `Bcc: ${bcc.join(', ')}\r\n`
  }

  // Subject
  message += `Subject: ${subject}\r\n`

  // MIME Headers
  message += `MIME-Version: 1.0\r\n`

  if (hasAttachments) {
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`
  } else {
    message += `Content-Type: text/html; charset=utf-8\r\n`
  }

  message += `\r\n`

  if (hasAttachments) {
    // Add body as first part
    message += `--${boundary}\r\n`
    message += `Content-Type: text/html; charset=utf-8\r\n`
    message += `Content-Transfer-Encoding: 7bit\r\n`
    message += `\r\n`
  }

  // Body - Convert markdown-like formatting to basic HTML
  let htmlBody = emailBody
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Links
    .replace(/\n/g, '<br>') // Line breaks

  message += htmlBody

  if (hasAttachments) {
    message += `\r\n`

    // Add each attachment
    attachments.forEach((attachment: any) => {
      message += `--${boundary}\r\n`
      message += `Content-Type: ${attachment.type}; name="${attachment.name}"\r\n`
      message += `Content-Transfer-Encoding: base64\r\n`
      message += `Content-Disposition: attachment; filename="${attachment.name}"\r\n`
      message += `\r\n`

      // Add base64 data with line breaks every 76 characters (RFC requirement)
      const base64Data = attachment.data
      const chunks = base64Data.match(/.{1,76}/g) || []
      message += chunks.join('\r\n')
      message += `\r\n`
    })

    // Close boundary
    message += `--${boundary}--\r\n`
  }

  return message
}