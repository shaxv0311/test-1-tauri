import { PrintData } from "../../utils/type";

/**
 * Shared by every template file. Exported so the return templates do not each
 * carry their own copy — the escaping matters because product and shop names go
 * straight into raw HTML.
 */
export const escapeHtml = (value: unknown) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const getLogoUrl = (logo?: string | null) => {
  if (!logo) return "";

  if (/^https?:\/\//i.test(logo) || logo.startsWith("data:")) {
    return logo;
  }

  const baseUrl =
    import.meta.env.VITE_APP_USER_IMAGE_URL?.replace(/\/$/, "") || "";
  const normalizedLogo = logo.replace(/^\/+/, "");

  return baseUrl ? `${baseUrl}/${normalizedLogo}` : normalizedLogo;
};
const formatPrice = (value: number | string) => {
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
};

const formatPriceOnly = (value: number | string) => {
  const num = Number(value);
  return String(Math.trunc(num * 100) / 100);
};
export const ReceiptTemplate = (
  title = "INVOICE / BILL",
  data: PrintData,
) => {
  const shopLogoUrl = getLogoUrl(data?.shop?.logo);
  // Titles vary by caller: "INVOICE / BILL" (live preview, save/share) and
  // "INVOICE" (PrintViewModal) both mean an invoice, "QUOTATION" does not.
  const isInvoice = /invoice/i.test(title);

  return `
<div class="wrapper">

  <div class="print-page">

    <!-- SHOP HEADER -->

    <div class="shop-header">

      <div class="shop-brand">
        ${shopLogoUrl
      ? `
              <img
                src="${shopLogoUrl}"
                alt="Shop Logo"
                class="shop-logo"
                onerror="this.style.display='none'"
              />
            `
      : ""
    }

        <h1 class="shop-name">
          ${escapeHtml(data?.shop?.shop_name)}
        </h1>
      </div>

      <div class="shop-details">

 ${data?.shop?.phone
      ? `<p>Phone: ${escapeHtml(data.shop.phone)}</p>`
      : ""}

${data?.shop?.email
      ? `<p>Email: ${escapeHtml(data.shop.email)}</p>`
      : ""}

${data?.shop?.address
      ? `<p>Address: ${escapeHtml(data.shop.address)}</p>`
      : ""}
        ${data.shop?.gstin
      ? `
              <p>
                GSTIN: ${escapeHtml(data.shop.gstin)}
              </p>
            `
      : ""
    }

      </div>

    </div>


    <!-- TITLE -->

    <p class="document-title">
      ${escapeHtml(title)}
    </p>


    <!-- CUSTOMER DETAILS -->

    <div class="customer-section">

      <!--   <p class="customer-heading">
        Customer Details
      </p> -->


      <div class="customer-row">

        <!-- CUSTOMER -->

        <div class="customer-details">


<p class="customer-name">
  ${escapeHtml(data.customer?.name || "")}
</p>

${data.customer?.phone
      ? `<p>Phone: ${escapeHtml(data.customer.phone)}</p>`
      : ""
    }

${data.customer?.doctor
      ? `<p>Doctor: ${escapeHtml(data.customer.doctor)}</p>`
      : ""
    }

${data.customer?.email
      ? `<p>Email: ${escapeHtml(data.customer.email)}</p>`
      : ""
    }

${data.customer?.address
      ? `<p>Address: ${escapeHtml(data.customer.address)}</p>`
      : ""
    }

        </div>


        <!-- BILL -->

        <div class="bill-details">

          ${data.bill?.no
      ? `
                <p>
                  ${isInvoice ? "Invoice" : "Quotation"} No:
                  <span>
                    ${escapeHtml(data.bill.no)}
                  </span>
                </p>
              `
      : ""
    }

          <p>
            Date:
            <span>
              ${escapeHtml(data.bill?.invoice_date)}
            </span>
          </p>
        </div>

      </div>


      <!-- TABLE -->

      <div class="table-container">

        <table>

          <thead>

            <tr>

              <th class="no-column">
                No
              </th>

              <th>
                Products 
              </th>

              <th>
                Expiry Date
              </th>

              <th>
                Quantity
              </th>

              <th>
                Price (Unit)
              </th>

              <th class="amount-column">
                Amount
              </th>

            </tr>

          </thead>


          <tbody>

            ${data.bill?.items?.length > 0
      ? data.bill.items
        .map(
          (item: any, index) => `
                      
                      <tr>

                        <td>
                          ${index + 1}
                        </td>

                        <td class="item-name">
                          ${escapeHtml(item.product_name)}${item.serial_no ? ` - ${escapeHtml(item.serial_no)}` : ""}
                        </td>

                        <td class="item-expiry">
                          ${item.expiry_date ? escapeHtml(item.expiry_date) : "-"}
                        </td>

                        <td class="item-quantity">
                          ${item.quantity}
                        </td>

                        <td class="item-price">
                          ${formatPriceOnly(item.price)}
                        </td>

                        <td class="amount-column">
                          Rs. ${formatPriceOnly(item.price * item.quantity)}
                        </td>

                      </tr>

                      `,
        )
        .join("")
      : `
                  <tr>

                    <td
                      colspan="6"
                      class="no-items"
                    >
                      No Items
                    </td>

                  </tr>
                `
    }

          </tbody>

        </table>

      </div>


      <!-- TOTAL -->

      <div class="total-container">

        <div class="total-box">

          <!-- SUBTOTAL -->

          <div class="total-row">

            <span>
              Subtotal
            </span>

            <span>
              Rs. ${Number(data.bill?.subtotal || 0).toLocaleString()}
            </span>

          </div>


          ${Number(data.bill?.gstAmount || 0) > 0
      ? `

                <div class="gst-border"></div>

                <div class="total-row">

                  <span>
                    GST (${escapeHtml(data.bill.gstPercentage)}%)
                  </span>

                  <span>
                    Rs. ${Number(data.bill.gstAmount || 0).toLocaleString()}
                  </span>

                </div>



              `
      : ""
    }


          ${Number(data.bill?.discountAmount || 0) > 0
      ? `

                <div class="total-row">

                  <span>
                    ${escapeHtml(data.bill?.discountLabel || "Discount")}
                  </span>

                  <span>
                    - Rs. ${Number(data.bill.discountAmount).toLocaleString()}
                  </span>

                </div>

              `
      : ""
    }


          ${Number(data.bill?.deliveryCharge || 0) > 0
      ? `

                <div class="total-row">

                  <span>
                    Delivery Charge
                  </span>

                  <span>
                    Rs. ${Number(data.bill.deliveryCharge).toLocaleString()}
                  </span>

                </div>

              `
      : ""
    }


          <!-- FINAL BORDER -->

          <div class="final-border"></div>


          <!-- FINAL TOTAL -->

          <div class="total-row final-total">

            <span>
              Total Amount
            </span>

            <span>
              Rs. ${Number(data.bill?.finalAmount || 0).toLocaleString()}
            </span>

          </div>

        </div>

      </div>

    </div>

  </div>

</div>

</html>
`;
};

/**
 * Scoped to .receipt-print-root on purpose. These templates are injected
 * into the live DOM via dangerouslySetInnerHTML, so a bare `*` / `body`
 * selector here would restyle the entire application.
 */
export const RECEIPT_CSS = `

.receipt-print-root * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.receipt-print-root {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #111827;
  font-family: Arial, Helvetica, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* OUTER */

.receipt-print-root .wrapper {
  width: 100%;
  padding: 28px;
  background: #ffffff;
}

/* PRINT PAGE */

.receipt-print-root .print-page {
  background: #ffffff;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

/* HEADER */

.receipt-print-root .shop-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
  display: block;
  background: transparent;
  flex-shrink: 0;
}

.receipt-print-root .shop-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
}

.receipt-print-root .shop-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  width: 55%;
}

.receipt-print-root .shop-name {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.receipt-print-root .shop-details {
  flex: 1;
  font-size: 12px;
  color: #111827;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding-top: 6px;
}

.receipt-print-root .shop-details p {
  margin: 0;
  line-height: 1.45;
}

/* TITLE */

.receipt-print-root .document-title {
  margin-top: 22px;
  padding-bottom: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

/* CUSTOMER SECTION */

.receipt-print-root .customer-section {
  margin-top: 16px;
}

.receipt-print-root .customer-heading {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 800;
  color: #111827;
}

/* CUSTOMER + BILL */

.receipt-print-root .customer-row {
  display: flex;
  justify-content: space-between;
}

.receipt-print-root .customer-details {
  font-size: 12px;
  line-height: 16px;
  color: #4b5563;
}

.receipt-print-root .customer-details p {
  margin: 0;
}

.receipt-print-root .customer-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.receipt-print-root .bill-details {
  font-size: 12px;
  line-height: 16px;
  text-align: right;
  font-weight: 600;
  color: #111827;
}

.receipt-print-root .bill-details p {
  margin: 0;
}

/* TABLE */

.receipt-print-root .table-container {
  margin-top: 16px;
}

.receipt-print-root table {
  width: 100%;
  border-collapse: collapse;
}

.receipt-print-root thead tr {
  border-top: 1px solid #6b7280;
  border-bottom: 1px solid #6b7280;
}

.receipt-print-root th {
  padding-top: 8px;
  padding-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  color: #111827;
}

.receipt-print-root td {
  padding-top: 8px;
  padding-bottom: 8px;
  font-size: 12px;
  color: #111827;
}

.receipt-print-root .no-column {
  width: 35px;
}

.receipt-print-root .amount-column {
  width: 70px;
  text-align: right;
}

.receipt-print-root .item-name {
  font-weight: 700;
}

.receipt-print-root .item-quantity {
  font-weight: 700;
  
}

.receipt-print-root .item-price {
  font-weight: 700;
}

.receipt-print-root .item-expiry {
  font-size: 11px;
  color: #6b7280;
}

.receipt-print-root .no-items {
  padding-top: 20px;
  padding-bottom: 20px;
  text-align: center;
  color: #4b5563;
}

/* TOTAL */

.receipt-print-root .total-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.receipt-print-root .total-box {
  width: 200px;
  font-size: 14px;
}

.receipt-print-root .total-row {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
  padding-bottom: 4px;
}

.receipt-print-root .gst-border {
  border-top: 1px solid #6b7280;
}

/* Indented CGST/SGST rows sitting under the combined GST line. */
.receipt-print-root .gst-split-row {
  font-size: 11px;
  color: #4b5563;
}

.receipt-print-root .final-border {
  border-top: 2px solid #1f2937;
}

.receipt-print-root .final-total {
  font-weight: 700;
}

/* PRINT */

/* @page cannot be nested inside a style rule, so a selector-qualified
   version is dropped by browsers and silently loses the A4 page setup.
   It has to stay at the top level. */
@page {
  size: A4;
  margin: 0;
}

/* Likewise, nesting @media inside a rule turns the inner selectors into
   descendants of the receipt root, so "html" would never match. */
@media print {

  .receipt-print-root {
    background: #ffffff !important;
  }

  .receipt-print-root .wrapper {
    background: #ffffff !important;
  }

  .receipt-print-root .print-page {
    border: none !important;
  }

}


`;

