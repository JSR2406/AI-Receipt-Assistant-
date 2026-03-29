import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { ErrorReporter, ReactErrorBoundary } from "@/components/error-reporter"

const _geistSans = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Receipt Assistant",
  description:
    "AI-powered receipt and invoice recognition and management app. Upload receipts, extract key information automatically—fast, accurate, and effortless.",
  openGraph: {
    title: "AI Receipt Assistant",
    description:
      "AI-powered receipt and invoice recognition and management app. Upload receipts, extract key information automatically—fast, accurate, and effortless.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "AI Receipt Assistant",
    description:
      "AI-powered receipt and invoice recognition and management app. Upload receipts, extract key information automatically—fast, accurate, and effortless.",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ReactErrorBoundary>{children}</ReactErrorBoundary>
        <Toaster />
        <Analytics />
        <ErrorReporter />
      </body>
    </html>
  )
}
