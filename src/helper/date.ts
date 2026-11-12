export const formatDateDMY = (
  date: string | number | Date,
  timeZone: string = "Asia/Dubai",
): string => {
  return new Date(date).toLocaleString("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
  });
};

export const formatDateForInput = (date: string | Date) => {
  const d = new Date(date);

  return d.toISOString().split("T")[0];
};

/**
 * Generate a dynamic quotation number in the format:
 * QUO-DDMMYYYY-HHMMSS
 * e.g. QUO-20082026-143052
 */
export const generateQuotationNo = (): string => {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, "0");

  const dd = pad(now.getDate());
  const mm = pad(now.getMonth() + 1);
  const yyyy = String(now.getFullYear());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  return `QUO-${dd}${mm}${yyyy}-${hh}${min}${ss}`;
};

/**
 * Generate a dynamic invoice number in the format:
 * INV-DDMMYYYY-HHMMSS
 * e.g. INV-20082026-143052
 */
export const generateInvoiceNo = (): string => {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, "0");

  const dd = pad(now.getDate());
  const mm = pad(now.getMonth() + 1);
  const yyyy = String(now.getFullYear());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  return `INV-${dd}${mm}${yyyy}-${hh}${min}${ss}`;
};
