import { MONTHS } from "../../utils/constants";
import Dropdown from "./Dropdown";

interface MonthDropdownProps {
  /** Selected month as 1-12, or undefined for "All Months". */
  value?: number;
  onChange: (month: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MonthDropdown = ({
  value,
  onChange,
  placeholder,
  disabled,
}: MonthDropdownProps) => {
  return (
    <Dropdown
      placeholder={placeholder}
      options={MONTHS}
      value={value ? MONTHS[value - 1] : ""}
      disabled={disabled}
      onChange={(e) =>
        onChange(
          e.target.value ? MONTHS.indexOf(e.target.value) + 1 : undefined,
        )
      }
    />
  );
};

export default MonthDropdown;
