import { useEffect, useMemo, useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
// import { FaMoneyBills } from "react-icons/fa6";
import StatusCard from "../../../components/ui/StatusCard";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import IconBox from "../../../components/ui/IconBox";
import CloseIcon from "../../../components/ui/CloseIcon";
import { useUpdatePurchaseMutation } from "../../../api/featutres/inventryFeatures/inventryApi/purchaseApi";
import { setToastMessage } from "../../../helper/helper";

interface PaymentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PaymentUpdateModal = ({
  isOpen,
  onClose,
  data,
}: PaymentUpdateModalProps) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [updatePurchase, { isLoading }] = useUpdatePurchaseMutation();
  const totalAmount = toNumber(data?.total_amount);
  const paidAmount = toNumber(data?.paid_amount);
  const amount = toNumber(paymentAmount);
  const newPaidTotal = paidAmount + amount;
  const remainingDue = Math.max(0, totalAmount - newPaidTotal);
  const remainingBalance = Math.max(0, totalAmount - paidAmount);

  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(remainingBalance > 0 ? String(remainingBalance) : "");
    }
  }, [isOpen, remainingBalance]);

  const paymentStatus = useMemo(() => {
    if (newPaidTotal >= totalAmount) return "Paid";
    if (newPaidTotal > 0) return "Partial";
    return "Unpaid";
  }, [newPaidTotal, totalAmount]);

  const handleSave = async () => {
    if (amount <= 0 || amount > remainingBalance) return;

    try {
      const res = await updatePurchase({
        id: data?.id,
        data: { paid_amount: amount },
      }).unwrap();

      if (res?.success) {
        onClose();
        setPaymentAmount("");
        setToastMessage(
          "success",
          res.message || "Payment updated successfully",
        );
      }
    } catch (error: any) {
      if (error?.status === 401) return;
      setToastMessage("error", error?.data?.message || "Something went wrong");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="payment-modal-panel">
        <div className="payment-modal-head">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-4">
              <IconBox
                icon={<LockKeyhole size={22} />}
                className="payment-modal-icon"
              />
              <div>
                <div className="payment-modal-status-row">
                  <StatusCard
                    status="Financial Ledger • Payment Update"
                    color="green"
                  />
                  <StatusCard
                    status={data.payment_status}
                    color={
                      data.payment_status === "Paid"
                        ? "green"
                        : data.payment_status === "Unpaid"
                          ? "red"
                          : "orange"
                    }
                    isShow
                  />
                </div>
                <h2 className="text-lg font-bold text-txt1">
                  Settlement: Purchase {data?.invoiceNo}
                </h2>
                <p className="payment-modal-desc">
                  Record additional vendor payment and update purchase
                  settlement status.
                </p>
              </div>
            </div>
            <CloseIcon
              onClose={() => {
                setPaymentAmount("");
                onClose();
              }}
            />
          </div>
        </div>

        <div className="payment-modal-body scrollbar-hide">
          <div className="payment-summary">
            <div className="payment-summary-grid">
              <div className="payment-summary-total">
                <p className="text-xs font-semibold text-txt3">
                  Total Purchase Value
                </p>
                <p className="text-xl font-bold text-green">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="payment-summary-paid">
                <p className="text-xs font-semibold text-txt3">
                  Previously Settled
                </p>
                <p className="text-xl font-bold text-txt1">
                  {formatCurrency(paidAmount)}
                </p>
              </div>
            </div>
            <div className="payment-balance-row">
              <p className="font-bold text-txt1">Current Unpaid Balance</p>
              <p className="font-bold text-red">
                {formatCurrency(remainingBalance)}
              </p>
            </div>
          </div>

          <div>
            <label className="payment-input-label">
              Add Payment Amount (₹)
            </label>
            <Input
              type="number"
              // icon={<FaMoneyBills size={15} className="text-green" />}
              placeholder="Enter Amount paid (e.g.1500)"
              min={0}
              max={remainingBalance}
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              error={
                amount > 0 && amount > remainingBalance
                  ? "Payment cannot be greater than the remaining balance."
                  : ""
              }
            />
          </div>

          <div className="payment-preview">
            <p className="payment-preview-title">New Settlement Preview</p>
            <div className="grid grid-cols-3 gap-5">
              <div>
                <p className="text-xs font-medium text-txt2">New Paid Total</p>
                <p className="text-xl font-bold text-green">
                  {formatCurrency(newPaidTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-txt2">Remaining Due</p>
                <p className="text-xl font-bold text-red">
                  {formatCurrency(remainingDue)}
                </p>
              </div>
              <div className="flex items-center">
                <StatusCard
                  status={paymentStatus}
                  color={paymentStatus === "Paid" ? "green" : "orange"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="payment-modal-foot">
          <Button
            variant="outline"
            onClick={() => {
              setPaymentAmount("");
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="success"
            loading={isLoading}
            disabled={isLoading || amount <= 0 || amount > remainingBalance}
          >
            <Check size={17} />
            Save Payment Entry
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentUpdateModal;
