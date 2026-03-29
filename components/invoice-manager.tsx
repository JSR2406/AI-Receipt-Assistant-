"use client"

import { useState, useEffect } from "react"
import { Sparkles, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { InvoiceUpload } from "./invoice-upload"
import { InvoiceForm } from "./invoice-form"
import { InvoiceList } from "./invoice-list"
import { useToast } from "@/hooks/use-toast"
import type { InvoiceData } from "@/lib/invoice-schema"

export function InvoiceManager() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognizedData, setRecognizedData] = useState<InvoiceData | null>(null)
  const [recognizedFile, setRecognizedFile] = useState<File | null>(null)
  const [recognizedPreviewUrl, setRecognizedPreviewUrl] = useState<string>("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices")
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setInvoices(data.invoices)
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
      toast({
        title: "Load Failed",
        description: "Unable to load invoice list, please refresh",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleRecognized = (data: InvoiceData, file: File) => {
    setRecognizedData(data)
    setRecognizedFile(file)
    setRecognizedPreviewUrl(URL.createObjectURL(file))
    setSelectedInvoiceId(null)
  }

  const handleBatchRecognized = async (items: { data: InvoiceData; file: File }[]) => {
    let successCount = 0
    for (const item of items) {
      try {
        const response = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        })

        if (!response.ok) throw new Error("Failed to save")
        const result = await response.json()

        if (result.record?.id) {
          const formData = new FormData()
          formData.append("file", item.file)
          await fetch(`/api/invoices/${result.record.id}/upload`, {
            method: "POST",
            body: formData,
          })
        }
        successCount++
      } catch (error) {
        console.error("Failed to save invoice:", error)
      }
    }

    toast({
      title: "Batch Save Complete",
      description: `${successCount} of ${items.length} invoices saved successfully`,
    })

    fetchInvoices()
  }

  const handleSaveNew = async (data: InvoiceData, file?: File) => {
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save")
      const result = await response.json()

      if (file && result.record?.id) {
        const formData = new FormData()
        formData.append("file", file)
        await fetch(`/api/invoices/${result.record.id}/upload`, {
          method: "POST",
          body: formData,
        })
      }

      toast({
        title: "Saved Successfully",
        description: "Invoice has been saved",
      })

      setRecognizedData(null)
      setRecognizedFile(null)
      setRecognizedPreviewUrl("")
      fetchInvoices()
    } catch (error) {
      console.error("Failed to save invoice:", error)
      toast({
        title: "Save Failed",
        description: "Unable to save invoice, please try again",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (data: InvoiceData) => {
    if (!data.id) return

    try {
      const response = await fetch(`/api/invoices/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update")

      toast({
        title: "Updated Successfully",
        description: "Invoice has been updated",
      })

      setSelectedInvoiceId(null)
      fetchInvoices()
    } catch (error) {
      console.error("Failed to update invoice:", error)
      toast({
        title: "Update Failed",
        description: "Unable to update invoice, please try again",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      toast({
        title: "Deleted Successfully",
        description: "Invoice has been deleted",
      })

      if (selectedInvoiceId === id) {
        setSelectedInvoiceId(null)
      }
      fetchInvoices()
    } catch (error) {
      console.error("Failed to delete invoice:", error)
      toast({
        title: "Delete Failed",
        description: "Unable to delete invoice, please try again",
        variant: "destructive",
      })
    }
  }

  const handleSelectInvoice = (invoice: InvoiceData | null) => {
    setSelectedInvoiceId(invoice?.id || null)
    if (invoice) {
      setRecognizedData(null)
      setRecognizedFile(null)
      setRecognizedPreviewUrl("")
    }
  }

  const totalAmount = invoices.reduce((sum, inv) => {
    const amount = inv.amount || 0
    return sum + (inv.currency === "CNY" ? amount / 7 : inv.currency === "EUR" ? amount * 1.1 : amount)
  }, 0)

  const pendingCount = invoices.filter((inv) => inv.status === "Pending").length

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-br from-card to-muted/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">AI-Powered</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">AI Receipt Assistant</h1>
            <p className="text-muted-foreground mb-6">
              Upload receipts or invoices, and let AI automatically extract key information—fast, accurate, and
              effortless.
            </p>

            <InvoiceUpload
              onRecognized={handleRecognized}
              onBatchRecognized={handleBatchRecognized}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />

            <div className="flex items-center gap-6 mt-6 pt-6 border-t">
              <div>
                <span className="text-2xl font-bold">{invoices.length}</span>
                <span className="text-muted-foreground ml-1 text-sm">receipts</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-2xl font-bold">{pendingCount}</span>
                <span className="text-muted-foreground ml-1 text-sm">pending</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-2xl font-bold">${totalAmount.toFixed(0)}</span>
                <span className="text-muted-foreground ml-1 text-sm">total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recognition Result Form */}
        {recognizedData && (
          <InvoiceForm
            data={recognizedData}
            file={recognizedFile || undefined}
            previewUrl={recognizedPreviewUrl}
            onSave={handleSaveNew}
            onCancel={() => {
              setRecognizedData(null)
              setRecognizedFile(null)
              setRecognizedPreviewUrl("")
            }}
          />
        )}

        {/* Invoice List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <InvoiceList
            invoices={invoices}
            selectedId={selectedInvoiceId}
            onSelect={handleSelectInvoice}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}

        <div className="relative rounded-lg bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-[1px]">
          <div className="rounded-lg bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
            <a
              href="https://app.teable.ai/base/bsePH2l9XDPenJU6LVu/table/tbl2dKkvEFWwSRBjhQ0/viwv3DLV0yI8YfTwMRY"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-primary" />
            </a>
            <p className="text-sm text-muted-foreground">
              Need to share receipts with your accountant?{" "}
              <span className="text-foreground/80">
                Go back to your{" "}
                <a
                  href="https://app.teable.ai/base/bsePH2l9XDPenJU6LVu/table/tbl2dKkvEFWwSRBjhQ0/viwv3DLV0yI8YfTwMRY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Teable receipt database
                </a>{" "}
                to share records directly.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
