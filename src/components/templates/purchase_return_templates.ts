import { PurchaseReturnPrintData } from "../../utils/type";
import { escapeHtml, getLogoUrl } from "./receipt_templates";

/**
 * A4 purchase return.
 *
 * Deliberately price-free, for the same reason as the sales return: the API
 * never stores a rate on a return item, only the replacement quantity, so a
 * currency column would mean printing invented zeros. The totals box reports
 * total pieces instead of an amount.
 *
 * The shell (shop header, meta block, table, totals) reuses the invoice CSS
 * classes so this document and the sales return stay visually consistent; only
 * the columns and the meta block differ — a purchase return has a supplier
 * instead of a patient/doctor.
 */
export const PurchaseReturnReceiptTemplate = (
  title = "PURCHASE RETURN",
  data: PurchaseReturnPrintData,
) => {
  const shopLogoUrl = getLogoUrl(data?.shop?.logo);
  const items = data?.return?.items ?? [];
  const totalPieces = Number(data?.return?.totalPieces ?? 0);

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

        ${data?.shop?.gstin
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


    <!-- SUPPLIER DETAILS -->

    <div class="customer-section">

      <p class="customer-heading">
        Supplier Details
      </p>


      <div class="customer-row">

        <div class="customer-details">

          <p class="customer-name">
            ${escapeHtml(data?.return?.supplier_name || "Supplier")}
          </p>

        </div>


        <div class="bill-details">

          ${data?.return?.no
      ? `
                <p>
                  Return No:
                  <span>
                    ${escapeHtml(data.return.no)}
                  </span>
                </p>
              `
      : ""
    }

          <p>
            Date:
            <span>
              ${escapeHtml(data?.return?.return_date || "-")}
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
                Replacement Product
              </th>

              <th>
                Batch No
              </th>

              <th class="amount-column">
                Quantity (pcs)
              </th>

            </tr>

          </thead>


          <tbody>

            ${items.length > 0
      ? items
        .map(
          (item, index) => `
                       <tr>

                        <td>
                          ${index + 1}
                        </td>

                        <td class="item-name">
                          ${escapeHtml(item.product_name)}
                        </td>

                        <td>
                          ${escapeHtml(item.batch_no || "-")}
                        </td>

                        <td class="amount-column">
                          ${item.quantity}
                        </td>

                      </tr>
                      `,
        )
        .join("")
      : `
                  <tr>

                    <td
                      colspan="4"
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

          <div class="final-border"></div>

          <div class="total-row final-total">

            <span>
              Total Pieces
            </span>

            <span>
              ${totalPieces}
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
 * Thermal purchase return for 80mm (3-inch) roll printers.
 *
 * Mirrors the sales return thermal template's class vocabulary (.t-*) with the
 * qty x rate / amount lines and the currency totals dropped.
 */
export const PurchaseReturnThermalTemplate = (
  title = "PURCHASE RETURN",
  data: PurchaseReturnPrintData,
) => {
  const shopLogoUrl = getLogoUrl(data?.shop?.logo);
  const items = data?.return?.items ?? [];
  const totalPieces = Number(data?.return?.totalPieces ?? 0);

  const itemRows = items.length
    ? items
      .map(
        (item, index) => `
        <div class="t-item">
          <div class="t-item-head">
            <span class="t-item-name">${index + 1}. ${escapeHtml(item.product_name)}</span>
          </div>
          ${item.batch_no
            ? `<div class="t-item-sub">Batch: ${escapeHtml(item.batch_no)}</div>`
            : ""
          }
          <div class="t-item-row">
            <span>Quantity</span>
            <span>${item.quantity} pcs</span>
          </div>
        </div>
      `,
      )
      .join("")
    : `<div class="t-item"><div class="t-item-head"><span class="t-item-name">No items</span></div></div>`;

  return `
<div class="receipt">

  <!-- SHOP -->
  ${shopLogoUrl
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

  <!-- RETURN META -->
  ${data?.return?.no
      ? `
    <div class="t-meta-row">
      <span>Return No</span>
      <span>${escapeHtml(data.return.no)}</span>
    </div>
  `
      : ""
    }

  <div class="t-meta-row">
    <span>Date</span>
    <span>${escapeHtml(data?.return?.return_date || "-")}</span>
  </div>

  <div class="t-sep"></div>

  <!-- SUPPLIER -->
  <div class="t-meta-row">
    <span>Supplier</span>
    <span>${escapeHtml(data?.return?.supplier_name || "Supplier")}</span>
  </div>

  <div class="t-sep"></div>

  <!-- ITEMS -->
  <div class="t-section-head">
    <span>Replacement Item</span>
    <span>Qty</span>
  </div>

  <div class="t-sep"></div>

  ${itemRows}

  <div class="t-sep"></div>

  <!-- TOTAL -->
  <div class="t-totals">

    <div class="t-total-row t-grand">
      <span>Total Pieces</span>
      <span>${totalPieces}</span>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="t-foot">
    <div class="t-thanks">Thank you!</div>
    <div>Please come again</div>
  </div>

  <div class="t-cut">- - - - - - - - -</div>

</div>

</html>
`;
};