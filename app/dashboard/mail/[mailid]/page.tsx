"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    ArrowLeft,
    Reply,
    ReplyAll,
    Forward,
    Trash2,
    Archive,
    Star,
    MoreHorizontal,
    Paperclip,
    AlertTriangle,
    LoaderCircle,
    Download,
    Eye,
    File,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileSpreadsheet,
    X,
    ZoomIn
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useNavigation } from "@/components/Providers/navigation-provider"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"

interface EmailMessage {
    id: string
    threadId: string
    labelIds: string[]
    snippet: string
    from_name: string
    from_email: string
    to_name: string
    to_email: string
    subject: string
    date: string
    cc: string
    bcc: string
    body: {
        text: string
        html: string
    }
    attachments: Array<{
        filename: string
        mimeType: string
        size: number
        attachmentId: string
    }>
    formattedDate: string
    isUnread: boolean
    isImportant: boolean
    isStarred: boolean
    isSpam: boolean
    isTrash: boolean
    category: string
}

export default function MailDetailPage({ params }: { params: Promise<{ mailid: string }> }) {
    const { mailid } = use(params)
    const [message, setMessage] = useState<EmailMessage | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<{ src: string; name: string } | null>(null)
    const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null)
    const router = useRouter()
    const { navigateBack } = useNavigation()

    useEffect(() => {
        fetchMessage()
    }, [mailid])

    // Handle ESC key for modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && imagePreview) {
                setImagePreview(null)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [imagePreview])

    const fetchMessage = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/mails/${mailid}`, {
                method: "GET",
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            setMessage(data.message)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Email yüklenirken hata oluştu')
            console.error('Error fetching message:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (action: string, messageId: string) => {
        setActionLoading(action)

        try {
            let endpoint = ''
            let method = 'POST'
            let body = {}

            switch (action) {
                case 'trash':
                    endpoint = '/api/mails/trash'
                    body = { messageIds: [messageId] }
                    break
                case 'spam':
                    endpoint = '/api/mails/spam'
                    body = { messageIds: [messageId] }
                    break
                case 'star':
                    // This would need to be implemented
                    toast.info('Yıldızlama özelliği yakında eklenecek')
                    return
                case 'archive':
                    // This would need to be implemented
                    toast.info('Arşivleme özelliği yakında eklenecek')
                    return
                default:
                    toast.error('Bilinmeyen işlem')
                    return
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                toast.success(action === 'trash' ? 'Email çöp kutusuna taşındı' : 'Email spam olarak işaretlendi')
                navigateBack()
            } else {
                throw new Error('İşlem başarısız')
            }
        } catch (error) {
            console.error('Action error:', error)
            toast.error('İşlem sırasında hata oluştu')
        } finally {
            setActionLoading(null)
        }
    }

    const getInitials = (name: string, email: string): string => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return email.split('@')[0].slice(0, 2).toUpperCase()
    }

    // Get file type icon based on MIME type
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return FileImage
        if (mimeType.startsWith('video/')) return FileVideo
        if (mimeType.startsWith('audio/')) return FileAudio
        if (mimeType.includes('pdf')) return FileText
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
        if (mimeType.includes('document') || mimeType.includes('word')) return FileText
        return File
    }

    // Check if file is an image
    const isImageFile = (mimeType: string) => {
        return mimeType.startsWith('image/')
    }

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Download attachment
    const downloadAttachment = async (attachment: any) => {
        setDownloadingAttachment(attachment.attachmentId)
        try {
            const response = await fetch(`/api/mails/${mailid}/attachments/${attachment.attachmentId}`)

            if (!response.ok) {
                throw new Error('Dosya indirilemedi')
            }

            const data = await response.json()

            // Convert base64url to base64 format
            let base64Data = data.data

            // Remove any whitespace, newlines
            base64Data = base64Data.replace(/\s/g, '')

            // Convert base64url to base64
            // Replace URL-safe characters with standard base64 characters
            base64Data = base64Data.replace(/-/g, '+').replace(/_/g, '/')

            // Add padding if needed (base64url doesn't use padding)
            while (base64Data.length % 4) {
                base64Data += '='
            }

            // Try to decode base64
            let byteCharacters
            try {
                byteCharacters = atob(base64Data)
            } catch (decodeError) {
                console.error('Base64 decode error:', decodeError)
                throw new Error('Dosya formatı desteklenmiyor')
            }

            // Convert to byte array
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)

            // Create blob and download
            const blob = new Blob([byteArray], { type: attachment.mimeType })

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = attachment.filename
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()

            // Cleanup
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Dosya indirildi')
        } catch (error) {
            console.error('Download error:', error)
            toast.error(error instanceof Error ? error.message : 'Dosya indirilemedi')
        } finally {
            setDownloadingAttachment(null)
        }
    }

    // Fixed previewImage function with proper base64 handling
    const previewImage = async (attachment: any) => {
        try {
            const response = await fetch(`/api/mails/${mailid}/attachments/${attachment.attachmentId}`)

            if (!response.ok) {
                throw new Error('Resim yüklenemedi')
            }

            const data = await response.json()

            // Convert base64url to base64 format
            let base64Data = data.data
            base64Data = base64Data.replace(/\s/g, '')

            // Convert base64url to base64
            base64Data = base64Data.replace(/-/g, '+').replace(/_/g, '/')

            // Add padding if needed
            while (base64Data.length % 4) {
                base64Data += '='
            }

            const imageSrc = `data:${attachment.mimeType};base64,${base64Data}`

            setImagePreview({
                src: imageSrc,
                name: attachment.filename
            })
        } catch (error) {
            console.error('Preview error:', error)
            toast.error(error instanceof Error ? error.message : 'Resim önizlemesi açılamadı')
        }
    }

    const renderEmailBody = (body: { text: string; html: string }) => {
        if (body.html) {
            return (
                <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: body.html }}
                />
            )
        } else if (body.text) {
            return (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {body.text}
                </div>
            )
        }
        return <div className="text-gray-500 italic">Email içeriği bulunamadı</div>
    }

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center flex flex-col items-center gap-3">
                    <LoaderCircle className="w-8 h-8 text-gray-600 animate-spin" />
                    <p className="text-sm text-gray-600">Email yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Yüklenemedi</h3>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <Button onClick={fetchMessage} size="sm">
                            Tekrar Dene
                        </Button>
                        <Button onClick={() => navigateBack()} variant="outline" size="sm">
                            Geri Dön
                        </Button>
                    </div>
                </div>

                {/* Image Preview Modal */}

            </div>
        )
    }

    if (!message) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Bulunamadı</h3>
                    <p className="text-sm text-gray-600 mb-4">Bu email mevcut değil veya silinmiş olabilir.</p>
                    <Button onClick={() => navigateBack()} variant="outline" size="sm">
                        Geri Dön
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header with Breadcrumb */}
            <div className="border-b bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateBack()}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri
                    </Button>
                    <Separator orientation="vertical" className=" h-4 " />
                    <h1 className="text-lg font-semibold">
                        {message.subject.length > 30
                            ? `${message.subject.slice(0, 30)}...`
                            : message.subject
                        }
                    </h1>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => toast.info('Yanıtlama özelliği yakında eklenecek')}
                    >
                        <Reply className="w-4 h-4" />
                        Yanıtla
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => toast.info('Tümünü yanıtlama özelliği yakında eklenecek')}
                    >
                        <ReplyAll className="w-4 h-4" />
                        Tümünü Yanıtla
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => toast.info('Yönlendirme özelliği yakında eklenecek')}
                    >
                        <Forward className="w-4 h-4" />
                        Yönlendir
                    </Button>

                    <Separator orientation="vertical" className="h-4 mx-2" />

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleAction('star', message.id)}
                        disabled={actionLoading === 'star'}
                    >
                        <Star className={`w-4 h-4 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleAction('archive', message.id)}
                        disabled={actionLoading === 'archive'}
                    >
                        <Archive className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-red-600 hover:text-red-700"
                        onClick={() => handleAction('trash', message.id)}
                        disabled={actionLoading === 'trash'}
                    >
                        {actionLoading === 'trash' ? (
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => handleAction('spam', message.id)}
                                disabled={actionLoading === 'spam'}
                                className="text-red-600"
                            >
                                {actionLoading === 'spam' ? (
                                    <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                )}
                                Spam Olarak İşaretle
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto p-6">
                    {/* Email Header */}
                    <div className="bg-white rounded-lg border p-6 mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-blue-500 text-white">
                                        {getInitials(message.from_name, message.from_email)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="font-semibold text-lg">{message.from_name || message.from_email}</h2>
                                        {message.isImportant && (
                                            <Badge variant="destructive" className="text-xs">Önemli</Badge>
                                        )}
                                        {message.category !== 'primary' && (
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {message.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{message.from_email}</p>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span>Kime: {message.to_email}</span>
                                        {message.cc && <span className="ml-4">Cc: {message.cc}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">
                                    {message.date ? format(new Date(message.date), "MMM d, yyyy") : ''}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {message.date ? format(new Date(message.date), "hh:mm a") : ''}
                                </p>
                            </div>
                        </div>

                        <h1 className="text-xl font-semibold mb-4 border-b pb-2">
                            {message.subject}
                        </h1>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Paperclip className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                        {message.attachments.length} Ek ({formatFileSize(message.attachments.reduce((total, att) => total + att.size, 0))})
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {message.attachments.map((attachment, index) => {
                                        const FileIconComponent = getFileIcon(attachment.mimeType)
                                        const isImage = isImageFile(attachment.mimeType)

                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg p-3 border transition-colors"
                                            >
                                                <div className="flex-shrink-0">
                                                    {isImage ? (
                                                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                                            <FileImage className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                            <FileIconComponent className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {attachment.filename}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatFileSize(attachment.size)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {isImage && (
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => previewImage(attachment)}
                                                                    className="h-8 w-8 p-0"
                                                                    title="Önizleme"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>{attachment.filename}</DialogTitle>

                                                                </DialogHeader>
                                                                <Image src={imagePreview?.src || '/placeholder.svg'} alt={imagePreview?.name || 'Loading...'} width={500} height={500} />
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => downloadAttachment(attachment)}
                                                        disabled={downloadingAttachment === attachment.attachmentId}
                                                        className="h-8 w-8 p-0"
                                                        title="İndir"
                                                    >
                                                        {downloadingAttachment === attachment.attachmentId ? (
                                                            <LoaderCircle className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Download className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Email Body */}
                        <div className="prose prose-sm max-w-none">
                            {renderEmailBody(message.body)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}