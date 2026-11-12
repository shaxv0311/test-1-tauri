import { useGetYearsQuery } from "../../api/featutres/dashboardFeatures/dashboardApi";
import { YEARS } from "../../utils/constants";
import Dropdown from "./Dropdown";

interface YearDropdownProps {
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const YearDropdown = ({ value, onChange }: YearDropdownProps) => {
  const { data, isLoading, isError } = useGetYearsQuery();
  return (
    <Dropdown
      options={data?.data?.years || YEARS}
      value={value}
      onChange={onChange}
      disabled={isLoading}
    />
  );
};

export default YearDropdown;
