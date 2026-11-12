import { Edit } from "lucide-react";
import { PhoneNumber } from "../../../components/ui/PhoneNumber";
import SearchBox from "./SearchBox";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
import StatusCard from "../../../components/ui/StatusCard";
import ActionButton from "../../../components/table/ActionButton";
import Table from "../../../components/table/Table";
import { useState } from "react";
import AddSupplier from "./AddSupplier";
import NoData from "../../../components/table/noData";
import { SupplierForm } from "../../../api/featutres/inventryFeatures/inventrySchema/brandCategorySupplierSchema";
import { filter, PaginationProps } from "../../../utils/type";
import TablePagination from "../../../components/table/BottomPagination";

const headerItemsDefault = [
  { label: "No", className: "text-center" },
  { label: "Supplier Name" },
  { label: "Address" },
  { label: "Primary Phone", className: "text-center" },
  { label: "Secondary Phone", className: "text-center" },
  { label: "Status", className: "text-center" },
  { label: "Action", className: "text-center" },
] as any;

interface SupplierTableProps {
  data?: SupplierForm[];
  filter: filter;
  setFilter: (data: filter) => void;
  pagination: PaginationProps;
}

export function SupplierTable({
  data,
  filter,
  setFilter,
  pagination,
}: SupplierTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<SupplierForm | null>(null);

  const handleAdd = () => {
    setActiveRow(null);
    setIsOpen(true);
  };

  const handleEdit = (data: SupplierForm) => {
    setActiveRow(data);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveRow(null);
  };

  return (
    <div className="section-body">
      <SearchBox
        placeholdertxt="Search suppliers by name, phone, address..."
        btnText="Add New Supplier"
        onClick={handleAdd}
        filter={filter}
        setFilter={setFilter}
        className=""
      />
      <Table>
        <TableHeader headerItems={headerItemsDefault} />
        <tbody>
          {data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headerItemsDefault.length} className="">
                <NoData message="No data available" className="border-none" />
              </TableCell>
            </TableRow>
          ) : (
            data?.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="text-center">
                  <span>
                    {(pagination?.page - 1) * filter.limit + index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-txt1 font-bold">
                    {item.supplier_name}
                  </span>
                </TableCell>
                <TableCell>
                  <span>{item.address}</span>
                </TableCell>
                <TableCell className="text-center">
                  <PhoneNumber value={item.primary_no} />
                </TableCell>
                <TableCell className="text-center">
                  {item.secondary_no ? (
                    <PhoneNumber value={item.secondary_no} />
                  ) : (
                    <span>--</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusCard
                    status={item.status ? "Active" : "Inactive"}
                    color={item.status ? "green" : "red"}
                    isShow={true}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <ActionButton
                    icon={Edit}
                    onClick={() => handleEdit(item)}
                    color="primary"
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </Table>

      {pagination.totalPages > 1 && (
        <TablePagination
          total={pagination.total}
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setFilter({ ...filter, page })}
        />
      )}

      <AddSupplier isOpen={isOpen} data={activeRow} onClose={handleClose} />
    </div>
  );
}
