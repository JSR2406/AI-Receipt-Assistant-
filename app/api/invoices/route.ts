import { teable } from "@/lib/teable"
import { INVOICE_TABLE } from "@/lib/invoice-schema"

export async function GET() {
  try {
    const { rows } = await teable.sqlQuery(
      INVOICE_TABLE.baseId,
      `SELECT 
        "__id",
        "${INVOICE_TABLE.dbFields.invoiceNumber}",
        "${INVOICE_TABLE.dbFields.supplier}",
        "${INVOICE_TABLE.dbFields.invoiceDate}",
        "${INVOICE_TABLE.dbFields.amount}",
        "${INVOICE_TABLE.dbFields.currency}",
        "${INVOICE_TABLE.dbFields.invoiceType}",
        "${INVOICE_TABLE.dbFields.notes}",
        "${INVOICE_TABLE.dbFields.status}",
        "${INVOICE_TABLE.dbFields.invoiceFile}"
      FROM ${INVOICE_TABLE.dbTableName}
      ORDER BY "${INVOICE_TABLE.dbFields.invoiceDate}" DESC
      LIMIT 200`,
    )

    console.log("[v0] Raw first row:", rows[0])

    // Collect all attachments for signing
    const allAttachments: { path: string; token: string; mimetype?: string }[] = []
    const rowAttachmentMap = new Map<number, number[]>()

    rows.forEach((row, rowIndex) => {
      const attachments = teable.safeParseJson(row[INVOICE_TABLE.dbFields.invoiceFile])
      if (attachments && Array.isArray(attachments)) {
        const indices: number[] = []
        attachments.forEach((att: { path: string; token: string; mimetype?: string }) => {
          indices.push(allAttachments.length)
          allAttachments.push(att)
        })
        rowAttachmentMap.set(rowIndex, indices)
      }
    })

    // Sign all attachments at once
    const signedAttachments = await teable.signAttachments(INVOICE_TABLE.baseId, allAttachments)

    // Map back to rows
    const invoices = rows.map((row, rowIndex) => {
      const attachmentIndices = rowAttachmentMap.get(rowIndex) || []
      const invoiceFiles = attachmentIndices.map((i) => signedAttachments[i])

      console.log("[v0] Invoice type value:", row[INVOICE_TABLE.dbFields.invoiceType])

      return {
        id: row.__id,
        invoiceNumber: row[INVOICE_TABLE.dbFields.invoiceNumber],
        supplier: row[INVOICE_TABLE.dbFields.supplier],
        invoiceDate: row[INVOICE_TABLE.dbFields.invoiceDate],
        amount: row[INVOICE_TABLE.dbFields.amount],
        currency: row[INVOICE_TABLE.dbFields.currency],
        invoiceType: row[INVOICE_TABLE.dbFields.invoiceType],
        notes: row[INVOICE_TABLE.dbFields.notes],
        status: row[INVOICE_TABLE.dbFields.status],
        invoiceFile: invoiceFiles,
      }
    })

    console.log("[v0] First mapped invoice:", invoices[0])

    return Response.json({ invoices })
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return Response.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const record = await teable.createRecord(INVOICE_TABLE.id, {
      [INVOICE_TABLE.fields.invoiceNumber]: data.invoiceNumber,
      [INVOICE_TABLE.fields.supplier]: data.supplier,
      [INVOICE_TABLE.fields.invoiceDate]: data.invoiceDate,
      [INVOICE_TABLE.fields.amount]: data.amount,
      [INVOICE_TABLE.fields.currency]: data.currency,
      [INVOICE_TABLE.fields.invoiceType]: data.invoiceType,
      [INVOICE_TABLE.fields.notes]: data.notes || null,
      [INVOICE_TABLE.fields.status]: data.status || "Pending",
    })

    return Response.json({ record })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return Response.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
