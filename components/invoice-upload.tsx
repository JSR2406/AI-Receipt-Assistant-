"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Camera, Upload, Loader2, Check, AlertCircle, ChevronDown, ChevronUp, X, ZoomIn, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { InvoiceData } from "@/lib/invoice-schema"
import { FilePreview } from "@/components/file-preview"

interface UploadItem {
  id: string
  file: File
  previewUrl: string
  status: "pending" | "processing" | "success" | "error"
  data?: InvoiceData
  error?: string
  expanded: boolean
  editData?: InvoiceData
}

interface InvoiceUploadProps {
  onRecognized: (data: InvoiceData, file: File) => void
  onBatchRecognized: (items: { data: InvoiceData; file: File }[]) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

export function InvoiceUpload({ onRecognized, onBatchRecognized, isProcessing, setIsProcessing }: InvoiceUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [previewFile, setPreviewFile] = useState<{ src: string; type: "image" | "pdf" } | null>(null)

  const processFile = async (item: UploadItem): Promise<UploadItem> => {
    try {
      const formData = new FormData()
      formData.append("file", item.file)

      const response = await fetch("/api/recognize-invoice", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Recognition failed")
      }

      const result = await response.json()
      return { ...item, status: "success", data: result.data, editData: result.data }
    } catch (error) {
      console.error("Failed to recognize invoice:", error)
      return { ...item, status: "error", error: "Recognition failed" }
    }
  }

  const processBatch = async (files: File[]) => {
    if (files.length === 0) return

    if (files.length === 1) {
      setIsProcessing(true)
      try {
        const formData = new FormData()
        formData.append("file", files[0])

        const response = await fetch("/api/recognize-invoice", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Recognition failed")
        const result = await response.json()
        onRecognized(result.data, files[0])
      } catch (error) {
        console.error("Failed to recognize invoice:", error)
      } finally {
        setIsProcessing(false)
      }
      return
    }

    setIsProcessing(true)
    const items: UploadItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
      expanded: false,
    }))
    setUploadItems(items)
    setOverallProgress(0)

    const results: UploadItem[] = []
    for (let i = 0; i < items.length; i++) {
      setUploadItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, status: "processing" } : item)))

      const result = await processFile(items[i])
      results.push(result)

      setUploadItems((prev) => prev.map((item, idx) => (idx === i ? result : item)))
      setOverallProgress(Math.round(((i + 1) / items.length) * 100))
    }

    setIsProcessing(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processBatch(Array.from(files))
    }
    e.target.value = ""
  }

  const toggleExpand = (id: string) => {
    setUploadItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, expanded: !item.expanded } : { ...item, expanded: false })),
    )
  }

  const removeItem = (id: string) => {
    setUploadItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const updateEditData = (id: string, field: keyof InvoiceData, value: string | number) => {
    setUploadItems((prev) =>
      prev.map((item) =>
        item.id === id && item.editData ? { ...item, editData: { ...item.editData, [field]: value } } : item,
      ),
    )
  }

  const confirmItem = (item: UploadItem) => {
    if (item.editData) {
      onRecognized(item.editData, item.file)
      removeItem(item.id)
    }
  }

  const confirmAll = () => {
    const successItems = uploadItems.filter((item) => item.status === "success" && item.editData)
    onBatchRecognized(successItems.map((item) => ({ data: item.editData!, file: item.file })))
    uploadItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    setUploadItems([])
  }

  const clearAll = () => {
    uploadItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    setUploadItems([])
    setOverallProgress(0)
  }

  const handleThumbnailClick = (e: React.MouseEvent, item: UploadItem) => {
    e.stopPropagation()
    const isPdf = item.file.type === "application/pdf" || item.file.name.toLowerCase().endsWith(".pdf")
    setPreviewFile({ src: item.previewUrl, type: isPdf ? "pdf" : "image" })
  }

  const successCount = uploadItems.filter((i) => i.status === "success").length
  const errorCount = uploadItems.filter((i) => i.status === "error").length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          variant="outline"
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Camera
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="gap-2 bg-foreground text-background hover:bg-foreground/90"
        >
          <Upload className="h-4 w-4" />
          Upload Receipt
        </Button>
      </div>

      {uploadItems.length > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Processing {uploadItems.length} invoice{uploadItems.length > 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground">
                  {successCount} completed{errorCount > 0 && `, ${errorCount} failed`}
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {uploadItems.map((item) => {
                const isPdf = item.file.type === "application/pdf" || item.file.name.toLowerCase().endsWith(".pdf")
                return (
                  <div
                    key={item.id}
                    className={cn("border rounded-lg overflow-hidden", item.expanded && "border-primary")}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                        item.expanded && "border-b bg-muted/30",
                      )}
                      onClick={() => item.status !== "pending" && item.status !== "processing" && toggleExpand(item.id)}
                    >
                      <button
                        type="button"
                        className="group relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-muted cursor-zoom-in"
                        onClick={(e) => handleThumbnailClick(e, item)}
                      >
                        {isPdf ? (
                          <div className="h-full w-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <img
                            src={item.previewUrl || "/placeholder.svg"}
                            alt=""
                            className="h-full w-full object-cover pointer-events-none"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                          <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file.name}</p>
                        {item.status === "success" && item.editData && (
                          <p className="text-xs text-muted-foreground">
                            {item.editData.invoiceNumber || "No number"} · {item.editData.supplier || "Unknown"}
                          </p>
                        )}
                        {item.status === "error" && <p className="text-xs text-destructive">{item.error}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === "pending" && (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        {item.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        {item.status === "success" && <Check className="h-4 w-4 text-emerald-500" />}
                        {item.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}

                        {(item.status === "success" || item.status === "error") && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeItem(item.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {item.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </>
                        )}
                      </div>
                    </div>

                    {item.expanded && item.editData && (
                      <div className="p-4 bg-muted/20 space-y-4">
                        <div className="flex gap-4">
                          <button
                            type="button"
                            className="group relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted cursor-zoom-in border"
                            onClick={(e) => handleThumbnailClick(e, item)}
                          >
                            {isPdf ? (
                              <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">PDF</span>
                              </div>
                            ) : (
                              <img
                                src={item.previewUrl || "/placeholder.svg"}
                                alt=""
                                className="h-full w-full object-cover pointer-events-none"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Invoice Number</Label>
                              <Input
                                value={item.editData.invoiceNumber || ""}
                                onChange={(e) => updateEditData(item.id, "invoiceNumber", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Supplier</Label>
                              <Input
                                value={item.editData.supplier || ""}
                                onChange={(e) => updateEditData(item.id, "supplier", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.editData.amount || ""}
                              onChange={(e) =>
                                updateEditData(item.id, "amount", Number.parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Currency</Label>
                            <Select
                              value={item.editData.currency || "USD"}
                              onValueChange={(value) => updateEditData(item.id, "currency", value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="CNY">CNY</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Date</Label>
                            <Input
                              type="date"
                              value={item.editData.invoiceDate || ""}
                              onChange={(e) => updateEditData(item.id, "invoiceDate", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={item.editData.invoiceType || "Others"}
                              onValueChange={(value) => updateEditData(item.id, "invoiceType", value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Service Fee">Service Fee</SelectItem>
                                <SelectItem value="Catering">Catering</SelectItem>
                                <SelectItem value="Procurement">Procurement</SelectItem>
                                <SelectItem value="IT Services">IT Services</SelectItem>
                                <SelectItem value="Fuel">Fuel</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button size="sm" onClick={() => confirmItem(item)}>
                            Save Invoice
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!isProcessing && successCount > 0 && (
              <div className="flex justify-between pt-2 border-t">
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
                <Button size="sm" onClick={confirmAll}>
                  Save All ({successCount})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isProcessing && uploadItems.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Recognizing invoice...
        </div>
      )}

      {previewFile && (
        <FilePreview
          src={previewFile.src}
          alt="Invoice preview"
          type={previewFile.type}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}
