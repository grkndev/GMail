import { CONSTANTS, dumyGmailMessage } from "@/lib/utils"
import { columns } from "./columns"
import { GmailMessage } from "./email.type"
import { DataTable } from "./data-table"
import { headers } from "next/headers";

async function getData(): Promise<GmailMessage[]> {
    // Fetch data from your API here.
    return [dumyGmailMessage]

    const response = await fetch(`${CONSTANTS.LOCAL_BASE_URL}/api/mails`, { 
        method: "GET", 
        headers: {
            'Cookie': (await headers()).get('cookie') || ''
        }
    })
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json()
    return data.messages as GmailMessage[]
}

export default async function DemoPage() {
    const data = await getData()
    // console.log(data)

    return (
        <div className="w-full py-10">
            <DataTable columns={columns} data={data} />
        </div>
    )
}