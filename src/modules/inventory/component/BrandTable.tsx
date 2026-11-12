import { Edit } from "lucide-react";
import { useState } from "react";

import ActionButton from "../../../components/table/ActionButton";
import Table from "../../../components/table/Table";
import TableCell from "../../../components/table/TableCell";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import StatusCard from "../../../components/ui/StatusCard";
import NoData from "../../../components/table/noData";

import SearchBox from "./SearchBox";
import AddBrand from "./AddBrand";

import { filter, PaginationProps } from "../../../utils/type";
import TablePagination from "../../../components/table/BottomPagination";
import { BrandForm } from "../../../api/featutres/inventryFeatures/inventrySchema/brandCategorySupplierSchema";

const headerItemsDefault = [
  { label: "No", className: "text-center" },
  { label: "Brand Name" },
  { label: "Status", className: "text-center" },
  { label: "Action", className: "text-center" },
];

interface BrandTableProps {
  data?: BrandForm[];
  filter: filter;
  setFilter: (data: filter) => void;
  pagination: PaginationProps;
}

export default function BrandTable({
  data = [],
  filter,
  setFilter,
  pagination,
}: BrandTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeBrand, setActiveBrand] = useState<BrandForm | null>(null);

  const handleAddBrand = () => {
    setActiveBrand(null);
    setIsOpen(true);
  };

  const handleEditBrand = (brand: BrandForm) => {
    setActiveBrand(brand);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveBrand(null);
  };

  return (
    <div className="section-body">
      <SearchBox
        placeholdertxt="Search by brand name"
        btnText="Add New Brand"
        onClick={handleAddBrand}
        filter={filter}
        setFilter={setFilter}
        className=""
      />

      <Table>
        <TableHeader headerItems={headerItemsDefault} />

        <tbody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="border-none">
                <NoData message="No data available" className="border-none" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={index}>
                {/* No */}
                <TableCell className="text-center">
                  {(pagination?.page - 1) * filter.limit + index + 1}
                </TableCell>
                {/* Brand */}
                <TableCell>
                  <span className="font-bold text-txt1">{item.brand_name}</span>
                </TableCell>

                {/* Status */}
                <TableCell className="text-center">
                  <StatusCard
                    status={item.status ? "Active" : "Inactive"}
                    color={item.status ? "green" : "red"}
                    isShow
                  />
                </TableCell>

                {/* Action */}
                <TableCell className="text-center">
                  <ActionButton
                    icon={Edit}
                    color="primary"
                    onClick={() => handleEditBrand(item)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </Table>

      {pagination?.totalPages > 1 && (
        <TablePagination
          total={pagination?.total}
          page={pagination?.page}
          totalPages={pagination?.totalPages}
          onPageChange={(page) => setFilter({ ...filter, page })}
        />
      )}

      <AddBrand isOpen={isOpen} data={activeBrand} onClose={handleClose} />
    </div>
  );
}
