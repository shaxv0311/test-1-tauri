import {
  Archive,
  Download,
  Eye,
  FileText,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import Button from "../../../components/ui/Button";
// import { TbReload } from "react-icons/tb";
// import { FaHashtag, FaRegUser, FaSave, FaUserAlt } from "react-icons/fa";
import Input from "../../../components/ui/Input";
import { SectionTitle } from "../component/SectionTitle";
// import {
//   MdEmail,
//   MdLocalPhone,
//   MdLocalPrintshop,
//   MdOutlinePercent,
// } from "react-icons/md";
// import { FaLocationDot } from "react-icons/fa6";
// import { AiFillTool } from "react-icons/ai";
// import { BsCurrencyRupee } from "react-icons/bs";
import NoData from "../../../components/table/noData";
import StatusToggleCard from "../../../components/ui/StatusToggleCard";
import { PrintPage } from "../../../components/ui/printPage";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  defaultQuotation,
  QuotationForm,
  quotationSchema,
} from "../../../api/featutres/quotationFeatures/quotationSchema";
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
} from "../../../api/featutres/quotationFeatures/quotationApi";
import { setToastMessage } from "../../../helper/helper";
import { generateQuotationNo } from "../../../helper/date";
import { Loader2 } from "lucide-react";
import PrinterListModal from "../component/PrinterListModal";

import { useParams } from "react-router-dom";
import CircleLoader from "../../../components/ui/CircleLoader";
import PrintViewModal from "../../../components/ui/PrintViewModal";
import { useGetShopQuery } from "../../../api/featutres/shopFeatures/shopApi";
import { useCalculateAction } from "../../../hooks/useCalculateAction";
import { downloadReceiptPdf, shareReceiptPdf } from "../../../helper/pdf";

export default function Quotation() {
  const { id } = useParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const [quotationId, setQuotationId] = useState(Number(id) || null);

  const isElectronDesktop = Boolean(window.electronAPI?.savePDF);

  // Printer selection modal
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  // Mobile only: A4 preview as a modal (below lg)
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const { data: quotation, isLoading } = useGetQuotationByIdQuery(id, {
    skip: !id,
  });

  const [createQuotation, { isLoading: isCreatingLoading }] =
    useCreateQuotationMutation();

  const [updateQuotation, { isLoading: isUpdatingLoading }] =
    useUpdateQuotationMutation();
  // const [quotationNo] = useState(generateQuotationNo());

  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<QuotationForm>({
    resolver: zodResolver(quotationSchema) as any,
    defaultValues: {
      ...defaultQuotation,
      quotation_no: generateQuotationNo(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [newItem, setNewItem] = useState({ name: "", quantity: 1, price: "" });

  const watchAllFields = watch();
  const { data: shopdata } = useGetShopQuery({});
  const calc = useCalculateAction();

  // Shop-level master switch, set from Settings → "Show GST Calculation".
  const isGstAvailable = Boolean(shopdata?.shop?.gst);

  useEffect(() => {
    if (quotation?.quotation) {
      reset({
        quotation_no: quotation?.quotation?.quotation_no,
        customer_name: quotation?.quotation?.customer_name,
        phone_no: quotation?.quotation?.phone_no,
        email: quotation?.quotation?.email ?? "",
        address: quotation?.quotation?.address,
        items: quotation?.quotation?.items,
        enable_gst: quotation?.quotation?.gst ? true : false,
        gst: quotation?.quotation?.gst,
      });
    }
  }, [quotation, reset]);

  const handleAddItem = () => {
    if (newItem.name && newItem.quantity > 0 && newItem.price !== "") {
      append({
        product_name: newItem.name,
        quantity: Number(newItem.quantity),
        price: Number(newItem.price),
      });
      setNewItem({ name: "", quantity: 1, price: "" });
    }
  };

  const onSubmit = async (data: QuotationForm) => {
    const payload = {
      quotation_no: data.quotation_no,
      customer_name: data.customer_name,
      phone_no: data.phone_no,
      ...(data.email && { email: data.email }),
      address: data.address,
      items: data.items,
      ...(enableGst && { gst: data.gst }),
    };

    try {
      let res;
      if (quotationId) {
        res = await updateQuotation({
          id: quotationId,
          data: payload,
        }).unwrap();
      } else {
        res = await createQuotation(payload).unwrap();
      }

      if (res?.success) {
        setQuotationId(res?.data?.quotation?.id);
        setToastMessage(
          "success",
          res.message || id
            ? "Quotation updated successfully"
            : "Quotation created successfully",
        );
      }
    } catch (error: any) {
      if (error?.status === 401) {
        return;
      }
      setToastMessage(
        "error",
        error?.data?.message || "Failed to create quotation",
      );
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const fileName = `${watchAllFields.quotation_no || "quotation"}.pdf`;
      if (!window.electronAPI?.savePDF) {
        await downloadReceiptPdf(fileName, "QUOTATION", printData);
        setToastMessage("success", "PDF downloaded successfully");
        return;
      }

      const result = await window.electronAPI.savePDF({
        fileName,
        title: "QUOTATION",
        data: printData,
      });

      if (result?.success) {
        setToastMessage("success", "PDF saved successfully");
      } else {
        setToastMessage("error", "Failed to save PDF");
      }
    } catch (error: any) {
      setToastMessage("error", error?.message || "Failed to save PDF");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const documentNumber = watchAllFields.quotation_no || "quotation";
      await shareReceiptPdf(`${documentNumber}.pdf`, "QUOTATION", printData);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        setToastMessage("error", "Failed to share PDF");
      }
    }
  };

  const gstPercentage = watchAllFields.gst || 18;
  const enableGst = calc.tax.shouldCharge({
    enabled: watchAllFields.enable_gst,
    shopEnabled: isGstAvailable,
  });

  /**
   * Shared with the invoice screen so the "Show GST Calculation" shop switch
   * gates quotations too — previously this only looked at the per-document
   * `enable_gst` flag, so a quotation still charged GST on a shop that had
   * GST switched off.
   */
  const { subtotal, gstAmount, cgstAmount, sgstAmount, finalAmount } =
    calc.invCal.totals(fields, {
      gstPercentage,
      enabled: enableGst,
      discountType: "none",
      discount: 0,
    });

  const onError = (errors: any) => {
    if (import.meta.env.DEV) {
      console.log("Validation errors:", errors);
    }
  };

  const printData = {
    shop: {
      shop_name: shopdata?.shop?.shop_name || "",
      phone: shopdata?.shop?.phone || "",
      email: shopdata?.shop?.email || "-",
      address: shopdata?.shop?.address || "",
      gstin: shopdata?.shop?.gstin || "",
      logo: shopdata?.shop?.logo,
    },
    customer: {
      name: watchAllFields.customer_name || "Customer Name",
      phone: watchAllFields.phone_no || "-",
      email: watchAllFields.email || "-",
      address: watchAllFields.address || "-",
    },
    bill: {
      no: watchAllFields.quotation_no || "QUO-0001",
      invoice_date: new Date().toLocaleDateString("en-GB"),
      items: fields,
      subtotal: subtotal,
      finalAmount: finalAmount,
      gstPercentage: enableGst ? gstPercentage : 0,
      gstAmount: gstAmount,
      cgstAmount: enableGst ? cgstAmount : undefined,
      sgstAmount: enableGst ? sgstAmount : undefined,
    },
  };

  return (
    <div className="quotation-layout">
      <div className="quotation-config-panel">
        {/* Fixed Header */}
        <div className="quotation-panel-header">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />

            <div>
              <h3 className="quotation-panel-title">Quotation Configuration</h3>

              <p className="quotation-panel-desc">
                Select items from live inventory; stock is deducted
                automatically
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            className="quotation-reset-btn"
            onClick={() => {
              reset({
                ...defaultQuotation,
                quotation_no: generateQuotationNo(),
              });
              setQuotationId(null);
              setNewItem({ name: "", quantity: 1, price: "" });
            }}
          >
            {/* <TbReload size={15} /> */}
            Reset Form
          </Button>
        </div>

        {isLoading ? (
          <CircleLoader />
        ) : (
          <form
            className="quotation-form"
            onSubmit={handleSubmit(onSubmit, onError)}
          >
            <div className="quotation-form-scroll scrollbar-hide">
              <div className="flex flex-col gap-2">
                <SectionTitle
                  // icon={<FaRegUser size={18} />}
                  title="Customer Details"
                />

                <div className="quotation-field-grid">
                  <Input
                    label="Customer Name (Optional)"
                    labelClassName="text-xs font-medium"
                    placeholder="e.g. Anusha S"
                    className="bg-white"
                    // icon={<FaUserAlt size={10} />}
                    {...register("customer_name")}
                    error={errors.customer_name?.message}
                  />
                  <Input
                    label="Phone Number (Optional)"
                    type="number"
                    labelClassName="text-xs font-medium"
                    placeholder="e.g. +91 9876543210"
                    className="bg-white"
                    // icon={<MdLocalPhone size={15} />}
                    {...register("phone_no")}
                    error={errors.phone_no?.message}
                  />

                  <Input
                    label="Email (Optional)"
                    labelClassName="text-xs font-medium"
                    placeholder="e.g. example@gmail.com"
                    className="bg-white"
                    // icon={<MdEmail size={15} />}
                    {...register("email")}
                    error={errors.email?.message}
                  />
                  <div className="quotation-address-cell">
                    <Input
                      label="Address (Optional)"
                      labelClassName="text-xs font-medium"
                      placeholder="e.g. 35/111-A, Court Road, Thuckalay"
                      className="bg-white"
                      // icon={<FaLocationDot size={15} />}
                      {...register("address")}
                      error={errors.address?.message}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <SectionTitle icon={<Archive size={18} />} title="Product " />

                <div className="quotation-section-box">
                  <div className="flex items-center justify-between">
                    <h3 className="quotation-section-heading">
                      Products (A4 Sheet Limit)
                    </h3>
                    <div className="quotation-limit-badge">
                      <span className="text-sm font-semibold text-primary">
                        {fields.length} / 20 Max
                      </span>
                    </div>
                  </div>
                  <div className="quotation-item-grid">
                    {/* Product / Service Name */}
                    <div className="quotation-name-cell">
                      <Input
                        label="Products "
                        labelClassName="text-xs font-medium"
                        placeholder="e.g. Paracetamol 500mg Strip"
                        className="bg-white"
                        // icon={<AiFillTool size={15} />}
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                      />
                    </div>

                    {/* Qty */}
                    <div>
                      <Input
                        label="Qty"
                        type="number"
                        min={1}
                        placeholder="1"
                        labelClassName="text-xs font-medium"
                        className="bg-white"
                        // icon={<FaHashtag size={12} />}
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <Input
                        label="Unit Price (₹)"
                        type="number"
                        min={0}
                        labelClassName="text-xs font-medium"
                        placeholder="e.g. 250"
                        className="bg-white"
                        // icon={<BsCurrencyRupee size={15} />}
                        value={newItem.price}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Add Item */}
                    <div className="quotation-add-cell">
                      <Button
                        type="button"
                        className="w-full"
                        onClick={handleAddItem}
                        disabled={
                          fields.length >= 20 ||
                          newItem.name === "" ||
                          newItem.quantity <= 0 ||
                          newItem.price === ""
                        }
                      >
                        <Plus size={18} />
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {fields.length > 0 ? (
                    <div className="quotation-item-list">
                      {fields.map((field, index) => (
                        <div key={field.id} className="quotation-item-row">
                          <div className="flex items-center flex-1 gap-3">
                            <span className="quotation-item-index">
                              {index + 1}
                            </span>
                            <div className="flex flex-col gap-1 flex-1">
                              <span className="text-sm font-medium text-truncate">
                                {field.product_name}
                              </span>
                              <span className="text-xs font-medium text-txt3">
                                Qty: {field.quantity} X ₹{field.price}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold">
                            ₹{field.quantity * field.price}{" "}
                          </span>

                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="quotation-item-remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NoData message="No products added yet. Use the form above to add items." />
                  )}
                  {errors.items?.message && (
                    <span className="form-error">{errors.items.message}</span>
                  )}
                </div>
              </div>
              {isGstAvailable && (
                <div className="flex flex-col gap-2">
                  <SectionTitle
                    // icon={<MdOutlinePercent size={18} />}
                    title="Tax & GST Settings"
                  />

                  <StatusToggleCard
                    noIcon={false}
                    titile="Enable GST Calculation"
                    description="When enabled, adds GST percentage to the invoice bill. When disabled GST is  hidden."
                    value={watchAllFields.enable_gst}
                    onChange={(checked) => setValue("enable_gst", checked)}
                  >
                    {watchAllFields.enable_gst && (
                      <div className="quotation-gst-fields">
                        <Input
                          label="GST Percentage (%)"
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          labelClassName="text-xs font-medium"
                          placeholder="e.g. 18"
                          className="bg-white"
                          // icon={<MdOutlinePercent size={15} />}
                          {...register("gst", {
                            valueAsNumber: true,
                          })}
                        />
                        <div className="quotation-gst-info">
                          <span className="text-primary font-semibold text-xs">
                            ℹ️ An extra {gstPercentage}% GST (
                            {calc.formatCurrency(gstAmount)}) will be added to
                            the subtotal.
                          </span>
                        </div>
                      </div>
                    )}
                  </StatusToggleCard>
                </div>
              )}
            </div>
            <div className="quotation-submit-bar">
              {quotationId ? (
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
                type="submit"
                className="quotation-submit-btn"
                loading={isCreatingLoading || isUpdatingLoading}
                disabled={isCreatingLoading || isUpdatingLoading}
              >
                {quotationId ? "Update Quotation" : "Submit Quotation"}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="hidden md-flex flex-col min-h-0">
        <div className="quotation-preview-header">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <h3 className="quotation-preview-title">
              Live Quotation Preview (A4)
            </h3>
            <span className="quotation-items-badge">
              {fields.length} / 20 Items
            </span>
          </div>
          {quotationId && (
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                className="quotation-save-btn"
                type="button"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <Download size={15} />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
              {isElectronDesktop ? (
                <Button
                  variant="others"
                  className="quotation-print-btn"
                  type="button"
                  form="quotation-form"
                  disabled={isLoadingPrinters}
                  onClick={() => setShowPrinterModal(true)}
                >
                  {/* <MdLocalPrintshop size={15} /> */}
                  Print
                </Button>
              ) : (
                <Button
                  variant="others"
                  className="quotation-print-btn"
                  type="button"
                  form="quotation-form"
                  onClick={handleShare}
                  disabled={isLoading}
                >
                  <Share2 size={14} />
                  <span>Share</span>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="print-view-scroll">
          {/* <div id="quotation-print-container"> */}
          <PrintPage title="QUOTATION" data={printData} />
          {/* </div> */}
        </div>
      </div>

      {/* Mobile only: A4 preview in a modal */}
      {showMobilePreview && (
        <PrintViewModal
          id={quotationId}
          type="quotation"
          onClose={() => setShowMobilePreview(false)}
          isOpen={showMobilePreview}
        />
      )}

      {showPrinterModal && (
        <PrinterListModal
          isOpen={showPrinterModal}
          onClose={() => setShowPrinterModal(false)}
          title="QUOTATION"
          data={printData}
        />
      )}
    </div>
  );
}
