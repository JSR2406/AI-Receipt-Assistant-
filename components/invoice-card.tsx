"use client"

import type React from "react"

import { useState } from "react"
import { FileText, Trash2, ZoomIn, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FilePreview } from "./file-preview"
import type { InvoiceData } from "@/lib/invoice-schema"

interface InvoiceCardProps {
  invoice: InvoiceData
  isSelected?: boolean
  onClick: () => void
  onDelete: () => void
  hideActions?: boolean
}

const typeColors: Record<string, string> = {
  "Service Fee": "bg-blue-500 text-white hover:bg-blue-500",
  Catering: "bg-orange-500 text-white hover:bg-orange-500",
  Procurement: "bg-purple-500 text-white hover:bg-purple-500",
  "IT Services": "bg-cyan-500 text-white hover:bg-cyan-500",
  Fuel: "bg-amber-500 text-white hover:bg-amber-500",
  Others: "bg-gray-500 text-white hover:bg-gray-500",
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  CNY: "¥",
  EUR: "€",
}

export function InvoiceCard({ invoice, isSelected, onClick, onDelete, hideActions }: InvoiceCardProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [imageError, setImageError] = useState(false)

  const attachment = invoice.invoiceFile?.[0]
  const thumbnailUrl = attachment?.presignedUrl || attachment?.url
  const fileName = attachment?.name || ""
  const isPdf = fileName.toLowerCase().endsWith(".pdf") || attachment?.mimetype === "application/pdf"

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (thumbnailUrl && !imageError) {
      setShowPreview(true)
    }
  }

  return (
    <>
      <div
        className={`group flex items-center gap-4 px-4 py-3 cursor-pointer rounded-lg transition-all hover:bg-muted/50 ${
          isSelected ? "bg-primary/5 border border-primary/30" : "border border-transparent"
        }`}
        onClick={onClick}
      >
        {/* Thumbnail - Simplified click handling */}
        <div
          role="button"
          tabIndex={0}
          className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted relative ${
            thumbnailUrl && !imageError ? "cursor-zoom-in" : "cursor-default"
          }`}
          onClick={handleThumbnailClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation()
              e.preventDefault()
              if (thumbnailUrl && !imageError) {
                setShowPreview(true)
              }
            }
          }}
        >
          {thumbnailUrl && !imageError ? (
            isPdf ? (
              <>
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 text-white" />
                </div>
              </>
            ) : (
              <>
                <img
                  src={thumbnailUrl || "/placeholder.svg"}
                  alt="Invoice thumbnail"
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 text-white" />
                </div>
              </>
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Invoice Number */}
        <div className="w-32 flex-shrink-0">
          <p className="font-medium text-sm truncate">{invoice.invoiceNumber || "No number"}</p>
        </div>

        {/* Supplier */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{invoice.supplier || "Unknown supplier"}</p>
        </div>

        {/* Amount */}
        <div className="w-24 flex-shrink-0 text-right">
          <span className="font-semibold text-sm">
            {currencySymbols[invoice.currency] || ""}
            {invoice.amount?.toFixed(2) || "0.00"}
          </span>
        </div>

        {/* Date */}
        <div className="w-24 flex-shrink-0 text-right">
          <span className="text-xs text-muted-foreground">
            {invoice.invoiceDate
              ? new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "No date"}
          </span>
        </div>

        {/* Type */}
        <div className="w-24 flex-shrink-0">
          <Badge variant="secondary" className={`text-xs ${typeColors[invoice.invoiceType || "Others"]}`}>
            {invoice.invoiceType || "Others"}
          </Badge>
        </div>

        <div className="flex items-center gap-1 w-16 justify-end">
          {!hideActions && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-180" : ""}`}
              />
            </>
          )}
        </div>
      </div>

      {showPreview && thumbnailUrl && (
        <FilePreview
          src={thumbnailUrl}
          alt={`Invoice ${invoice.invoiceNumber}`}
          type={isPdf ? "pdf" : "image"}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
