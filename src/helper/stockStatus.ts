export type StockStatusValue =
  | "available"
  | "not_available"
  | "expired"
  | "out_of_stock";

export const STOCK_STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  available: { label: "Available", color: "green" },
  not_available: { label: "Not Available", color: "orange" },
  expired: { label: "Expired", color: "red" },
  out_of_stock: { label: "Out of Stock", color: "red" },
};

export function getStockStatusMeta(status?: string | null) {
  if (!status) {
    return { label: "—", color: "gray" };
  }

  return (
    STOCK_STATUS_META[status] ?? {
      label: String(status).replace(/_/g, " "),
      color: "gray",
    }
  );
}
