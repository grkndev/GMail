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
export const dumyGmailMessage: GmailMessage = {
  id: "1",
  historyId: "1001",
  threadId: "thread-1",
  labelIds: ["INBOX", "IMPORTANT"],
  snippet: "This is a sample email snippet for demonstration purposes.",
  subject: "Welcome to Gmail Clone!",
  from: {
    name: "John Doe",
    email: "john.doe@example.com"
  },
  to: "you@example.com",
  cc: "",
  category: "primary",
  date: "2024-06-01T10:00:00Z",
  formattedDate: "Jun 1, 2024 - 10:00 AM",
  internalDate: "1717236000000",
  isImportant: true,
  isSpam: false,
  isTrash: false,
  sizeEstimate: 2048
}