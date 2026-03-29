import { teable } from "@/lib/teable"
import { INVOICE_TABLE } from "@/lib/invoice-schema"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    await teable.uploadAttachmentToRecord(INVOICE_TABLE.id, id, INVOICE_TABLE.fields.invoiceFile, file)

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to upload attachment:", error)
    return Response.json({ error: "Failed to upload attachment" }, { status: 500 })
  }
}
