import { CONSTANTS, dumyGmailMessage } from "@/lib/utils"
import { columns } from "./columns"
import { GmailMessage } from "./email.type"
import { DataTable } from "./data-table"
import { headers } from "next/headers";
import { Suspense } from "react";

async function getData(): Promise<GmailMessage[]> {
    // Fetch data from your API here.
    await new Promise(resolve => setTimeout(resolve, 1_000))
    return dumyGmailMessage

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

export default async function MailListPage() {
    const data = await getData()
    // console.log(data)

    return (
        <div className="w-full py-10">
            <Suspense fallback={<div>Loading...</div>}>
                <DataTable columns={columns} data={data} />
            </Suspense>
        </div>
    )
}