import { Edit } from "lucide-react";
import { useState } from "react";

import SearchBox from "./SearchBox";
import AddCategory from "./AddCategory";

import Table from "../../../components/table/Table";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
import ActionButton from "../../../components/table/ActionButton";
import NoData from "../../../components/table/noData";

import StatusCard from "../../../components/ui/StatusCard";

import { CategoryForm } from "../../../api/featutres/inventryFeatures/inventrySchema/brandCategorySupplierSchema";
import { filter, PaginationProps } from "../../../utils/type";
import TablePagination from "../../../components/table/BottomPagination";

const headerItemsDefault = [
  { label: "No", className: "text-center" },
  { label: "Category Name" },
  { label: "Status", className: "text-center" },
  { label: "Action", className: "text-center" },
];

interface CategoryTableProps {
  data?: CategoryForm[];
  filter: filter;
  setFilter: (data: filter) => void;
  pagination: PaginationProps;
  isFetching?: boolean;
}

export function CategoryTable({
  data = [],
  filter,
  setFilter,
  pagination,
  isFetching,
}: CategoryTableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryForm | null>(
    null,
  );

  const handleAdd = () => {
    setActiveCategory(null);
    setIsOpen(true);
  };

  const handleEdit = (category: CategoryForm) => {
    setActiveCategory(category);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveCategory(null);
  };

  return (
    <div className="section-body">
      <SearchBox
        placeholdertxt="Search by category name"
        btnText="Add New Category"
        onClick={handleAdd}
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

                {/* Category */}
                <TableCell>
                  <span className="font-bold text-txt1">{item.category}</span>
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
                    onClick={() => handleEdit(item)}
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

      <AddCategory
        isOpen={isOpen}
        data={activeCategory}
        onClose={handleClose}
      />
    </div>
  );
}
