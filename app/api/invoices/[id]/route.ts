import { teable } from "@/lib/teable"
import { INVOICE_TABLE } from "@/lib/invoice-schema"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    const fields: Record<string, unknown> = {}

    if (data.invoiceNumber !== undefined) fields[INVOICE_TABLE.fields.invoiceNumber] = data.invoiceNumber
    if (data.supplier !== undefined) fields[INVOICE_TABLE.fields.supplier] = data.supplier
    if (data.invoiceDate !== undefined) fields[INVOICE_TABLE.fields.invoiceDate] = data.invoiceDate
    if (data.amount !== undefined) fields[INVOICE_TABLE.fields.amount] = data.amount
    if (data.currency !== undefined) fields[INVOICE_TABLE.fields.currency] = data.currency
    if (data.invoiceType !== undefined) fields[INVOICE_TABLE.fields.invoiceType] = data.invoiceType
    if (data.notes !== undefined) fields[INVOICE_TABLE.fields.notes] = data.notes
    if (data.status !== undefined) fields[INVOICE_TABLE.fields.status] = data.status

    const record = await teable.updateRecord(INVOICE_TABLE.id, id, fields)

    return Response.json({ record })
  } catch (error) {
    console.error("Failed to update invoice:", error)
    return Response.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await teable.deleteRecord(INVOICE_TABLE.id, id)
    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete invoice:", error)
    return Response.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
