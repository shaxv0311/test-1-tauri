import { CirclePlus, Plus, Search } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useEffect, useState } from "react";
import { useDebounce } from "../../../helper/helper";

export default function SearchBox({
  placeholdertxt,
  btnText,
  onClick,
  setFilter,
  filter,
  className,
}: {
  placeholdertxt: string;
  btnText: string;
  onClick: () => void;
  setFilter?: (data: any) => void;
  filter?: any;
  className?: string;
}) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 600);

  useEffect(() => {
    if (debouncedSearch == filter?.search) return;

    setFilter?.({
      ...filter,
      search: debouncedSearch,
    });
  }, [debouncedSearch]);

  return (
    <div
      className={`search-box ${className}`}
    >
      {/* Search */}
      <div className="search-box-input">
        <Input
          placeholder={placeholdertxt}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full"
          icon={<Search size={16} className="text-txt2" />}
        />
      </div>

      {/* Add button - only renders when btnText is provided */}
      {btnText && (
        <Button className="search-box-btn" onClick={onClick}>
          <CirclePlus size={20} />
          {btnText}
        </Button>
      )}
    </div>
  );
}
