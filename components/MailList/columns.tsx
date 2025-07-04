"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { ArrowUpDown } from "lucide-react"
import { Checkbox } from "../ui/checkbox"
import { format } from "date-fns"
import { GmailMessage } from "./email.type"
import { Badge } from "../ui/badge"
import { BADGE_VARIANTS } from "@/lib/utils"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.


export const columns: ColumnDef<GmailMessage>[] = [
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
        accessorKey: "from_name",
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
        cell: ({ row }) => {
            return <HoverCard>
                <HoverCardTrigger> <div className="w-fit ">{row.original.from_name || row.original.from_email.split('@')[0]}</div></HoverCardTrigger>
                <HoverCardContent className="p-2">
                    <p>{row.original.from_email}</p>
                </HoverCardContent>
            </HoverCard>
        },
    },

    {
        accessorKey: "subject",
        header: "Subject",

        cell: ({ row }) => {
            return <div className="flex items-center gap-2">
                {row.original.category && (
                    <Badge variant="outline" className={`text-xs`}>
                        {row.original.category.charAt(0).toUpperCase() + row.original.category.slice(1)}
                    </Badge>
                )}
                <div className="w-full  max-w-[400px]">
                    <p title={row.original.subject} className="text-sm truncate">{row.original.subject}</p>
                </div>
            </div>
        },
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