"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, Save, Paperclip, X, Upload, Bold, Italic, Link, LoaderCircle, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useNavigation } from "@/components/Providers/navigation-provider"

interface EmailFormData {
    to: string[]
    cc: string[]
    bcc: string[]
    subject: string
    body: string
    attachments: File[]
}

interface EmailValidation {
    to: string
    subject: string
    body: string
}

export default function NewMailPage() {
    const router = useRouter()
    const { navigateBack } = useNavigation()
    const bodyRef = useRef<HTMLTextAreaElement>(null)
    
    // Form state
    const [formData, setFormData] = useState<EmailFormData>({
        to: [],
        cc: [],
        bcc: [],
        subject: "",
        body: "",
        attachments: []
    })
    
    // Input states for email fields
    const [toInput, setToInput] = useState("")
    const [ccInput, setCcInput] = useState("")
    const [bccInput, setBccInput] = useState("")
    
    // UI states
    const [showCC, setShowCC] = useState(false)
    const [showBCC, setShowBCC] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSavingDraft, setIsSavingDraft] = useState(false)
    const [errors, setErrors] = useState<EmailValidation>({ to: "", subject: "", body: "" })
    const [isDraftSaved, setIsDraftSaved] = useState(false)

    // Email validation
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email.trim())
    }

    // Add email to recipients list
    const addEmailToList = (email: string, type: 'to' | 'cc' | 'bcc') => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail) return

        if (!validateEmail(trimmedEmail)) {
            toast.error("Geçersiz email adresi")
            return
        }

        const currentList = formData[type]
        if (currentList.includes(trimmedEmail)) {
            toast.error("Bu email adresi zaten ekli")
            return
        }

        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], trimmedEmail]
        }))

        // Clear input
        if (type === 'to') setToInput("")
        if (type === 'cc') setCcInput("")
        if (type === 'bcc') setBccInput("")
    }

    // Remove email from recipients list
    const removeEmailFromList = (email: string, type: 'to' | 'cc' | 'bcc') => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter(e => e !== email)
        }))
    }

    // Handle key press for email inputs
    const handleKeyPress = (e: React.KeyboardEvent, type: 'to' | 'cc' | 'bcc') => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault()
            const input = type === 'to' ? toInput : type === 'cc' ? ccInput : bccInput
            addEmailToList(input, type)
        }
    }

    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const result = reader.result as string
                // Remove data:mime/type;base64, prefix
                const base64 = result.split(',')[1]
                resolve(base64)
            }
            reader.onerror = error => reject(error)
        })
    }

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const maxSize = 25 * 1024 * 1024 // 25MB limit
        
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`${file.name} dosyası çok büyük (max 25MB)`)
                return false
            }
            return true
        })

        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...validFiles]
        }))
        
        // Clear input
        if (e.target) e.target.value = ""
    }

    // Remove attachment
    const removeAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }))
    }

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: EmailValidation = { to: "", subject: "", body: "" }
        let isValid = true

        if (formData.to.length === 0) {
            newErrors.to = "En az bir alıcı gerekli"
            isValid = false
        }

        if (!formData.subject.trim()) {
            newErrors.subject = "Konu gerekli"
            isValid = false
        }

        if (!formData.body.trim()) {
            newErrors.body = "Email içeriği gerekli"
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    // Save draft
    const saveDraft = async () => {
        setIsSavingDraft(true)
        try {
            // Save to localStorage for now
            const draftKey = `email_draft_${Date.now()}`
            localStorage.setItem(draftKey, JSON.stringify({
                ...formData,
                attachments: formData.attachments.map(f => f.name) // Can't serialize File objects
            }))
            setIsDraftSaved(true)
            toast.success("Taslak kaydedildi")
        } catch (error) {
            console.error("Draft save error:", error)
            toast.error("Taslak kaydedilemedi")
        } finally {
            setIsSavingDraft(false)
        }
    }

    // Send email
    const sendEmail = async () => {
        if (!validateForm()) {
            return
        }

        setIsLoading(true)
        try {
            // Show processing message for attachments
            if (formData.attachments.length > 0) {
                toast.info(`${formData.attachments.length} ek işleniyor...`)
            }

            // Convert attachments to base64
            const attachmentsWithData = await Promise.all(
                formData.attachments.map(async (file) => {
                    const base64Data = await fileToBase64(file)
                    return {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        data: base64Data
                    }
                })
            )

            const response = await fetch('/api/mails/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: formData.to,
                    cc: formData.cc,
                    bcc: formData.bcc,
                    subject: formData.subject,
                    body: formData.body,
                    attachments: attachmentsWithData
                })
            })

            if (response.ok) {
                const successMessage = formData.attachments.length > 0 
                    ? `Email ${formData.attachments.length} ek ile birlikte başarıyla gönderildi!`
                    : "Email başarıyla gönderildi!"
                toast.success(successMessage)
                
                // Clear draft from localStorage
                const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('email_draft_'))
                draftKeys.forEach(key => localStorage.removeItem(key))
                
                // Navigate back to mail list
                navigateBack()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Email gönderilemedi')
            }
        } catch (error) {
            console.error("Send email error:", error)
            toast.error(error instanceof Error ? error.message : "Email gönderilemedi")
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-save draft every 30 seconds
    useEffect(() => {
        if (formData.to.length > 0 || formData.subject || formData.body) {
            const interval = setInterval(() => {
                saveDraft()
            }, 30000)
            
            return () => clearInterval(interval)
        }
    }, [formData])

    // Text formatting functions
    const insertFormatting = (tag: string) => {
        const textarea = bodyRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = formData.body.substring(start, end)
        
        let formattedText = ""
        switch (tag) {
            case 'bold':
                formattedText = `**${selectedText || 'bold text'}**`
                break
            case 'italic':
                formattedText = `*${selectedText || 'italic text'}*`
                break
            case 'link':
                formattedText = `[${selectedText || 'link text'}](https://example.com)`
                break
        }

        const newBody = formData.body.substring(0, start) + formattedText + formData.body.substring(end)
        setFormData(prev => ({ ...prev, body: newBody }))
        
        // Focus back to textarea
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
        }, 10)
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="border-b bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateBack()}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Geri
                        </Button>
                        <Separator orientation="vertical" className="h-4" />
                        <h1 className="text-lg font-semibold">Yeni Email</h1>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={saveDraft}
                            disabled={isSavingDraft}
                            className="gap-2"
                        >
                            {isSavingDraft ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isDraftSaved ? "Kaydedildi" : "Taslak Kaydet"}
                        </Button>
                        
                        <Button
                            onClick={sendEmail}
                            disabled={isLoading}
                            className="gap-2"
                        >
                            {isLoading ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Gönder
                        </Button>
                    </div>
                </div>
            </div>

            {/* Composition Form */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg border p-6 space-y-4">
                        {/* To Field */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="to" className="text-sm font-medium w-12">
                                    Kime:
                                </Label>
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {formData.to.map((email, index) => (
                                            <Badge key={index} variant="secondary" className="gap-1">
                                                {email}
                                                <X 
                                                    className="w-3 h-3 cursor-pointer" 
                                                    onClick={() => removeEmailFromList(email, 'to')}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                    <Input
                                        id="to"
                                        type="email"
                                        value={toInput}
                                        onChange={(e) => setToInput(e.target.value)}
                                        onKeyDown={(e) => handleKeyPress(e, 'to')}
                                        onBlur={() => {
                                            if (toInput.trim()) {
                                                addEmailToList(toInput, 'to')
                                            }
                                        }}
                                        placeholder="Email adresi ekleyin (Enter, virgül veya noktalı virgül ile ayırın)"
                                        className={errors.to ? "border-red-500" : ""}
                                    />
                                    {errors.to && <p className="text-red-500 text-xs mt-1">{errors.to}</p>}
                                </div>
                                <div className="flex gap-1">
                                    {!showCC && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowCC(true)}
                                            className="text-xs h-6 px-2"
                                        >
                                            CC
                                        </Button>
                                    )}
                                    {!showBCC && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowBCC(true)}
                                            className="text-xs h-6 px-2"
                                        >
                                            BCC
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CC Field */}
                        {showCC && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="cc" className="text-sm font-medium w-12">
                                        CC:
                                    </Label>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {formData.cc.map((email, index) => (
                                                <Badge key={index} variant="secondary" className="gap-1">
                                                    {email}
                                                    <X 
                                                        className="w-3 h-3 cursor-pointer" 
                                                        onClick={() => removeEmailFromList(email, 'cc')}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                        <Input
                                            id="cc"
                                            type="email"
                                            value={ccInput}
                                            onChange={(e) => setCcInput(e.target.value)}
                                            onKeyDown={(e) => handleKeyPress(e, 'cc')}
                                            onBlur={() => {
                                                if (ccInput.trim()) {
                                                    addEmailToList(ccInput, 'cc')
                                                }
                                            }}
                                            placeholder="CC email adresleri"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCC(false)}
                                        className="text-xs h-6 px-2"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* BCC Field */}
                        {showBCC && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="bcc" className="text-sm font-medium w-12">
                                        BCC:
                                    </Label>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {formData.bcc.map((email, index) => (
                                                <Badge key={index} variant="secondary" className="gap-1">
                                                    {email}
                                                    <X 
                                                        className="w-3 h-3 cursor-pointer" 
                                                        onClick={() => removeEmailFromList(email, 'bcc')}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                        <Input
                                            id="bcc"
                                            type="email"
                                            value={bccInput}
                                            onChange={(e) => setBccInput(e.target.value)}
                                            onKeyDown={(e) => handleKeyPress(e, 'bcc')}
                                            onBlur={() => {
                                                if (bccInput.trim()) {
                                                    addEmailToList(bccInput, 'bcc')
                                                }
                                            }}
                                            placeholder="BCC email adresleri"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowBCC(false)}
                                        className="text-xs h-6 px-2"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Subject Field */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="subject" className="text-sm font-medium w-12">
                                    Konu:
                                </Label>
                                <div className="flex-1">
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                        placeholder="Email konusu"
                                        className={errors.subject ? "border-red-500" : ""}
                                    />
                                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Body Field with Formatting */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="body" className="text-sm font-medium">
                                    İçerik:
                                </Label>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => insertFormatting('bold')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => insertFormatting('italic')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => insertFormatting('link')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Link className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <textarea
                                ref={bodyRef}
                                id="body"
                                value={formData.body}
                                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                                placeholder="Email içeriğinizi buraya yazın..."
                                rows={12}
                                className={`w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.body ? "border-red-500" : "border-gray-300"
                                }`}
                            />
                            {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body}</p>}
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Ekler:</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <Label htmlFor="file-upload" className="cursor-pointer">
                                        <Button variant="ghost" size="sm" className="gap-2" asChild>
                                            <span>
                                                <Paperclip className="w-4 h-4" />
                                                Dosya Ekle
                                            </span>
                                        </Button>
                                    </Label>
                                </div>
                            </div>
                            
                            {formData.attachments.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                        <span>{formData.attachments.length} dosya</span>
                                        <span>
                                            Toplam: {formatFileSize(formData.attachments.reduce((total, file) => total + file.size, 0))}
                                        </span>
                                    </div>
                                    {formData.attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm">{file.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {formatFileSize(file.size)}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeAttachment(index)}
                                                className="h-6 w-6 p-0"
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}