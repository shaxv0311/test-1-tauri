import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { ModalProps } from "../../../utils/type";
import CloseIcon from "../../../components/ui/CloseIcon";
import NoData from "../../../components/table/noData";

interface AddSerialNoProps {
  isOpen: boolean;
  onClose: () => void;
  data?: string[];
  isViewOnly?: boolean;
  onChange?: (serials: string[]) => void;
}

export default function AddSerialNo({
  onClose,
  isOpen,
  data = [],
  isViewOnly = false,
  onChange,
}: AddSerialNoProps) {
  const [serialNo, setSerialNo] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const serials = data;

  useEffect(() => {
    if (isOpen) {
      setSerialNo("");
      setEditIndex(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add / Update
  const handleAddSerial = () => {
    const value = serialNo.trim();

    if (!value) return;

    // Edit existing serial
    if (editIndex !== null) {
      const updatedSerials = serials.map((serial, index) =>
        index === editIndex ? value : serial,
      );

      onChange?.(updatedSerials);

      setEditIndex(null);
      setSerialNo("");

      return;
    }

    // Add new serial
    const updatedSerials = [...serials, value];

    onChange?.(updatedSerials);

    setSerialNo("");
  };

  // Edit
  const handleEdit = (index: number) => {
    setSerialNo(serials[index]);
    setEditIndex(index);
  };

  // Delete
  const handleDelete = (index: number) => {
    const updatedSerials = serials.filter((_, i) => i !== index);

    onChange?.(updatedSerials);
  };

  return (
    <div className="modal-overlay">
      <div className="add-serial-modal">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-txt1">
              View IMEI / Serial No
            </h3>

            <span className="add-serial-count">
              {serials.length}
            </span>
          </div>

          <CloseIcon onClose={onClose} />
        </div>

        {/* Input + Plus */}
        {!isViewOnly && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="Enter Batch / Serial No"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="add-serial-add-btn"
              onClick={handleAddSerial}
            >
              <PlusCircle size={20} className="text-primary" />
            </Button>
          </div>
        )}

        {/* Serial List */}
        <div className="add-serial-list">
          {serials.map((serial, index) => (
            <div
              key={`${serial}-${index}`}
              className="add-serial-item"
            >
              <p className="flex-1 text-sm font-bold text-txt1">
                {isViewOnly && `${index + 1}.  `} {serial}
              </p>

              {!isViewOnly && (
                <div className="flex items-center gap-4">
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleEdit(index)}
                    className="text-primary"
                  >
                    <Edit size={17} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="text-red"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {serials.length === 0 && (
            <NoData
              message="No IMEI / Serial No added yet"
              className="border-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
