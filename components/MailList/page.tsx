"use client"

import { useState, useEffect } from "react"
import { CONSTANTS, dumyGmailMessage } from "@/lib/utils"
import { columns } from "./columns"
import { GmailMessage } from "./email.type"
import { DataTable } from "./data-table"
import { LoaderCircle } from "lucide-react"

// Mapping hash values to API endpoint paths
const HASH_TO_ENDPOINT_MAP: Record<string, string> = {
    'inbox': '/api/mails/inbox',
    'starred': '/api/mails/starred',
    'outbox': '/api/mails/outbox',
    'spam': '/api/mails/spam',
    'trash': '/api/mails/trash',
    '': '/api/mails', // Default endpoint for empty hash
}

async function fetchMailData(endpoint: string): Promise<GmailMessage[]> {
    // For development, return dummy data for now
    // You mentioned you'll create the specific endpoints later
    // await new Promise(resolve => setTimeout(resolve, 1_000))
    // return dumyGmailMessage

    // Future implementation when endpoints are ready:

    const response = await fetch(endpoint, {
        method: "GET",
        credentials: 'include'
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json()
    return data.messages as GmailMessage[]

}

export default function MailListPage() {
    const [data, setData] = useState<GmailMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentHash, setCurrentHash] = useState('')

    // Get current hash from URL
    const getCurrentHash = () => {
        if (typeof window !== 'undefined') {
            return window.location.hash.replace('#', '')
        }
        return ''
    }

    // Load data based on current hash
    const loadData = async (hash: string) => {
        setLoading(true)
        setError(null)

        try {
            const endpoint = HASH_TO_ENDPOINT_MAP[hash] || HASH_TO_ENDPOINT_MAP['']
            const mailData = await fetchMailData(endpoint)
            setData(mailData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Error loading mail data:', err)
        } finally {
            setLoading(false)
        }
    }

    // Handle hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const newHash = getCurrentHash()
            setCurrentHash(newHash)
            loadData(newHash)
        }

        // Load initial data
        const initialHash = getCurrentHash()
        setCurrentHash(initialHash)
        loadData(initialHash)

        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange)

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('hashchange', handleHashChange)
        }
    }, [])

    if (loading) {
        return (
            <div className="w-full py-10 flex items-center justify-center">
                <div className="text-center flex flex-col items-center gap-2">
                    <LoaderCircle className="w-8 h-8 text-gray-600 animate-spin" />
                    <p className="mt-2 text-sm text-gray-600">Loading emails...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full py-10 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 font-medium">Error loading emails</p>
                    <p className="text-sm text-gray-600 mt-1">{error}</p>
                    <button
                        onClick={() => loadData(currentHash)}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full py-10">
            <DataTable columns={columns} data={data} />
        </div>
    )
}