export interface ModalProps {
  onClose: () => void;
  onSubmit?: (data: any) => void | Promise<void>;
  isOpen: boolean;
  data?: any;
  id?: number | null;
  type?: "quotation" | "invoice" | "salesreturn" | "pickup" | "delivery";
  onSaved?: (entity: any) => void;
}

export interface tabsType {
  id: string;
  label: string;
  icon?: any;
}
export interface filter {
  page: number;
  limit: number;
  search: string;
  status?: string;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
}

export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InvoiceItem {
  product_id?: number;
  product_name: string;
  price: number;
  quantity: number;
  serial_no?: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  doctor?: string;
}

export interface BillDetails {
  no: string;
  invoice_date: string;
  items: InvoiceItem[];
  subtotal: number;
  gstAmount: number;
  /** Half of `gstAmount` each — shown as the CGST/SGST split on the PDF. */
  cgstAmount?: number;
  sgstAmount?: number;
  finalAmount: number;
  gstPercentage: number;
  /** Post-tax discount, already clamped. Omitted/0 when there is no discount. */
  discountAmount?: number;
  /** Pre-formatted label, e.g. "Discount (10%)" or "Discount". */
  discountLabel?: string;
  /** Shipping/delivery fee added after any discount. Omitted/0 when none. */
  deliveryCharge?: number;
}

export interface ShopDetails {
  shop_name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  logo?: string;
}

export interface PrintData {
  shop: ShopDetails;
  customer: CustomerDetails;
  bill: BillDetails;
}

/**
 * Selects which template renders the document. The invoice/quotation templates
 * are priced and the two return templates are not (no price is ever stored on a
 * return item), so each return needs its own layout rather than a zeroed
 * invoice.
 */
export type PrintDocType =
  | "invoice"
  | "quotation"
  | "salesReturn"
  | "purchaseReturn";

export interface SalesReturnItemLine {
  product_name: string;
  batch_no?: string | null;
  quantity: number;
  expiry_date?: string;
}

export interface SalesReturnDetails {
  no: string;
  return_date: string;
  patient_name?: string | null;
  doctor_name?: string | null;
  items: SalesReturnItemLine[];
  /** Sum of `items[].quantity` — a sales return carries no money total. */
  totalPieces: number;
}

export interface SalesReturnPrintData {
  shop: ShopDetails;
  return: SalesReturnDetails;
}

/**
 * One replacement line received from the supplier. `quantity` is the piece
 * count the API stored (`pack × quantity`), not the pack count.
 */
export interface PurchaseReturnItemLine {
  product_name: string;
  batch_no?: string | null;
  quantity: number;
}

export interface PurchaseReturnDetails {
  no: string;
  return_date: string;
  /** Null when the return was recorded without a supplier. */
  supplier_name?: string | null;
  items: PurchaseReturnItemLine[];
  /** Sum of `items[].quantity` — a purchase return carries no money total. */
  totalPieces: number;
}

export interface PurchaseReturnPrintData {
  shop: ShopDetails;
  return: PurchaseReturnDetails;
}

/**
 * Either document shape, discriminated by the `docType` on the print payload.
 */
export type AnyPrintData =
  | PrintData
  | SalesReturnPrintData
  | PurchaseReturnPrintData;
