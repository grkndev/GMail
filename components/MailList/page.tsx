import { columns, EmailInboxList } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<EmailInboxList[]> {
    // Fetch data from your API here.
    return Array.from({ length: 100 }).map((_, index) => ({
        id: index.toString(),
        from: `John Doe ${index}`,
        subject: `Hello ${index}`,
        date: new Date().toISOString(),
        is_read: index % 2 === 0,
        is_starred: false,
        is_important: false,
        is_spam: false,
        is_draft: false,
        is_sent: false,
        is_trash: false,
        sender_mail: `john.doe${index}@example.com`,
        sender_name: `John Doe ${index}`,
    })) as EmailInboxList[]
}

export default async function DemoPage() {
    const data = await getData()

    return (
        <div className="w-full py-10">
            <DataTable columns={columns} data={data} />
        </div>
    )
}