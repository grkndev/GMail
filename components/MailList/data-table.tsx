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

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [rowSelection, setRowSelection] = useState({})
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


    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Filter emails..."
                    value={(table.getColumn("from")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("from")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Button variant={"outline"}>
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
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the selected emails
                                            and remove them from your inbox.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
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
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={
                                        cn(
                                            !(row.original as GmailMessage).isUnread && "bg-gray-100"
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