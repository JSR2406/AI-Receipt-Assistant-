import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const invoiceSchema = z.object({
  invoiceNumber: z.string().describe("The invoice number or ID"),
  supplier: z.string().describe("The supplier/vendor name"),
  invoiceDate: z.string().describe("The invoice date in YYYY-MM-DD format"),
  amount: z.number().describe("The total amount on the invoice"),
  currency: z.enum(["USD", "CNY", "EUR"]).describe("The currency of the amount"),
  invoiceType: z
    .enum(["Service Fee", "Catering", "Procurement", "IT Services", "Fuel", "Others"])
    .describe("The type of invoice based on its content"),
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = file.type || "image/jpeg"

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: invoiceSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: "text",
              text: `Please analyze this invoice image and extract the following information:
- Invoice Number (发票号码)
- Supplier/Vendor Name (供应商)
- Invoice Date (发票日期) - format as YYYY-MM-DD
- Total Amount (金额) - as a number without currency symbol
- Currency (币种) - USD, CNY, or EUR
- Invoice Type (发票类型) - categorize as: Service Fee (服务费), Catering (餐饮), Procurement (采购), IT Services (IT服务), Fuel (燃油), or Others (其他)

If you cannot find certain information, make a reasonable guess based on the visible content.`,
            },
          ],
        },
      ],
    })

    return Response.json({ data: object })
  } catch (error) {
    console.error("Invoice recognition error:", error)
    return Response.json({ error: "Failed to recognize invoice" }, { status: 500 })
  }
}
