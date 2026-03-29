// Invoice Management Table Schema Constants
export const INVOICE_TABLE = {
  id: "tbl2dKkvEFWwSRBjhQ0",
  baseId: "bsePH2l9XDPenJU6LVu",
  dbTableName: '"bsePH2l9XDPenJU6LVu"."Fa_Piao_Guan_Li"',
  fields: {
    supplier: "fldmG6AXnH3obpNWW82",
    amount: "fld5OKngSbxd6dOGToA",
    currency: "fldlcGJKaY2AAd1lMzt",
    invoiceType: "fldBZnmCsp0ccOtB44w",
    invoiceFile: "fldNsWUah1T3bJvO93Y",
    notes: "fld9laYmJNLaUECsiV8",
    invoiceNumber: "fldgdGX6LXWzoAObDWu",
    invoiceDate: "fld3ILlSKdDAu7X5x5e",
    status: "fld3mkbc5UM9hKoRH8p",
  },
  dbFields: {
    supplier: "Gong_Ying_Shang",
    amount: "Jin_E",
    currency: "Bi_Zhong",
    invoiceType: "Fa_Piao_Lei_Xing",
    invoiceFile: "Fa_Piao_Wen_Jian",
    notes: "Bei_Zhu",
    invoiceNumber: "Fa_Piao_Bian_Hao",
    invoiceDate: "Fa_Piao_Ri_Qi",
    status: "Zhuang_Tai",
  },
} as const

export const CURRENCY_OPTIONS = ["USD", "CNY", "EUR"] as const
export const INVOICE_TYPE_OPTIONS = ["Service Fee", "Catering", "Procurement", "IT Services", "Fuel", "Others"] as const
export const STATUS_OPTIONS = ["Pending", "Reviewed", "Paid"] as const

export type Currency = (typeof CURRENCY_OPTIONS)[number]
export type InvoiceType = (typeof INVOICE_TYPE_OPTIONS)[number]
export type Status = (typeof STATUS_OPTIONS)[number]

export interface InvoiceData {
  id?: string
  invoiceNumber: string
  supplier: string
  invoiceDate: string
  amount: number
  currency: Currency
  invoiceType: InvoiceType
  notes?: string
  status?: Status
  invoiceFile?: {
    id: string
    name: string
    token: string
    path: string
    size: number
    mimetype: string
    presignedUrl?: string
  }[]
}
