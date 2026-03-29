"use client"

import type React from "react"

import { useState } from "react"
import { FileText, ZoomIn, ChevronDown, ChevronUp, Trash2, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FilePreview } from "./file-preview"
import { cn } from "@/lib/utils"
import { CURRENCY_OPTIONS, INVOICE_TYPE_OPTIONS, STATUS_OPTIONS, type InvoiceData } from "@/lib/invoice-schema"

interface InvoiceListProps {
  invoices: InvoiceData[]
  selectedId: string | null
  onSelect: (invoice: InvoiceData | null) => void
  onUpdate: (data: InvoiceData) => Promise<void>
  onDelete: (id: string) => void
}

const statusColors: Record<string, string> = {
  Pending: "bg-blue-500 text-white",
  Reviewed: "bg-green-500 text-white",
  Paid: "bg-pink-500 text-white",
}

const typeColors: Record<string, string> = {
  "Service Fee": "bg-blue-500 text-white",
  Catering: "bg-orange-500 text-white",
  Procurement: "bg-purple-500 text-white",
  "IT Services": "bg-cyan-500 text-white",
  Fuel: "bg-amber-500 text-white",
  Others: "bg-gray-500 text-white",
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  CNY: "¥",
  EUR: "€",
}

function groupByMonth(invoices: InvoiceData[]): Record<string, InvoiceData[]> {
  const groups: Record<string, InvoiceData[]> = {}

  invoices.forEach((invoice) => {
    const date = invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date()
    const key = date.toLocaleDateString("en-US", { year: "numeric", month: "long" })
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(invoice)
  })

  return groups
}

export function InvoiceList({ invoices, selectedId, onSelect, onUpdate, onDelete }: InvoiceListProps) {
  const [editData, setEditData] = useState<InvoiceData | null>(null)
  const [previewFile, setPreviewFile] = useState<{ src: string; type: "image" | "pdf" } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const grouped = groupByMonth(invoices)
  const sortedMonths = Object.keys(grouped).sort((a, b) => {
    const dateA = new Date(a)
    const dateB = new Date(b)
    return dateB.getTime() - dateA.getTime()
  })

  const currentMonth = new Date()
  const currentMonthKey = currentMonth.toLocaleDateString("en-US", { year: "numeric", month: "long" })
  const thisMonthCount = grouped[currentMonthKey]?.length || 0

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(invoices.map((inv) => inv.id!)))
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedIds.size} receipt(s)?`)
    if (!confirmed) return

    for (const id of selectedIds) {
      onDelete(id)
    }
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }

  const cancelSelectMode = () => {
    setIsSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleRowClick = (invoice: InvoiceData) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(invoice.id!)) {
          next.delete(invoice.id!)
        } else {
          next.add(invoice.id!)
        }
        return next
      })
      return
    }

    if (selectedId === invoice.id) {
      onSelect(null)
      setEditData(null)
    } else {
      onSelect(invoice)
      const formattedDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split("T")[0] : ""
      setEditData({
        ...invoice,
        invoiceDate: formattedDate,
        invoiceType: invoice.invoiceType || "Others",
      })
    }
  }

  const handlePreviewClick = (e: React.MouseEvent, invoice: InvoiceData) => {
    e.stopPropagation()
    const attachment = invoice.invoiceFile?.[0]
    if (attachment?.presignedUrl) {
      const isPdf = attachment.name?.toLowerCase().endsWith(".pdf") || attachment.mimetype === "application/pdf"
      setPreviewFile({ src: attachment.presignedUrl, type: isPdf ? "pdf" : "image" })
    }
  }

  const handleSave = async () => {
    if (!editData) return
    setIsSaving(true)
    try {
      await onUpdate(editData)
      onSelect(null)
      setEditData(null)
    } finally {
      setIsSaving(false)
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">No receipts yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">Upload your first receipt to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">History</h2>
        <div className="flex items-center gap-3">
          {isSelectMode ? (
            <>
              <button onClick={selectAll} className="text-sm text-primary hover:underline">
                {selectedIds.size === invoices.length ? "Deselect All" : "Select All"}
              </button>
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={deleteSelected} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selectedIds.size})
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={cancelSelectMode}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">{thisMonthCount} new this month</span>
              <Button variant="outline" size="sm" onClick={() => setIsSelectMode(true)} className="gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                Select
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
        {isSelectMode && <div className="w-6 flex-shrink-0"></div>}
        <div className="w-12 flex-shrink-0"></div>
        <div className="w-32 flex-shrink-0">Receipt #</div>
        <div className="flex-1">Supplier</div>
        <div className="w-24 flex-shrink-0 text-right">Amount</div>
        <div className="w-24 flex-shrink-0 text-right">Date</div>
        <div className="w-24 flex-shrink-0">Type</div>
        {!isSelectMode && <div className="w-8"></div>}
      </div>

      {sortedMonths.map((month) => (
        <div key={month} className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground px-4 py-2 bg-muted/30 rounded-md">{month}</h3>

          <div className="divide-y divide-border/50">
            {grouped[month].map((invoice) => {
              const isSelected = invoice.id === selectedId
              const isChecked = selectedIds.has(invoice.id!)
              const attachment = invoice.invoiceFile?.[0]
              const hasFile = !!attachment?.presignedUrl
              const isPdf =
                attachment?.name?.toLowerCase().endsWith(".pdf") || attachment?.mimetype === "application/pdf"

              return (
                <div
                  key={invoice.id}
                  className={cn(
                    "border rounded-lg overflow-hidden mb-1",
                    isSelected && !isSelectMode && "border-primary",
                    isChecked && "border-primary bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      isSelected && !isSelectMode && "bg-muted/30",
                      isChecked && "bg-primary/5",
                    )}
                    onClick={() => handleRowClick(invoice)}
                  >
                    {isSelectMode && (
                      <div className="flex-shrink-0" onClick={(e) => toggleSelection(invoice.id!, e)}>
                        <Checkbox checked={isChecked} className="h-5 w-5" />
                      </div>
                    )}

                    <button
                      type="button"
                      className="group relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-muted cursor-zoom-in"
                      onClick={(e) => hasFile && handlePreviewClick(e, invoice)}
                      disabled={!hasFile}
                    >
                      {hasFile ? (
                        isPdf ? (
                          <div className="h-full w-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <img
                            src={attachment?.presignedUrl || "/placeholder.svg"}
                            alt=""
                            className="h-full w-full object-cover pointer-events-none"
                          />
                        )
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      {hasFile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                          <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0 sm:hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{invoice.invoiceNumber || "No number"}</span>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", typeColors[invoice.invoiceType || "Others"])}
                        >
                          {invoice.invoiceType || "Others"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{invoice.supplier || "Unknown"}</div>
                      <div className="text-sm font-medium">
                        {currencySymbols[invoice.currency] || "$"}
                        {invoice.amount?.toFixed(2)}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4 flex-1">
                      <div className="w-32 flex-shrink-0 font-medium truncate">
                        {invoice.invoiceNumber || "No number"}
                      </div>
                      <div className="flex-1 truncate text-muted-foreground">{invoice.supplier || "Unknown"}</div>
                      <div className="w-24 flex-shrink-0 text-right font-medium">
                        {currencySymbols[invoice.currency] || "$"}
                        {invoice.amount?.toFixed(2)}
                      </div>
                      <div className="w-24 flex-shrink-0 text-right text-sm text-muted-foreground">
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </div>
                      <div className="w-24 flex-shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", typeColors[invoice.invoiceType || "Others"])}
                        >
                          {invoice.invoiceType || "Others"}
                        </Badge>
                      </div>
                    </div>

                    {!isSelectMode && (
                      <div className="flex items-center">
                        {isSelected ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>

                  {!isSelectMode && isSelected && editData && (
                    <div className="p-4 bg-muted/20 border-t space-y-4">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          className="group relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted cursor-zoom-in border"
                          onClick={(e) => hasFile && handlePreviewClick(e, invoice)}
                          disabled={!hasFile}
                        >
                          {hasFile ? (
                            isPdf ? (
                              <div className="h-full w-full flex flex-col items-center justify-center gap-1">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">PDF</span>
                              </div>
                            ) : (
                              <img
                                src={attachment?.presignedUrl || "/placeholder.svg"}
                                alt=""
                                className="h-full w-full object-cover pointer-events-none"
                              />
                            )
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          {hasFile && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Receipt Number</Label>
                            <Input
                              value={editData.invoiceNumber || ""}
                              onChange={(e) => setEditData({ ...editData, invoiceNumber: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Supplier</Label>
                            <Input
                              value={editData.supplier || ""}
                              onChange={(e) => setEditData({ ...editData, supplier: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Amount</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.amount || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, amount: Number.parseFloat(e.target.value) || 0 })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Currency</Label>
                          <Select
                            value={editData.currency || "USD"}
                            onValueChange={(value) =>
                              setEditData({ ...editData, currency: value as typeof editData.currency })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCY_OPTIONS.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={editData.invoiceDate || ""}
                            onChange={(e) => setEditData({ ...editData, invoiceDate: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={editData.invoiceType || "Others"}
                            onValueChange={(value) =>
                              setEditData({ ...editData, invoiceType: value as typeof editData.invoiceType })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INVOICE_TYPE_OPTIONS.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Status</Label>
                          <Select
                            value={editData.status || "Pending"}
                            onValueChange={(value) =>
                              setEditData({ ...editData, status: value as typeof editData.status })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSelect(null)
                            setEditData(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {previewFile && (
        <FilePreview src={previewFile.src} type={previewFile.type} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  )
}
