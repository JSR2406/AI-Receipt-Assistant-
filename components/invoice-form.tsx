"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Save, X, FileText, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CURRENCY_OPTIONS, INVOICE_TYPE_OPTIONS, STATUS_OPTIONS, type InvoiceData } from "@/lib/invoice-schema"
import { FilePreview } from "@/components/file-preview"

interface InvoiceFormProps {
  data: InvoiceData
  file?: File
  previewUrl?: string
  onSave: (data: InvoiceData, file?: File) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export function InvoiceForm({ data, file, previewUrl, onSave, onCancel, isEdit = false }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceData>(data)
  const [isSaving, setIsSaving] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(formData, file)
    } finally {
      setIsSaving(false)
    }
  }

  const attachment = data.invoiceFile?.[0]
  const displayUrl = previewUrl || attachment?.presignedUrl || attachment?.url

  const fileName = file?.name || attachment?.name || ""
  const isPdf = fileName.toLowerCase().endsWith(".pdf") || file?.type === "application/pdf"

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (displayUrl) {
      setPreviewOpen(true)
    }
  }

  return (
    <>
      <Card className="border-primary/20 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{isEdit ? "Edit Invoice" : "Recognition Result"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {displayUrl && !imageError && (
                <div className="md:col-span-2">
                  <Label>Invoice Preview</Label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={handlePreviewClick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation()
                        e.preventDefault()
                        setPreviewOpen(true)
                      }
                    }}
                    className="mt-1.5 w-full overflow-hidden rounded-lg border bg-muted/50 cursor-zoom-in group relative"
                  >
                    {isPdf ? (
                      <div className="h-48 w-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText className="h-12 w-12" />
                          <span className="text-sm">PDF Document</span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={displayUrl || "/placeholder.svg"}
                        alt="Invoice preview"
                        className="h-48 w-full object-contain"
                        onError={() => setImageError(true)}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click to enlarge</p>
                </div>
              )}

              {(!displayUrl || imageError) && (
                <div className="md:col-span-2">
                  <Label>Invoice Preview</Label>
                  <div className="mt-1.5 overflow-hidden rounded-lg border bg-muted/50 h-48 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="Enter invoice number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value as typeof formData.currency })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceType">Invoice Type</Label>
                <Select
                  value={formData.invoiceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, invoiceType: value as typeof formData.invoiceType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || "Pending"}
                    onValueChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add notes..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {previewOpen && displayUrl && (
        <FilePreview
          src={displayUrl}
          alt="Invoice preview"
          type={isPdf ? "pdf" : "image"}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}
