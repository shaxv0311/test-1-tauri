interface ToggleButtonProps {
  data?: any;
  sizeInner?: string;
  sizeOuter?: string;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  permissionKey?: string;
  htmlFor?: string;
  label?: string;
}

const ToggleButton = ({
  data = null,
  sizeInner = "toggle-track",
  sizeOuter = "toggle-knob",
  onChange,
  disabled = false,
  permissionKey = "",
  htmlFor = "",
  label = "",
}: ToggleButtonProps) => {
  const isChecked = data === "ACTIVE" || data === true;

  const handleToggle = () => {
    if (disabled) return;
    onChange?.(!isChecked);
  };

  return (
    <label
      htmlFor={htmlFor}
      className={`toggle-root ${disabled ? "toggle-disabled" : ""}`}
    >
      {label && <span className="toggle-label">{label}</span>}

      <input
        id={htmlFor}
        type="checkbox"
        checked={isChecked}
        onChange={handleToggle}
        disabled={disabled}
        className="toggle-input"
      />

      {/* Track */}
      <div
        className={`${sizeInner} ${isChecked ? "" : "toggle-track-off"}`}
      >
        {/* Knob */}
        <div
          className={`${sizeOuter} ${isChecked ? "toggle-knob-on" : ""}`}
        />
      </div>
    </label>
  );
};

export default ToggleButton;
