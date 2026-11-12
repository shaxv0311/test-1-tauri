import { X } from "lucide-react";

export default function CloseIcon({ onClose }: any) {
  return (
    <button type="button" onClick={onClose} className="close-btn close-btn-sm">
      <X size={16} />
    </button>
  );
}
