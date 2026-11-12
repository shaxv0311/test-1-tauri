import { useEffect, useState } from "react";
import { CircleCheck, Upload, X } from "lucide-react";
// import { MdOutlineStorefront } from "react-icons/md";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/TextArea";
import Button from "../../../components/ui/Button";
import CloseIcon from "../../../components/ui/CloseIcon";
import IconBox from "../../../components/ui/IconBox";
import StatusToggleCard from "../../../components/ui/StatusToggleCard";
import { ModalProps } from "../../../utils/type";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShopForm,
  shopSchema,
  defaultShop,
} from "../../../api/featutres/shopFeatures/shopSchema";
import {
  useCreateShopMutation,
  useUpdateShopMutation,
} from "../../../api/featutres/shopFeatures/shopApi";
import { setToastMessage } from "../../../helper/helper";

export default function EditStore({ onClose, isOpen, data }: ModalProps) {
  const [createShop, { isLoading: isCreating }] = useCreateShopMutation();
  const [updateShop, { isLoading: isUpdating }] = useUpdateShopMutation();

  const isLoading = isCreating || isUpdating;
  const isEdit = Boolean(data?.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ShopForm>({
    resolver: zodResolver(shopSchema) as any,
    defaultValues: defaultShop,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (data && isOpen) {
      const nextData: ShopForm = {
        shop_name: data.shop_name || "",
        phone: data.phone || "",
        email: data.email || "",
        gstin: data.gstin || "",
        dl_no: data.dl_no || "",
        gst: Boolean(data.gst),
        status: data.status === undefined ? true : Boolean(data.status),
        logo: null,
        address: data.address || "",
      };
      if (data.logo) {
        setLogoPreview(import.meta.env.VITE_APP_USER_IMAGE_URL + data.logo);
      } else {
        setLogoPreview(null);
      }
      reset(nextData);
    } else {
      reset(defaultShop);
      setLogoPreview(null);
    }
  }, [data, reset, isOpen]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setToastMessage("error", "Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setToastMessage("error", "Image size should be less than 20 MB.");
      event.target.value = "";
      return;
    }

    setValue("logo", file, { shouldDirty: true, shouldValidate: true });
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setValue("logo", null, { shouldDirty: true, shouldValidate: true });

    const fileInput = document.getElementById(
      "store-logo-upload",
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleFormSubmit = async (value: ShopForm) => {
    try {
      const formData = new FormData();

      formData.append("shop_name", value.shop_name);
      formData.append("phone", value.phone);
      formData.append("address", value.address);
      formData.append("logo", value.logo ?? null);
      if (value.email) formData.append("email", value.email);
      if (value.gstin) formData.append("gstin", value.gstin);
      if (value.dl_no) formData.append("dl_no", value.dl_no);

      // These must always be sent, even when they are "off": every multipart
      // value arrives as a string server-side, and omitting the field left the
      // stored GST switch to be reset on unrelated edits.
      formData.append("gst", String(Boolean(value.gst)));
      formData.append("status", String(Boolean(value.status)));

      if (isEdit) {
        formData.append("id", data?.id);

        await updateShop(formData).unwrap();
      } else {
        await createShop(formData).unwrap();
      }
      setToastMessage(
        "success",
        isEdit ? "Shop updated successfully" : "Shop created successfully",
      );

      reset();
      onClose();
    } catch (error: any) {
      if (error?.status === 401) {
        return;
      }
      setToastMessage("error", error?.data?.message || "Something went wrong");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-store-overlay">
      <div className="edit-store-panel">
        <div className="edit-store-header">
          <div className="edit-store-header-left">
            {/* <IconBox
              icon={<MdOutlineStorefront size={23} />}
              className="edit-store-icon"
            /> */}
            <div className="edit-store-title-wrap">
              <h3 className="edit-store-title">
                {isEdit ? "Edit Store Information" : "Create New Store"}
              </h3>
              <p className="edit-store-subtitle">
                {isEdit
                  ? "Update business details used in Quotations, Bills & Invoices."
                  : "Set up your store details for Quotations, Bills & Invoices."}
              </p>
            </div>
          </div>
          <CloseIcon
            onClose={() => {
              reset();
              onClose();
              setLogoPreview(null);
            }}
          />
        </div>

        <div className="edit-store-divider" />

        <form
          className="edit-store-form"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <div className="flex flex-col gap-2">
            <label className="edit-store-logo-label">
              Store Logo (Optional)
            </label>

            <div className="edit-store-logo-row">
              <div className="edit-store-logo-thumb">
                {/* {logoPreview ? (
                  <img src={logoPreview} alt="Store logo preview" />
                ) : (
                  <MdOutlineStorefront className="text-txt3" size={28} />
                )} */}
              </div>

              <div className="edit-store-logo-actions-wrap">
                <input
                  id="store-logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="edit-store-logo-input"
                  disabled={isLoading}
                />

                <div className="edit-store-logo-actions">
                  <label
                    htmlFor="store-logo-upload"
                    className="edit-store-upload-btn"
                  >
                    <Upload size={16} />
                    {logoPreview ? "Change Image" : "Choose Image"}
                  </label>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="edit-store-remove-btn"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <p className="edit-store-logo-hint">
                  Only Allow 20 MB Image, Optional. PNG, JPG, or WEBP image.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Store Name"
            placeholder="e.g. ABC Medical & Surgical Shop"
            {...register("shop_name")}
            error={errors.shop_name?.message}
            disabled={isLoading}
          />

          <div className="edit-store-grid">
            <Input
              label="Phone Number"
              type="number"
              placeholder="e.g. +91 9876543210"
              {...register("phone")}
              error={errors.phone?.message}
              disabled={isLoading}
            />
            <Input
              label="E-mail Address (Optional)"
              placeholder="e.g. example@gmail.com"
              {...register("email")}
              error={errors.email?.message}
              disabled={isLoading}
            />
          </div>

          <Input
            label="GSTIN (Optional)"
            placeholder="e.g. 33AAAAA0000A1Z0"
            {...register("gstin")}
            error={errors.gstin?.message}
            disabled={isLoading}
          />

          <Input
            label="Drug Licence No (Optional)"
            placeholder="e.g. 21B1-1234/2024"
            {...register("dl_no")}
            error={errors.dl_no?.message}
            disabled={isLoading}
          />

          <Textarea
            label="Address"
            placeholder="e.g. 414 MG Road, Kanniyakumari,"
            {...register("address")}
            error={errors.address?.message}
            disabled={isLoading}
          />

          <Controller
            control={control}
            name="gst"
            render={({ field }) => (
              <StatusToggleCard
                noIcon={false}
                titile="Show GST Calculation"
                description="When enabled, GST percentage is added to bills and quotations and the GST breakdown is printed on the PDF."
                value={Boolean(field.value)}
                onChange={field.onChange}
              />
            )}
          />

          <div className="edit-store-footer">
            <Button
              type="button"
              variant="outline"
              className="edit-store-footer-cancel"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="edit-store-footer-submit"
              disabled={isLoading}
              loading={isLoading}
            >
              <CircleCheck size={18} />
              {isEdit ? "Save Changes" : "Create Store"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
