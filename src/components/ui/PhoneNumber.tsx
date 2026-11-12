// import { TbPhone } from "react-icons/tb";

export function PhoneNumber({ value }: { value: string }) {
  return (
    <div className="phone-number">
      <div className="phone-number-chip">
        {/* <TbPhone size={12} /> */}
        <span>{value}</span>
      </div>
    </div>
  );
}
