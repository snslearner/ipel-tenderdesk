import type { Database } from "@/lib/database.types";
import type { PoStatus } from "@/lib/orders";

type Views = Database["public"]["Views"];
type Tables = Database["public"]["Tables"];

export type PoSummary = {
  id: string;
  po_number: string;
  status: PoStatus;
  pending_qty: number;
  effective_due: string | null;
  payment_docs_missing: string[];
  ready_to_claim: boolean;
};

export type LineRow = Pick<
  Views["v_po_lines"]["Row"],
  "client_po_item_id" | "part_number" | "product_name" | "ordered_qty" | "delivered_qty" | "pending_qty" | "unit_price" | "pending_value"
>;

export type DiscrepancyRow = Pick<
  Tables["po_discrepancies"]["Row"],
  "id" | "field" | "expected" | "actual" | "raised_on" | "amendment_ref" | "resolved_on"
> & { part_number: string | null };

export type VendorPoRow = Pick<
  Views["v_vendor_po_balance"]["Row"],
  | "vendor_po_id"
  | "vendor_name"
  | "vendor_type"
  | "po_number"
  | "po_date"
  | "eta"
  | "status"
  | "po_value"
  | "received_value"
  | "paid"
  | "payable_now"
  | "balance_due"
  | "eta_after_client_due"
>;

export type VendorPaymentRow = Pick<Tables["vendor_payments"]["Row"], "id" | "vendor_po_id" | "paid_on" | "amount" | "mode" | "reference">;

export type InspectionRow = Pick<Tables["inspections"]["Row"], "id" | "agency" | "called_on" | "scheduled_on" | "result" | "remarks">;

export type DispatchRow = Pick<
  Tables["dispatches"]["Row"],
  "id" | "dc_number" | "dispatched_on" | "received_on" | "signed_sealed_stamped"
> & { dispatch_items: { client_po_item_id: string; qty: number }[] };

export type ExtensionRow = Pick<
  Tables["extension_requests"]["Row"],
  "id" | "created_on" | "requested_date" | "reason" | "letter_text" | "status" | "approval_ref" | "approved_on"
>;

export type InvoiceBalance = Views["v_invoice_balance"]["Row"];

export type ReceiptRow = Pick<
  Tables["receipts"]["Row"],
  "id" | "received_on" | "amount" | "tds" | "gst_tds" | "ld_deducted" | "other_deductions" | "reference"
>;
