import {
  Calendar,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import Button from "../../../components/ui/Button";
// import { TbReload } from "react-icons/tb";
// import { FaHashtag, FaRegUser, FaUserAlt } from "react-icons/fa";
import Input from "../../../components/ui/Input";
// import {
//   MdEmail,
//   MdLocalPhone,
//   MdLocalPrintshop,
//   MdDiscount,
//   MdOutlinePercent,
// } from "react-icons/md";
// import { FaLocationDot } from "react-icons/fa6";
// import { BsCurrencyRupee } from "react-icons/bs";
import NoData from "../../../components/table/noData";
import { PrintPage } from "../../../components/ui/printPage";
import { ThermalPrintPage } from "../../../components/ui/thermalPrintPage";
import { SectionTitle } from "../../quotation/component/SectionTitle";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  defaultInvoice,
  InvoiceForm,
  inVoiceSchema,
} from "../../../api/featutres/invoiceFeatures/invoiceSchema";
import { useCreateInvoiceMutation } from "../../../api/featutres/invoiceFeatures/invoiceApi";
import { setToastMessage } from "../../../helper/helper";
import { generateInvoiceNo } from "../../../helper/date";
import { AsyncPaginate } from "react-select-async-paginate";
import {
  asyncPaginateStyle,
  selectMenuPortalTarget,
} from "../../../hooks/asyncPaginateStyle";
import { useCalculateAction } from "../../../hooks/useCalculateAction";
import { useProductLoader } from "../../inventory/hooks/useproductLoader";
import {
  useLazyGetProductBatchesQuery,
  useLazyGetproductsQuery,
} from "../../../api/featutres/inventryFeatures/inventryApi/productApi";

import PrinterListModal from "../../quotation/component/PrinterListModal";
import PrintViewModal from "../../../components/ui/PrintViewModal";
import { useGetShopQuery } from "../../../api/featutres/shopFeatures/shopApi";
import {
  downloadReceiptPdf,
  printReceipt,
  PrintFormat,
  shareReceiptPdf,
} from "../../../helper/pdf";

// Staged state for the line item currently being built in the "Add Item" panel
interface NewItemState {
  product: { value: number; label: string; raw: any } | null;
  /** Stock batch the sale is dispensed from — required by the invoice API. */
  stockId?: number;
  /**Expiry date from the selected batch — shown in item list & print. */
  expiry_date?: string;
  product_name: string;
  quantity: number;
  price: string;
}

const defaultNewItem: NewItemState = {
  product: null,
  product_name: "",
  quantity: 1,
  price: "",
};

const DISCOUNT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "percentage", label: "Percentage" },
  { value: "amount", label: "Amount" },
] as const;

/**
 * Tax is a single rate for the whole bill, so "None" and "Percentage" are the
 * only choices. The rate is typed into the input that appears.
 */
const TAX_OPTIONS = [
  { value: "none", label: "None" },
  { value: "percentage", label: "Tax Percentage" },
] as const;

export default function InvoiceAndBill() {
  const isElectronDesktop =
    typeof navigator !== "undefined" &&
    navigator.userAgent.includes("Electron");
  const [isSaving, setIsSaving] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [isLoadingPrinters] = useState(false);
  // Mobile only: A4 preview as a modal (below md)
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [invoiceNo] = useState(generateInvoiceNo());
  // Set from the server response after save — the live preview must not show
  // a client-generated number that may never match the persisted invoice.
  const [savedInvoiceNo, setSavedInvoiceNo] = useState("");
  const [itemError, setItemError] = useState("");
  const [itemErrorField, setItemErrorField] = useState<
    "product" | "batch" | "quantity" | "price" | ""
  >("");
  const showItemError = (
    field: "product" | "batch" | "quantity" | "price",
    message: string,
  ) => {
    setItemError(message);
    setItemErrorField(field);
  };
  // The "Add Item" panel is collapsed until the user asks for it
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  // The discount picker is a popover anchored to its button, not a full section
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const discountWrapRef = useRef<HTMLDivElement>(null);
  // Tax works the same way, so the two sit side by side
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const taxWrapRef = useRef<HTMLDivElement>(null);
  // Preview / output format for the right-hand live preview panel
  const [printFormat, setPrintFormat] = useState<PrintFormat>("a4");
  const [isPrinting, setIsPrinting] = useState(false);
  // Staging state for the item currently being built in the "Add Item" panel
  const [newItem, setNewItem] = useState<NewItemState>(defaultNewItem);

  const dateRef = useRef<HTMLInputElement>(null);

  const [createInvoice, { isLoading: isCreatingLoading }] =
    useCreateInvoiceMutation();

  /**
   * Every money / quantity calculation on this screen goes through here so the
   * live preview and the A4 receipt cannot drift from what the API stores.
   */
  const calc = useCalculateAction();

  const [triggerGetProducts] = useLazyGetproductsQuery();
  const { loadProductOptions } = useProductLoader(triggerGetProducts);

  /**
   * Batches are not part of the product list payload, so the batches for the
   * currently staged product are fetched on demand. The invoice API requires a
   * `stockId` per line, so this is mandatory, not cosmetic.
   *
   * The endpoint returns `{ product, stock, pagination }` — the batches sit
   * beside the product, not inside it. page/limit paginate the batches, and the
   * default limit is only 10, which silently hides older batches.
   */
  const [triggerBatches, { isFetching: isBatchesLoading }] =
    useLazyGetProductBatchesQuery();

  /**
   * Server-paginated batch list: AsyncPaginate's scroll triggers fetching
   * successive pages (100 rows each) instead of silently capping at 100.
   */
  const batchRef = useRef<{
    productId: number | null;
    stock: any[];
    page: number;
    totalPages: number;
  }>({ productId: null, stock: [], page: 0, totalPages: 1 });
  const lastCursorRef = useRef(0);
  const emittedRef = useRef<Map<string, number>>(new Map());
  const [batchTick, setBatchTick] = useState(0);

  const loadBatchPage = useCallback(
    async (productId: number, page: number) => {
      const res: any = await triggerBatches({
        id: productId,
        page,
        limit: 100,
      }).unwrap();
      batchRef.current = {
        productId,
        stock:
          page === 1
            ? (res?.stock ?? [])
            : [...batchRef.current.stock, ...(res?.stock ?? [])],
        page: res?.pagination?.page ?? page,
        totalPages: res?.pagination?.totalPages ?? 1,
      };
      setBatchTick((t) => t + 1);
      return res;
    },
    [triggerBatches],
  );

  useEffect(() => {
    batchRef.current = { productId: null, stock: [], page: 0, totalPages: 1 };
    lastCursorRef.current = 0;
    emittedRef.current = new Map();
    setBatchTick((t) => t + 1);
    if (isAddItemOpen && newItem.product?.value) {
      lastCursorRef.current = 1;
      loadBatchPage(newItem.product.value, 1).catch(() => undefined as void);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newItem.product?.value, isAddItemOpen]);

  const availableBatches: any[] = useMemo(() => {
    const batches = batchRef.current.stock;
    // `date` columns come back as YYYY-MM-DD, so a string compare is enough.
    const today = new Date().toISOString().slice(0, 10);

    return batches.filter((batch: any) => {
      if (calc.toNumber(batch?.quantity) <= 0) return false;

      // Batches without an expiry date stay selectable (paper, pen, etc.).
      // Only batches whose real expiry date has passed are excluded.
      if (batch?.expiry_date) {
        const exp = String(batch.expiry_date).slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(exp) && exp < today) return false;
      }
      return batch?.stock_status === "available";
    });
    // batchTick re-runs this when more server pages are appended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchTick, calc]);

  /**
   * Shows the piece count the invoice is actually billed against, not the
   * pack count — pack sizes differ per batch, so only the pack figure is
   * ambiguous on its own.
   */
  const formatBatchLabel = useCallback(
    (batch: any): string =>
      `Batch ${batch?.batch_no ?? "-"} · Exp ${batch?.expiry_date ? batch.expiry_date : "No expiry"} · ${calc.invCal.batchPieces(
        batch,
      )} pcs (${calc.toNumber(batch?.quantity)} pack × ${calc.invCal.batchPack(
        batch,
      )})`,
    [calc],
  );

  const loadBatchOptions = useCallback(
    async (search: string, _loaded: any, _additional: any) => {
      const term = search.trim().toLowerCase();
      const today = new Date().toISOString().slice(0, 10);
      const matches = (batch: any) => {
        if (calc.toNumber(batch?.quantity) <= 0) return false;
        // Batches without an expiry date stay selectable (paper, pen, etc.).
        if (batch?.expiry_date) {
          const exp = String(batch.expiry_date).slice(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(exp) && exp < today) return false;
        }
        return (
          batch?.stock_status === "available" &&
          String(batch?.batch_no ?? "")
            .toLowerCase()
            .includes(term)
        );
      };

      // Options are appended per call, so each input value only ever emits
      // the rows it has not emitted yet. When nothing new qualifies, pull
      // the next server page (100 rows) — that is the infinite scroll.
      const emitted = emittedRef.current.get(term) ?? 0;
      const start = emitted;
      while (
        start >= batchRef.current.stock.length &&
        batchRef.current.page < batchRef.current.totalPages &&
        batchRef.current.productId
      ) {
        try {
          await loadBatchPage(
            batchRef.current.productId,
            batchRef.current.page + 1,
          );
        } catch {
          break;
        }
      }

      const fresh = batchRef.current.stock.slice(start);
      emittedRef.current.set(term, batchRef.current.stock.length);

      const options = fresh.filter(matches).map((batch: any) => ({
        value: batch.id,
        label: formatBatchLabel(batch),
        raw: batch,
      }));

      const hasMore = batchRef.current.page < batchRef.current.totalPages;
      return {
        options,
        hasMore,
        additional: { page: batchRef.current.page },
      };
    },
    [calc, formatBatchLabel, loadBatchPage],
  );

  const { data: shopdata } = useGetShopQuery({ gst: true });

  // ─── Form
  const {
    register,
    control,
    watch,
    getValues,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(inVoiceSchema) as any,
    defaultValues: {
      ...defaultInvoice,
      invoice_no: generateInvoiceNo(),
    },
  });

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchAllFields = watch();

  // Close the discount popover on any outside click / Escape.
  useEffect(() => {
    if (!isDiscountOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        discountWrapRef.current &&
        !discountWrapRef.current.contains(event.target as Node)
      ) {
        setIsDiscountOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDiscountOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDiscountOpen]);

  // Same outside-click behaviour for the tax popover.
  useEffect(() => {
    if (!isTaxOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        taxWrapRef.current &&
        !taxWrapRef.current.contains(event.target as Node)
      ) {
        setIsTaxOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsTaxOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTaxOpen]);

  // ─── Derived totals
  const discountType = watchAllFields.discount_type ?? "none";
  const discountInput = calc.toNumber(watchAllFields.discount);

  // One tax rate covers the whole bill; "none" means it is not charged at all.
  const taxType = watchAllFields.tax_type ?? "none";
  const taxInput = calc.toNumber(watchAllFields.gst);
  // The shop master switch wins: when GST is off on the shop, no document
  // may charge tax regardless of the per-bill option.
  const shopGstOn = Boolean(shopdata?.shop?.gst);
  const isTaxed = calc.tax.shouldCharge({
    enabled: taxType === "percentage",
    shopEnabled: shopGstOn,
  });

  /**
   * One call replaces the hand-rolled subtotal / GST / gross / discount / total
   * chain. It rounds after every step exactly like invoice.service.ts:170-188,
   * so the preview total is the stored total.
   */
  const {
    subtotal,
    gstAmount,
    cgstAmount,
    sgstAmount,
    discountAmount,
    finalAmount,
  } = calc.invCal.totals(fields, {
    gstPercentage: taxInput,
    enabled: isTaxed,
    discountType,
    discount: watchAllFields.discount,
  });

  // ─── Add item to field array
  /** Appends the staged item. Returns false (keeping the panel open) on validation failure. */
  const handleAddItem = (): boolean => {
    if (!newItem.product) {
      showItemError("product", "Please select a product.");
      return false;
    }
    if (!newItem.stockId) {
      showItemError("batch", "Please select a stock batch.");
      return false;
    }

    if (Number(newItem.quantity) <= 0) {
      showItemError("quantity", "Quantity must be greater than zero.");
      return false;
    }

    if (newItem.price.trim() === "") {
      showItemError("price", "Please enter a price.");
      return false;
    }

    const batch = availableBatches.find((b: any) => b.id === newItem.stockId);

    if (!batch) {
      showItemError("batch", "Selected stock batch is no longer available.");
      return false;
    }

    // Quantity is in pieces, so compare it against what is left of the batch
    // after the lines already on the bill. Without netting the cart, two lines
    // on the same batch each pass while together over-drawing the stock.
    const availablePieces = Math.max(
      0,
      calc.invCal.batchPieces(batch) -
        alreadyOnBill(newItem.product.value, newItem.stockId),
    );

    if (calc.toNumber(newItem.quantity) > availablePieces) {
      showItemError(
        "quantity",
        `Only ${availablePieces} pcs available in this batch (entered ${calc.toNumber(
          newItem.quantity,
        )}).`,
      );
      return false;
    }

    // Only merge into an existing line when the same product, batch AND
    // price are chosen. A different price means a separate line so the
    // per-unit rate is preserved for each entry.
    const newPrice = calc.toNumber(newItem.price);
    const productId = newItem.product!.value;
    const existingIndex = (getValues("items") ?? []).findIndex(
      (item) =>
        item.productId === productId &&
        item.stockId === newItem.stockId &&
        calc.toNumber(item.price) === newPrice,
    );

    if (existingIndex > -1) {
      const existing = (getValues("items") ?? [])[existingIndex];
      update(existingIndex, {
        ...existing,
        quantity:
          calc.toNumber(existing.quantity) + calc.toNumber(newItem.quantity),
      });
    } else {
      append({
        stock_type: "stock",
        productId,
        stockId: newItem.stockId,
        product_name: newItem.product!.label,
        batch_no: batch?.batch_no ?? "",
        expiry_date: batch?.expiry_date ?? "",
        quantity: calc.toNumber(newItem.quantity),
        price: calc.toNumber(newItem.price),
      });
    }

    setNewItem(defaultNewItem);
    setItemError("");
    setItemErrorField("");
    return true;
  };

  const onSubmit = async (data: InvoiceForm) => {
    // The API stores discount_type as "percentage" | "amount" and has no
    // "none" — omitting both when there is no discount leaves the columns NULL.
    const hasDiscount = calc.discount.hasDiscount(
      data.discount_type,
      data.discount,
    );

    const payload = {
      invoice_no: data.invoice_no || invoiceNo,
      // The invoice table stores patient/doctor, not a generic customer record.
      patient_name: data.customer_name,
      doctor_name: data.doctor_name,
      phone_number: data.phone_no?.trim(),
      email: data.email?.trim(),
      address: data.address?.trim(),
      // ...(data.phone_no?.trim() && { phone_number: data.phone_no.trim() }),
      // ...(data.email?.trim() && { email: data.email.trim() }),
      // ...(data.address?.trim() && { address: data.address.trim() }),
      ...(hasDiscount && {
        discount_type: data.discount_type,
        discount: calc.toNumber(data.discount),
      }),
      items: data.items.map((item: any) => ({
        productId: item.productId,
        stockId: item.stockId,
        // Quantity is a count of pieces, so it must be a whole number.
        quantity: Math.round(calc.toNumber(item.quantity)),
        price: item.price,
        // One document-wide rate, applied to every line. CGST/SGST are derived
        // server-side as gst / 2 each.
        gst: isTaxed ? taxInput : 0,
      })),
    };

    try {
      const res: any = await createInvoice(payload).unwrap();
      if (res?.success) {
        const serverNo =
          res?.data?.invoice?.invoice_no ??
          res?.data?.invoice_no ??
          res?.invoice_no ??
          "";
        setInvoiceId(res?.data?.invoice?.id);
        if (serverNo) {
          setSavedInvoiceNo(serverNo);
          setValue("invoice_no", serverNo);
        }
        setToastMessage(
          "success",
          res.message || "Invoice created successfully",
        );
      }
    } catch (error: any) {
      if (error?.status === 401) {
        return;
      }
      setToastMessage(
        "error",
        error?.data?.message || "Failed to save invoice",
      );
    }
  };

  const onError = (errs: any) => {
    if (import.meta.env.DEV) {
      console.log("Validation errors:", errs);
    }
    // Show field-level errors as toasts so they are not missed
    if (errs?.items?.message) {
      setToastMessage("error", errs.items.message);
    }
    if (errs?.customer_name?.message) {
      setToastMessage("error", errs.customer_name.message);
    }
    if (errs?.doctor_name?.message) {
      setToastMessage("error", errs.doctor_name.message);
    }
    if (errs?.phone_no?.message) {
      setToastMessage("error", errs.phone_no.message);
    }
    if (errs?.email?.message) {
      setToastMessage("error", errs.email.message);
    }
    if (errs?.address?.message) {
      setToastMessage("error", errs.address.message);
    }
    if (errs?.discount?.message) {
      setToastMessage("error", errs.discount.message);
    }
    if (errs?.gst?.message) {
      setToastMessage("error", errs.gst.message);
    }
  };

  const handlePrint = async () => {
    if (isPrinting || !printData) return;
    setIsPrinting(true);
    try {
      await printReceipt("INVOICE / BILL", printData, printFormat);
    } catch (error: any) {
      setToastMessage("error", error?.message || "Failed to open print");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const fileName = `${watchAllFields.invoice_no || "invoice"}.pdf`;
      if (!window.electronAPI?.savePDF) {
        await downloadReceiptPdf(
          fileName,
          "INVOICE / BILL",
          printData,
          printFormat,
        );
        setToastMessage("success", "PDF downloaded successfully");
        return;
      }

      const result = await window.electronAPI.savePDF({
        fileName,
        title: "INVOICE / BILL",
        data: printData,
        format: printFormat,
      });
      if (result.success) {
        setToastMessage("success", "Invoice saved & PDF downloaded");
      } else {
        setToastMessage("error", "Failed to save invoice PDF");
      }
    } catch (error: any) {
      setToastMessage(
        "error",
        error?.message || error?.data?.message || "Failed to save invoice PDF",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const documentNumber = watchAllFields.invoice_no || "invoice";
      await shareReceiptPdf(
        `${documentNumber}.pdf`,
        "INVOICE / BILL",
        printData,
        printFormat,
      );
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        setToastMessage("error", "Failed to share PDF");
      }
    }
  };

  const isAddDisabled = Boolean(invoiceId);

  /** The batch currently staged in the "Add Item" modal, if any. */
  const stagedBatch = availableBatches.find(
    (b: any) => b.id === newItem.stockId,
  );

  /** Pieces of a batch already staged on the bill for the same product. */
  const alreadyOnBill = useCallback(
    (productId?: number, stockId?: number): number =>
      (getValues("items") ?? [])
        .filter(
          (item) => item.productId === productId && item.stockId === stockId,
        )
        .reduce((sum, item) => sum + calc.toNumber(item.quantity), 0),
    [calc, getValues],
  );

  /** Pieces the staged batch can still give out, minus what is already on the bill. */
  const stagedAvailable = useMemo(() => {
    if (!stagedBatch) return 0;

    return Math.max(
      0,
      calc.invCal.batchPieces(stagedBatch) -
        alreadyOnBill(newItem.product?.value, newItem.stockId),
    );
  }, [
    stagedBatch,
    newItem.product?.value,
    newItem.stockId,
    calc,
    alreadyOnBill,
  ]);

  const printableItems = fields.map((item: any) => ({
    product_name: item.product_name ?? "",
    quantity: item.quantity,
    price: item.price,
    serial_no: item.batch_no ?? "",
    expiry_date: item.expiry_date ?? "",
  }));

  const printData = {
    shop: {
      shop_name: shopdata?.shop?.shop_name || "",
      phone: shopdata?.shop?.phone || "",
      email: shopdata?.shop?.email || "",
      address: shopdata?.shop?.address || "",
      gstin: shopGstOn ? shopdata?.shop?.gstin || "" : "",
      logo: shopdata?.shop?.logo,
    },
    customer: {
      name: watchAllFields.customer_name || "",
      phone: watchAllFields.phone_no || "",
      email: watchAllFields.email || "",
      address: watchAllFields.address || "",
      doctor: watchAllFields.doctor_name || "",
    },
    bill: {
      no: savedInvoiceNo || "",
      invoice_date: watchAllFields.invoice_date
        ? new Date(watchAllFields.invoice_date).toLocaleDateString("en-GB")
        : new Date().toLocaleDateString("en-GB"),
      items: printableItems,
      subtotal: subtotal,
      finalAmount: finalAmount,
      gstPercentage: isTaxed ? taxInput : 0,
      gstAmount: gstAmount,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      discountAmount: discountAmount,
      discountLabel: calc.discount.label(discountType, discountInput),
    },
  };

  return (
    <div className="invoice-layout">
      {/* ── Left: Configuration Panel */}
      <div className="invoice-config-panel">
        {/* Fixed Header */}
        <div className="invoice-panel-header">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <div>
              <h3 className="invoice-panel-title">Invoice Configuration</h3>
              <p className="invoice-panel-desc">
                Select items from live inventory; stock is deducted
                automatically
              </p>
            </div>
          </div>

          <div className="invoice-header-actions">
            {invoiceId ? (
              <Button
                variant="outline"
                type="button"
                className="md-hidden justify-center btn-lg-pad"
                onClick={() => setShowMobilePreview(true)}
              >
                <Eye size={18} />
                Preview
              </Button>
            ) : null}

            <Button
              variant="outline"
              type="button"
              className="invoice-reset-btn"
              onClick={() => {
                reset({
                  ...defaultInvoice,
                  invoice_no: generateInvoiceNo(),
                });

                setInvoiceId(null);
                setNewItem(defaultNewItem);
                setItemError("");
                setItemErrorField("");
              }}
            >
              {/* <TbReload size={15} /> */}
              Reset Form
            </Button>

            <Button
              type="submit"
              form="invoice-form"
              className="invoice-submit-btn"
              loading={isCreatingLoading}
              disabled={isCreatingLoading || Boolean(invoiceId)}
            >
              Submit Invoice
            </Button>
          </div>
        </div>

        {/* {isLoadingInvoice ? (
          <CircleLoader />
        ) : ( */}
        <form
          className="invoice-form"
          id="invoice-form"
          onSubmit={handleSubmit(onSubmit, onError)}
        >
          <div className="invoice-form-scroll">
            {/* ── Customer Details ─── */}
            <div className="flex flex-col gap-2">
              <SectionTitle
                // icon={<FaRegUser size={18} />}
                title="Customer Details"
              />

              <div className="invoice-field-grid">
                <Input
                  label="Customer Name (Optional)"
                  labelClassName="text-xs font-medium"
                  placeholder="e.g. Anusha S"
                  className="bg-white"
                  // icon={<FaUserAlt size={10} />}
                  {...register("customer_name")}
                  disabled={Boolean(invoiceId)}
                  error={errors.customer_name?.message}
                />
                <Input
                  label="Doctor Name (Optional)"
                  labelClassName="text-xs font-medium"
                  placeholder="e.g. Dr. Raj Kumar"
                  className="bg-white"
                  // icon={<FaUserAlt size={10} />}
                  {...register("doctor_name")}
                  disabled={Boolean(invoiceId)}
                  error={(errors as any).doctor_name?.message}
                />
                <Input
                  label="Phone Number (Optional)"
                  type="number"
                  labelClassName="text-xs font-medium"
                  placeholder="e.g. +91 9876543210"
                  className="bg-white"
                  // icon={<MdLocalPhone size={15} />}
                  disabled={Boolean(invoiceId)}
                  {...register("phone_no")}
                  error={errors.phone_no?.message}
                />
                <Input
                  label="Email (Optional)"
                  labelClassName="text-xs font-medium"
                  placeholder="e.g. example@gmail.com"
                  className="bg-white"
                  // icon={<MdEmail size={15} />}
                  disabled={Boolean(invoiceId)}
                  {...register("email")}
                  error={errors.email?.message}
                />
                <div className="flex flex-col gap-1">
                  <label className="form-label text-xs font-medium">
                    Address (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. 35/111-A, Court Road, Thuckalay"
                    rows={3}
                    disabled={Boolean(invoiceId)}
                    {...register("address")}
                  />
                  {errors.address?.message && (
                    <span className="text-xs text-red">
                      {errors.address.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Products / Services ─── */}
            <div className="flex flex-col gap-2">
              {/* Add Item entry points + discount popover trigger */}
              <div className="invoice-actions-row">
                <Button
                  type="button"
                  className="flex-1"
                  disabled={isAddDisabled || Boolean(invoiceId)}
                  onClick={() => {
                    setNewItem(defaultNewItem);
                    setIsAddItemOpen(true);
                    setItemError("");
                    setItemErrorField("");
                  }}
                >
                  <Plus size={18} />
                  Add Item
                </Button>

                <div className="invoice-discount-wrap" ref={discountWrapRef}>
                  <Button
                    type="button"
                    variant="outline"
                    className={
                      discountType === "none"
                        ? "invoice-discount-btn"
                        : "invoice-discount-btn invoice-discount-btn-active"
                    }
                    aria-expanded={isDiscountOpen}
                    aria-haspopup="dialog"
                    onClick={() => setIsDiscountOpen((prev) => !prev)}
                  >
                    {/* <MdDiscount size={16} /> */}
                    {discountType === "percentage"
                      ? `${discountInput}%`
                      : discountType === "amount"
                        ? `₹${discountInput}`
                        : "Discount"}
                    <ChevronDown
                      size={14}
                      className={
                        isDiscountOpen ? "invoice-discount-caret-open" : ""
                      }
                    />
                  </Button>

                  {isDiscountOpen && (
                    <div className="invoice-discount-pop" role="dialog">
                      <div className="invoice-discount-pop-head">Discount</div>

                      {/* None / Percentage / Amount */}
                      <div className="invoice-discount-opts">
                        {DISCOUNT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={
                              discountType === option.value
                                ? "invoice-discount-opt invoice-discount-opt-active"
                                : "invoice-discount-opt"
                            }
                            onClick={() => {
                              setValue("discount_type", option.value);
                              // "None" is a real zero, not "keep the old value".
                              if (option.value === "none") {
                                setValue("discount", 0);
                                setIsDiscountOpen(false);
                              }
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {discountType !== "none" && (
                        <div className="invoice-discount-value">
                          <Input
                            label={
                              discountType === "percentage"
                                ? "Percentage (%)"
                                : "Amount (₹)"
                            }
                            type="number"
                            min={0}
                            max={
                              discountType === "percentage" ? 100 : undefined
                            }
                            step={discountType === "percentage" ? 0.5 : 1}
                            labelClassName="text-xs font-medium"
                            placeholder={
                              discountType === "percentage"
                                ? "e.g. 10"
                                : "e.g. 250"
                            }
                            // icon={
                            //   discountType === "percentage" ? (
                            //     <MdOutlinePercent size={15} />
                            //   ) : (
                            //     <BsCurrencyRupee size={15} />
                            //   )
                            // }
                            {...register("discount", { valueAsNumber: true })}
                            error={errors.discount?.message}
                          />

                          <span className="invoice-discount-hint">
                            Saves {calc.formatCurrency(discountAmount)} · New
                            total {calc.formatCurrency(finalAmount)}
                          </span>

                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => setIsDiscountOpen(false)}
                          >
                            Done
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className="invoice-discount-wrap"
                  ref={taxWrapRef}
                  style={shopGstOn ? undefined : { display: "none" }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className={
                      isTaxed
                        ? "invoice-discount-btn invoice-discount-btn-active"
                        : "invoice-discount-btn"
                    }
                    aria-expanded={isTaxOpen}
                    aria-haspopup="dialog"
                    onClick={() => setIsTaxOpen((prev) => !prev)}
                  >
                    {/* <MdOutlinePercent size={16} /> */}
                    {isTaxed ? `Tax ${taxInput}%` : "Tax"}
                    <ChevronDown
                      size={14}
                      className={isTaxOpen ? "invoice-discount-caret-open" : ""}
                    />
                  </Button>

                  {isTaxOpen && (
                    <div className="invoice-discount-pop" role="dialog">
                      <div className="invoice-discount-pop-head">Tax</div>

                      {/* None / Tax Percentage */}
                      <div className="invoice-discount-opts">
                        {TAX_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={
                              taxType === option.value
                                ? "invoice-discount-opt invoice-discount-opt-active"
                                : "invoice-discount-opt"
                            }
                            onClick={() => {
                              setValue("tax_type", option.value);
                              // "None" is a real zero, not "keep the old value".
                              if (option.value === "none") {
                                setValue("gst", 0);
                                setIsTaxOpen(false);
                              }
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {isTaxed && (
                        <div className="invoice-discount-value">
                          <Input
                            label="Tax Percentage (%)"
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            labelClassName="text-xs font-medium"
                            placeholder="e.g. 18"
                            // icon={<MdOutlinePercent size={15} />}
                            {...register("gst", {
                              valueAsNumber: true,
                            })}
                            error={errors.gst?.message}
                          />

                          <span className="invoice-discount-hint">
                            Adds {calc.formatCurrency(gstAmount)} · New total{" "}
                            {calc.formatCurrency(finalAmount)}
                          </span>

                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => setIsTaxOpen(false)}
                          >
                            Done
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {itemError && (
                <span className="text-xs text-red">{itemError}</span>
              )}

              {/* ── Item list ── */}
              {fields.length > 0 ? (
                <div className="invoice-item-list">
                  {fields.map((field, index) => (
                    <div key={field.id} className="invoice-item-row">
                      <div className="flex items-center flex-1 gap-3">
                        <span className="invoice-item-index">{index + 1}</span>
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-sm font-medium text-truncate">
                            {field.product_name}
                          </span>
                          <span className="text-xs font-medium text-txt3">
                            {field.stock_type === "stock" && field.batch_no && (
                              <span className="invoice-item-sn">
                                Batch: {field.batch_no} ·
                              </span>
                            )}
                            {(field as any).expiry_date &&
                              field.stock_type === "stock" && (
                                <span className="invoice-item-sn">
                                  Exp: {(field as any).expiry_date}
                                </span>
                              )}
                            Qty: {field.quantity} ×{" "}
                            {calc.formatCurrency(field.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-txt3">
                          @{calc.formatCurrency(field.price)}/pc
                        </span>
                        <span className="text-xs font-semibold">
                          {calc.formatCurrency(calc.invCal.lineBase(field))}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="invoice-item-remove"
                        disabled={Boolean(invoiceId)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <NoData message="No items added yet." />
              )}

              {errors.items?.message && (
                <span className="form-error">{errors.items.message}</span>
              )}
            </div>
          </div>
        </form>
        {/* )} */}
      </div>

      {/* ── Right: Live Preview (tablet & desktop only)  */}
      <div className="hidden md-flex flex-col min-h-0">
        <div className="invoice-preview-header">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <h3 className="invoice-preview-title">
              Live Invoice / Bill Preview
            </h3>

            {/* A4 / Thermal format switch */}
            {isElectronDesktop && (
              <div className="invoice-format-toggle">
                <button
                  type="button"
                  className={
                    printFormat === "a4"
                      ? "invoice-format-btn invoice-format-btn-active"
                      : "invoice-format-btn"
                  }
                  onClick={() => setPrintFormat("a4")}
                >
                  A4
                </button>
                {/* <button
                type="button"
                className={
                  printFormat === "thermal"
                    ? "invoice-format-btn invoice-format-btn-active"
                    : "invoice-format-btn"
                }
                onClick={() => setPrintFormat("thermal")}
              >
                Thermal
              </button> */}
              </div>
            )}
            <span className="invoice-items-badge">{fields.length} Items</span>
          </div>

          {invoiceId && (
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                className="invoice-save-btn"
                type="button"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <Download size={14} />
                )}
                {isSaving ? "Saving…" : "Save"}
              </Button>
              {isElectronDesktop ? (
                <Button
                  variant="others"
                  className="invoice-print-btn"
                  type="button"
                  disabled={isLoadingPrinters}
                  loading={isPrinting}
                  onClick={() => {
                    // Desktop can target a specific printer; web uses the
                    // browser's own print dialog.
                    if (isElectronDesktop) {
                      setShowPrinterModal(true);
                    } else {
                      handlePrint();
                    }
                  }}
                >
                  {/* <MdLocalPrintshop size={15} /> */}
                  Print
                </Button>
              ) : (
                <Button
                  variant="others"
                  className="invoice-print-btn"
                  type="button"
                  onClick={handleShare}
                >
                  <Share2 size={14} />
                  Share
                </Button>
              )}

              {/* {!isElectronDesktop && (
                <Button
                  variant="others"
                  className="invoice-print-btn"
                  type="button"
                  onClick={handleShare}
                >
                  <Share2 size={14} />
                  Share
                </Button>
              )} */}
            </div>
          )}
        </div>

        <div
          className={
            printFormat === "thermal"
              ? "print-view-scroll print-view-scroll-thermal"
              : "print-view-scroll"
          }
        >
          {printFormat === "thermal" ? (
            <ThermalPrintPage title="INVOICE / BILL" data={printData} />
          ) : (
            <PrintPage title="INVOICE / BILL" data={printData} />
          )}
        </div>
      </div>

      {/* Mobile only: live A4 preview in a modal (below md) */}

      {showMobilePreview && (
        <PrintViewModal
          id={invoiceId}
          type="invoice"
          onClose={() => setShowMobilePreview(false)}
          isOpen={showMobilePreview}
        />
      )}
      {showPrinterModal && (
        <PrinterListModal
          isOpen={showPrinterModal}
          onClose={() => setShowPrinterModal(false)}
          title="INVOICE / BILL"
          data={printData}
          format={printFormat}
        />
      )}

      {/* ── Add Item in Stock modal ── */}
      {isAddItemOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddItemOpen(false);
          }}
        >
          <div className="modal-panel modal-panel-lg">
            <div className="flex items-center justify-between invoice-modal-head">
              <h3 className="invoice-section-heading">
                Select Product &amp; Batch
              </h3>
              <button
                type="button"
                className="invoice-item-remove"
                onClick={() => {
                  setIsAddItemOpen(false);
                  setNewItem(defaultNewItem);
                  setItemError("");
                  setItemErrorField("");
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="invoice-modal-body">
              <div className="invoice-item-grid">
                <div className="flex flex-col gap-1">
                  <div className="invoice-label-row">
                    <label className="text-xs font-medium text-txt1">
                      Select Product (From Inventory)
                    </label>
                    <RefreshCw
                      onClick={() => {
                        setItemError("");
                        setItemErrorField("");
                        setNewItem({ ...newItem, product: null });
                      }}
                      size={15}
                      className="cursor-pointer text-primary"
                    />
                  </div>
                  <AsyncPaginate
                    value={newItem.product}
                    isDisabled={Boolean(invoiceId)}
                    onChange={(value) => {
                      setItemError("");
                      setItemErrorField("");
                      setNewItem((current) => ({
                        ...current,
                        product: value,
                        stockId: undefined,
                        quantity: 1,
                        // Products carry no pack size, so a per-piece unit price
                        // cannot be derived yet — it is filled in on batch pick.
                        price: "",
                      }));
                    }}
                    isSearchable
                    isClearable
                    loadOptions={loadProductOptions}
                    placeholder="Search & select a product…"
                    styles={asyncPaginateStyle(false)}
                    menuPortalTarget={selectMenuPortalTarget()}
                    additional={{ page: 1 }}
                  />
                  {itemError && itemErrorField === "product" && (
                    <span className="text-xs text-red">{itemError}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="invoice-label-row">
                    <label className="text-xs font-medium text-txt1">
                      Select Stock Batch
                    </label>
                  </div>
                  <AsyncPaginate
                    key={`batch-select-${newItem.product?.value ?? "none"}`}
                    value={
                      newItem.stockId
                        ? (() => {
                            const picked = availableBatches.find(
                              (b: any) => b.id === newItem.stockId,
                            );
                            return picked
                              ? {
                                  value: picked.id,
                                  label: formatBatchLabel(picked),
                                }
                              : null;
                          })()
                        : null
                    }
                    isDisabled={!newItem.product?.value || Boolean(invoiceId)}
                    onChange={(value) => {
                      setItemError("");
                      setItemErrorField("");
                      const picked = availableBatches.find(
                        (b: any) => b.id === value?.value,
                      );
                      setNewItem((current) => ({
                        ...current,
                        stockId: value?.value as number,
                        // The pack size lives on the batch, so the per-piece
                        // unit price can only be resolved here. It stays
                        // editable — this is just the correct default.
                        price: picked
                          ? String(
                              calc.invCal.piecePriceFromBatch(
                                current.product?.raw?.sell_price,
                                picked,
                              ) || "",
                            )
                          : current.price,
                      }));
                    }}
                    isSearchable
                    isClearable
                    loadOptions={loadBatchOptions}
                    placeholder={
                      isBatchesLoading ? "Loading batches…" : "Search batch no…"
                    }
                    noOptionsMessage={() => "No available batch"}
                    styles={asyncPaginateStyle(false)}
                    menuPortalTarget={selectMenuPortalTarget()}
                    additional={{ page: 1 }}
                  />
                  {itemError && itemErrorField === "batch" && (
                    <span className="text-xs text-red">{itemError}</span>
                  )}
                  {/* {newItem.product?.value &&
                    !isBatchesLoading &&
                    availableBatches.length === 0 && (
                      <span className="text-xs text-red">
                        No available stock batch for this product
                      </span>
                    )} */}

                  {itemError && itemErrorField === "product" && (
                    <span className="text-xs ">{""}</span>
                  )}
                </div>
              </div>

              <div className="invoice-qty-grid">
                {/* Quantity */}
                <Input
                  label="Qty (pcs)"
                  type="number"
                  min={1}
                  placeholder="1"
                  labelClassName="text-xs font-medium"
                  className="bg-white"
                  // icon={<FaHashtag size={12} />}
                  disabled={Boolean(invoiceId)}
                  value={newItem.quantity}
                  onChange={(e) => {
                    setItemError("");
                    setItemErrorField("");
                    setNewItem({
                      ...newItem,
                      quantity: Number(e.target.value),
                    });
                  }}
                  error={itemErrorField === "quantity" ? itemError : undefined}
                />

                {/* Unit Price */}
                <Input
                  label="Unit Price (₹) / pc"
                  type="number"
                  min={0}
                  step="0.01"
                  labelClassName="text-xs font-medium"
                  placeholder="Select a batch to auto-fill"
                  className="bg-white"
                  // icon={<BsCurrencyRupee size={15} />}
                  value={newItem.price}
                  disabled={Boolean(invoiceId)}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Maximum 2 decimal places
                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                      setItemError("");
                      setItemErrorField("");
                      setNewItem({
                        ...newItem,
                        price: value,
                      });
                    }
                  }}
                  error={itemErrorField === "price" ? itemError : undefined}
                />

                {/* Confirm */}
                <div className="invoice-add-cell">
                  <div className="form-field">
                    <div className="form-label-row">
                      <label className="form-label text-xs font-medium">
                        &nbsp;
                      </label>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={isAddDisabled || Boolean(invoiceId)}
                      onClick={() => {
                        // Keep the modal open on a validation failure so the
                        // user can correct the input they just made.
                        if (handleAddItem()) setIsAddItemOpen(false);
                      }}
                    >
                      <Plus size={18} />
                      Add to Bill
                    </Button>
                  </div>
                </div>
              </div>

              {/* Makes the pack conversion auditable instead of a black box. */}
              {newItem.stockId && stagedBatch && (
                <span className="text-xs text-txt2">
                  Sell price{" "}
                  {calc.formatCurrency(newItem.product?.raw?.sell_price)} ÷ pack
                  size {calc.invCal.batchPack(stagedBatch)} ={" "}
                  {calc.formatCurrency(newItem.price)} per pc ·{" "}
                  {calc.toNumber(newItem.quantity)} pcs ={" "}
                  {calc.formatCurrency(
                    calc.invCal.lineBase({
                      quantity: newItem.quantity,
                      price: newItem.price,
                    }),
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
