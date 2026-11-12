import {
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import Button from "../../../components/ui/Button";
import CloseIcon from "../../../components/ui/CloseIcon";
import Input from "../../../components/ui/Input";
import { ModalProps } from "../../../utils/type";
import { useForm } from "react-hook-form";
import {
  defaultResetPassword,
  ResetPasswordFrom,
  resetPasswordSchema,
} from "../../../api/featutres/authFeatures/authSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResetPasswordMutation } from "../../../api/featutres/authFeatures/authApi";
import { setToastMessage } from "../../../helper/helper";
import IconBox from "../../../components/ui/IconBox";

export default function ResetPasswordModal({ onClose, isOpen }: ModalProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultResetPassword,
    resolver: zodResolver(resetPasswordSchema) as any,
  });

  const onsubmit = async (data: ResetPasswordFrom) => {
    try {
      const response = await resetPassword(data).unwrap();
      if (response?.success) {
        setToastMessage("success", response.message);
        onClose();
        reset();
      }
    } catch (error: any) {
      setToastMessage("error", error?.data?.message || "Something went wrong");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="reset-password-overlay"
      onClick={onClose}
    >
      <form
        className="reset-password-panel"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit(onsubmit)}
      >
        <div className="reset-password-header">
          <div className="reset-password-header-left">
            <IconBox
              icon={<KeyRound size={20} />}
              className="bg-primary-08 text-primary"
            />
            <h3 className="reset-password-title">Reset Password</h3>
          </div>

          <CloseIcon onClose={onClose} />
        </div>

        <div className="reset-password-field">
          <Input
            type={showCurrentPassword ? "text" : "password"}
            label="Current Password"
            labelIcon={<LockKeyhole size={20} />}
            placeholder="Enter your current password"
            {...register("current_password")}
            error={errors?.current_password?.message}
            className="reset-password-input"
          />
          <button
            type="button"
            aria-label={showCurrentPassword ? "Hide username" : "Show username"}
            onClick={() => setShowCurrentPassword((visible) => !visible)}
            className="reset-password-eye"
          >
            {showCurrentPassword ? <Eye size={21} /> : <EyeOff size={21} />}
          </button>
        </div>

        <div className="reset-password-field">
          <Input
            type={showPassword ? "text" : "password"}
            label="New Password"
            labelIcon={<KeyRound size={20} />}
            placeholder="Enter your new password"
            {...register("new_password")}
            error={errors?.new_password?.message}
            className="reset-password-input"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide username" : "Show username"}
            onClick={() => setShowPassword((visible) => !visible)}
            className="reset-password-eye"
          >
            {showPassword ? <Eye size={21} /> : <EyeOff size={21} />}
          </button>
        </div>
        <div className="reset-password-field">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm Password"
            labelIcon={<ShieldCheck size={20} />}
            placeholder="Enter your confirm password"
            {...register("confirm_password")}
            error={errors?.confirm_password?.message}
            className="reset-password-input"
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide username" : "Show username"}
            onClick={() => setShowConfirmPassword((visible) => !visible)}
            className="reset-password-eye"
          >
            {showConfirmPassword ? <Eye size={21} /> : <EyeOff size={21} />}
          </button>
        </div>

        <div className="reset-password-footer">
          <Button
            variant="outline"
            className="reset-password-btn"
            onClick={onClose}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="reset-password-btn"
            disabled={isLoading}
            loading={isLoading}
          >
            <CircleCheck size={18} />
            Update Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
