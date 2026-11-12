import { PrintData } from "../../utils/type";

const escapeHtml = (value: unknown) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getLogoUrl = (logo?: string | null) => {
  if (!logo) return "";

  if (/^https?:\/\//i.test(logo) || logo.startsWith("data:")) {
    return logo;
  }

  const baseUrl =
    import.meta.env.VITE_APP_USER_IMAGE_URL?.replace(/\/$/, "") || "";
  const normalizedLogo = logo.replace(/^\/+/, "");

  return baseUrl ? `${baseUrl}/${normalizedLogo}` : normalizedLogo;
};

const money = (value: unknown) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Thermal receipt template for 80mm (3-inch) roll printers.
 *
 * Thermal printers have no table layout worth speaking of, so every row is a
 * stacked block: name on the first line, qty x rate on the second, amount
 * right-aligned on the third. Widths are in millimetres because the paper is
 * a fixed physical size and mm keeps the CSS honest about it.
 */
export const ThermalReceiptTemplate = (
  title = "INVOICE / BILL",
  data: PrintData,
) => {
  const shopLogoUrl = getLogoUrl(data?.shop?.logo);
  // Titles vary by caller: "INVOICE / BILL" (live preview, save/share) and
  // "INVOICE" (PrintViewModal) both mean an invoice, "QUOTATION" does not.
  const isInvoice = /invoice/i.test(title);
  const items = data?.bill?.items ?? [];
  const gstAmount = Number(data?.bill?.gstAmount || 0);
  const showGst = gstAmount > 0;
  const discountAmount = Number(data?.bill?.discountAmount || 0);
  const showDiscount = discountAmount > 0;

  const itemRows = items.length
    ? items
        .map(
          (item, index) => `
        <div class="t-item">
          <div class="t-item-head">
            <span class="t-item-name">${index + 1}. ${escapeHtml(item.product_name)}</span>
          </div>
          ${
            item.serial_no
              ? `<div class="t-item-sub">S/N: ${escapeHtml(item.serial_no)}</div>`
              : ""
          }
          <div class="t-item-row">
            <span>${item.quantity} x Rs.${Number(item.price || 0).toFixed(2)}</span>
            <span>Rs.${money(Number(item.price || 0) * Number(item.quantity || 0))}</span>
          </div>
        </div>
      `,
        )
        .join("")
    : `<div class="t-item"><div class="t-item-head"><span class="t-item-name">No items</span></div></div>`;

  return `
<div class="receipt">

  <!-- SHOP -->
  ${
    shopLogoUrl
      ? `<img class="t-shop-logo" src="${escapeHtml(shopLogoUrl)}" alt="" />`
      : ""
  }

  <div class="t-center">
    <div class="t-shop-name">${escapeHtml(data?.shop?.shop_name || "")}</div>
    ${data?.shop?.address ? `<div class="t-shop-line">${escapeHtml(data.shop.address)}</div>` : ""}
    ${data?.shop?.phone ? `<div class="t-shop-line">Ph: ${escapeHtml(data.shop.phone)}</div>` : ""}
    ${data?.shop?.email && data.shop.email !== "-" ? `<div class="t-shop-line">${escapeHtml(data.shop.email)}</div>` : ""}
    ${data?.shop?.gstin ? `<div class="t-shop-line">GSTIN: ${escapeHtml(data.shop.gstin)}</div>` : ""}
  </div>

  <!-- DOC TITLE -->
  <div class="t-doc-title t-center">${escapeHtml(title)}</div>

  <!-- BILL META -->
  ${
    data?.bill?.no
      ? `
    <div class="t-meta-row">
      <span>${isInvoice ? "Invoice" : "Quotation"} No</span>
      <span>${escapeHtml(data.bill.no)}</span>
    </div>
  `
      : ""
  }

  <div class="t-meta-row">
    <span>Date</span>
    <span>${escapeHtml(data?.bill?.invoice_date || "-")}</span>
  </div>

  <div class="t-sep"></div>

  <!-- CUSTOMER -->
  <div class="t-meta-row">
    <span>Customer</span>
    <span>${escapeHtml(data?.customer?.name || "Customer Name")}</span>
  </div>

  ${
    data?.customer?.doctor
      ? `
    <div class="t-meta-row">
      <span>Doctor</span>
      <span>${escapeHtml(data.customer.doctor)}</span>
    </div>
  `
      : ""
  }

  ${
    data?.customer?.phone && data.customer.phone !== "-"
      ? `
    <div class="t-meta-row">
      <span>Phone</span>
      <span>${escapeHtml(data.customer.phone)}</span>
    </div>
  `
      : ""
  }

  ${
    data?.customer?.address && data.customer.address !== "-"
      ? `
    <div class="t-meta-row">
      <span>Address</span>
      <span>${escapeHtml(data.customer.address)}</span>
    </div>
  `
      : ""
  }

  <div class="t-sep"></div>

  <!-- ITEMS -->
  <div class="t-section-head">
    <span>Item</span>
    <span>Amount</span>
  </div>

  <div class="t-sep"></div>

  ${itemRows}

  <div class="t-sep"></div>

  <!-- TOTALS -->
  <div class="t-totals">

    <div class="t-total-row">
      <span>Subtotal</span>
      <span>Rs.${money(data?.bill?.subtotal)}</span>
    </div>

    ${
      showGst
        ? `
      <div class="t-total-row">
        <span>GST (${escapeHtml(data.bill.gstPercentage)}%)</span>
        <span>Rs.${money(gstAmount)}</span>
      </div>
    `
        : ""
    }



    ${
      showDiscount
        ? `
      <div class="t-total-row">
        <span>${escapeHtml(data.bill?.discountLabel || "Discount")}</span>
        <span>- Rs.${money(discountAmount)}</span>
      </div>
    `
        : ""
    }

    ${
      Number(data?.bill?.deliveryCharge || 0) > 0
        ? `
      <div class="t-total-row">
        <span>Delivery Charge</span>
        <span>Rs.${money(Number(data.bill.deliveryCharge))}</span>
      </div>
    `
        : ""
    }

    <div class="t-total-row t-grand">
      <span>Total</span>
      <span>Rs.${money(data?.bill?.finalAmount)}</span>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="t-foot">
    <div class="t-thanks">Thank you!</div>
    <div>Please come again</div>
  </div>

  <div class="t-cut">- - - - - - - - - -</div>

</div>

</html>
`;
};

/**
 * Scoped to .receipt-print-root on purpose. These templates are injected
 * into the live DOM via dangerouslySetInnerHTML, so a bare `*` / `body`
 * selector here would restyle the entire application. The reset below is
 * therefore written as `.receipt-print-root *`.
 */
export const THERMAL_RECEIPT_CSS = `

.receipt-print-root * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.receipt-print-root {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #000000;
  /* Monospace is intentional here and only here: thermal receipts align
     amount columns by character width, which a proportional font breaks. */
  font-family: "Courier New", Courier, monospace;
  font-size: 11px;
  line-height: 1.35;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* @page cannot be nested inside a style rule, so a selector-qualified
   version is dropped by browsers and silently loses the 80mm roll setup.
   It has to stay at the top level. */
@page {
  size: 80mm auto;
  margin: 0;
}

/* 80mm roll = 72mm printable area, 4mm bleed each side */
.receipt-print-root .receipt {
  width: 72mm;
  margin: 0 auto;
  padding: 6mm 4mm;
  background: #ffffff;
}

.receipt-print-root .t-center {
  text-align: center;
}

.receipt-print-root .t-shop-logo {
  width: 22mm;
  height: 22mm;
  object-fit: contain;
  display: block;
  margin: 0 auto 1mm;
}

.receipt-print-root .t-shop-name {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.receipt-print-root .t-shop-line {
  font-size: 10px;
  word-break: break-word;
}

.receipt-print-root .t-doc-title {
  margin: 2mm 0 1mm;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-top: 1px dashed #000000;
  border-bottom: 1px dashed #000000;
  padding: 1mm 0;
}

.receipt-print-root .t-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-size: 10px;
}

.receipt-print-root .t-meta-row span:first-child {
  flex: 0 0 auto;
}

.receipt-print-root .t-meta-row span:last-child {
  text-align: right;
  word-break: break-all;
}

.receipt-print-root .t-sep {
  border-top: 1px dashed #000000;
  margin: 1.5mm 0;
}

.receipt-print-root .t-section-head {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
}

.receipt-print-root .t-item {
  margin-bottom: 1.5mm;
  page-break-inside: avoid;
}

.receipt-print-root .t-item-head {
  font-weight: 700;
}

.receipt-print-root .t-item-name {
  word-break: break-word;
}

.receipt-print-root .t-item-sub {
  font-size: 10px;
  padding-left: 3mm;
}

.receipt-print-root .t-item-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-size: 10px;
}

.receipt-print-root .t-totals {
  margin-top: 1mm;
}

.receipt-print-root .t-total-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  font-size: 11px;
}

.receipt-print-root .t-total-row span:last-child {
  text-align: right;
}

/* Muted CGST/SGST rows under the combined GST line. */
.receipt-print-root .t-gst-split {
  font-size: 11px;
  color: #555555;
}

.receipt-print-root .t-grand {
  margin-top: 1.5mm;
  padding-top: 1.5mm;
  border-top: 1px solid #000000;
  font-size: 13px;
  font-weight: 700;
}

.receipt-print-root .t-foot {
  margin-top: 2mm;
  text-align: center;
  font-size: 10px;
}

.receipt-print-root .t-thanks {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.receipt-print-root .t-cut {
  text-align: center;
  font-size: 9px;
  letter-spacing: 0.1em;
  margin-top: 1mm;
}


`;

