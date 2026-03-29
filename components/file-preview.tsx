"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { X, FileText, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilePreviewProps {
  src: string
  alt: string
  type?: "image" | "pdf" | "unknown"
  onClose: () => void
}

function PreviewPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(children, document.body)
}

function PdfViewer({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load PDF.js library
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        // Load PDF.js from CDN
        if (!(window as any).pdfjsLib) {
          const script = document.createElement("script")
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          script.async = true
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        const pdfjsLib = (window as any).pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(src)
        const pdf = await loadingTask.promise
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError("Unable to load PDF preview")
        setIsLoading(false)
      }
    }

    loadPdfJs()
  }, [src])

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current!
        const context = canvas.getContext("2d")!

        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise
      } catch (err) {
        console.error("Error rendering page:", err)
      }
    }

    renderPage()
  }, [pdfDoc, currentPage, scale])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading PDF...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <a href={src} download>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-2 border-b bg-muted/30">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="border-l pl-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.min(3, s + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Canvas container */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-muted/20">
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>
    </div>
  )
}

export function FilePreview({ src, alt, type = "image", onClose }: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const isPdf = type === "pdf" || src.toLowerCase().includes(".pdf")

  return (
    <PreviewPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          onClick={onClose}
        >
          <X className="h-6 w-6 text-white" />
        </button>

        {isPdf ? (
          <div
            className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>PDF Preview</span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={src} download className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
            <div className="relative flex-1">
              <PdfViewer src={src} />
            </div>
          </div>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            <img
              src={src || "/placeholder.svg"}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        )}
      </div>
    </PreviewPortal>
  )
}
