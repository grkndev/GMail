"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "../ui/button"
import { useState } from "react"
import { Input } from "../ui/input"
import DataTablePagination from "./pagination"
import { cn } from "@/lib/utils"
import { Archive, MailOpen, MailWarning, RefreshCcw, TrashIcon } from "lucide-react"
import { GmailMessage } from "./email.type"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onRefresh?: () => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onRefresh,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [rowSelection, setRowSelection] = useState({})
    const router = useRouter()
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    const handleDelete = (messageIds: string[], permanent: boolean = false) => {
        const newData = data
            .filter((_, index) => messageIds.includes(index.toString()))
            .map((message) => (message as GmailMessage).id)

        const endpoint = permanent ? "/api/mails/batchDelete" : "/api/mails/trash"
        const successMessage = permanent ? "Emails permanently deleted" : "Emails moved to trash"

        fetch(endpoint, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageIds: newData }),
        }).then(async (res) => {
            if (res.ok) {
                toast.success(successMessage)
                setRowSelection({})
                // Refresh the data after successful deletion
                if (onRefresh) {
                    onRefresh()
                }
            } else {
                const errorData = await res.json()
                toast.error(`Failed to delete emails: ${errorData.error}`)
            }
        }).catch((error) => {
            console.error('Delete operation failed:', error)
            toast.error("Failed to delete emails")
        })
    }

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Filter emails..."
                    value={(table.getColumn("from_name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("from_name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button variant={"outline"} onClick={onRefresh}>
                    <RefreshCcw className="w-4 h-4" />
                    <span>Refresh</span>
                </Button>
                {
                    Object.keys(rowSelection).length > 0 && (
                        <div className="flex items-center gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant={"destructive"}>
                                        <TrashIcon className="w-4 h-4" />
                                        <span>Delete ({Object.keys(rowSelection).length})</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Choose delete action</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Please choose how you want to delete the selected {Object.keys(rowSelection).length} email{Object.keys(rowSelection).length > 1 ? 's' : ''}:
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-orange-500 hover:bg-orange-600"
                                            onClick={() => handleDelete(Object.keys(rowSelection) as string[], false)}
                                        >
                                            Move to Trash
                                        </AlertDialogAction>
                                        <AlertDialogAction
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() => handleDelete(Object.keys(rowSelection) as string[], true)}
                                        >
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button variant={"outline"}>
                                <MailOpen className="w-4 h-4" />
                                <span>Mark as read</span>
                            </Button>
                            <Button variant={"outline"} className="border-blue-200 text-blue-400 hover:text-blue-500">
                                <Archive className="w-4 h-4" />
                                <span>Archive</span>
                            </Button>
                            <Button variant={"outline"} className="border-orange-200 text-orange-400  hover:text-orange-500">
                                <MailWarning className="w-4 h-4" />
                                <span>Mark as Spam</span>
                            </Button>

                        </div>
                    )
                }
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-gray-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="w-fit ">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    onClick={() => {
                                        const message = row.original as GmailMessage
                                        router.push(`/dashboard/mail/${message.id}`)
                                    }}
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={
                                        cn(
                                            !(row.original as GmailMessage).isUnread && "bg-gray-100",
                                            "cursor-pointer"
                                        )
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>

    )
}