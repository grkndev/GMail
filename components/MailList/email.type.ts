export type Email = {
    id: string
    from: string
    sender: string
    to: string
    subject: string
    date: string
    body: string
}
export type EmailInboxList = {
    id: string
    from: string
    sender_mail?: string
    sender_name: string
    subject: string
    date: string
    is_read: boolean
    is_starred: boolean
    is_important: boolean
    is_spam: boolean
    is_draft: boolean
    is_sent: boolean
    is_trash: boolean
}
export type GmailMessage = {
    id: string
    historyId: string
    threadId: string
    labelIds: string[]

    snippet: string
    subject: string

    from: {
        name: string
        email: string
    }
    to: string
    cc: string

    category: string

    date: string
    formattedDate: string
    internalDate: string

    isImportant: boolean
    isSpam: boolean
    isTrash: boolean

    sizeEstimate: number
}