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
    LoaderCircle
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
import { 
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { toast } from "sonner"

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
    const router = useRouter()

    useEffect(() => {
        fetchMessage()
    }, [mailid])

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
                router.push('/dashboard/mail#inbox')
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
                        <Button onClick={() => router.push('/dashboard/mail#inbox')} variant="outline" size="sm">
                            Geri Dön
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (!message) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Bulunamadı</h3>
                    <p className="text-sm text-gray-600 mb-4">Bu email mevcut değil veya silinmiş olabilir.</p>
                    <Button onClick={() => router.push('/dashboard/mail#inbox')} variant="outline" size="sm">
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
                        onClick={() => router.push('/dashboard/mail#inbox')}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">GMail</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/mail">Emails</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    {message.subject.length > 30 
                                        ? `${message.subject.slice(0, 30)}...` 
                                        : message.subject
                                    }
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
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
                                <div className="flex items-center gap-2 mb-2">
                                    <Paperclip className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                        {message.attachments.length} Ek
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {message.attachments.map((attachment, index) => (
                                        <div 
                                            key={index}
                                            className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2 text-sm"
                                        >
                                            <Paperclip className="w-3 h-3" />
                                            <span>{attachment.filename}</span>
                                            <span className="text-xs text-gray-500">
                                                ({Math.round(attachment.size / 1024)}KB)
                                            </span>
                                        </div>
                                    ))}
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