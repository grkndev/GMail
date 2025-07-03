"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { ArrowUpDown } from "lucide-react"
import { Checkbox } from "../ui/checkbox"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
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

export const columns: ColumnDef<EmailInboxList>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "from",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    From
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        // cell: ({ row }) => {
        //     return <div className="w-fit bg-black">{row.original.from}</div>
        // },
    },
   
    {
        accessorKey: "subject",
        header: "Subject",
        
        // cell: ({ row }) => {
        //     return <div className="w-full bg-black">{row.original.subject}</div>
        // },
    },
    {
        accessorKey: "date",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return <div className="text-sm text-gray-500">{format(new Date(row.original.date), "MMM d, yyyy - hh:mm a")}</div>
        },
    },
]