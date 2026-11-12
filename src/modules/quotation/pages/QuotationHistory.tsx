import { useEffect, useState } from "react";
import {
  Eye,
  Trash2,
  FileText,
  Search,
  X,
  CirclePlus,
  AlertTriangle,
  Loader2,
  Pencil,
  Edit,
} from "lucide-react";
import Table from "../../../components/table/Table";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
import ActionButton from "../../../components/table/ActionButton";
import NoData from "../../../components/table/noData";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import StatusCard from "../../../components/ui/StatusCard";
import Dropdown from "../../../components/ui/Dropdown";
import {
  useGetQuotationQuery,
  useDeleteQuotationMutation,
} from "../../../api/featutres/quotationFeatures/quotationApi";
import { useDebounce, setToastMessage } from "../../../helper/helper";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../router/routes";
import Modal from "../../../components/ui/Modal";
import { CURRENT_YEAR, MONTHS, YEARS } from "../../../utils/constants";
import PrintViewModal from "../../../components/ui/PrintViewModal";
import CircleLoader from "../../../components/ui/CircleLoader";
import TablePagination from "../../../components/table/BottomPagination";
import YearDropdown from "../../../components/ui/YearDropdown";

const headerItems = [
  { label: "No", className: "text-center" },
  { label: "Quotation No" },
  { label: "Customer" },
  { label: "Phone" },
  { label: "GST (%)", className: "text-center" },
  { label: "Total", className: "text-right" },
  { label: "Action", className: "text-center" },
] as any;

export default function QuotationHistory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confrim, setConfrim] = useState(false);

  const debouncedSearch = useDebounce(search, 600);

  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
    year: String(CURRENT_YEAR),
    month: undefined as number | undefined,
  });

  useEffect(() => {
    setFilter((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const { data, isLoading } = useGetQuotationQuery(filter);
  const [deleteQuotation, { isLoading: isDeleteLoading }] =
    useDeleteQuotationMutation();

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteQuotation(deleteId).unwrap();
      if (res?.success) {
        setToastMessage("success", "Quotation deleted successfully");
      }
      setConfrim(false);
    } catch (error: any) {
      if (error?.status === 401) {
        return;
      }
      setToastMessage(
        "error",
        error?.data?.message || "Failed to delete quotation",
      );
      setConfrim(false);
    } finally {
      setDeleteId(null);
      setConfrim(false);
    }
  };

  return (
    <div className="section-body gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <h2 className="quotation-history-title">Quotation History</h2>
          </div>
          <StatusCard
            status={`${data?.pagination.total} Quotations`}
            color="blue"
            isShow
          />
        </div>
      </div>

      {/* Filters */}
      <div className="quotation-history-filters">
        <YearDropdown
          value={filter.year}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, year: e.target.value }))
          }
        />
        <Dropdown
          placeholder="All Months"
          options={MONTHS}
          // value={month}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              month: MONTHS.indexOf(e.target.value) + 1 || undefined,
            }))
          }
        />
        <Input
          placeholder="Search by quotation no, patient..."
          icon={<Search size={16} className="text-txt2" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="primary"
          type="button"
          className="w-full sm-w-auto"
          onClick={() => navigate(ROUTES.QUOTATION.NEW_QUOTATION)}
        >
          <CirclePlus size={20} />
          Add New Quotation
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <CircleLoader />
        ) : (
          <Table>
            <TableHeader headerItems={headerItems} />
            <tbody>
              {data?.quotations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="border-none">
                    <NoData
                      message="No quotations found. Create your first quotation to see it here."
                      className="border-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data?.quotations?.map((item: any, index: number) => {
                  return (
                    <TableRow key={item.id || index}>
                      <TableCell className="text-center">
                        <span className="font-semibold text-txt2">
                          {(data?.pagination?.page - 1) * filter.limit +
                            index +
                            1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-bold text-xs">
                          {item.quotation_no ||
                            item.invoice_no ||
                            `QUO-${String(item.id).padStart(4, "0")}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt1 font-bold">
                          {item.customer_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt3 text-xs">
                          {item.phone_no || item.phone_number || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-txt1 font-semibold">
                          {item.gst || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-txt1 font-bold">
                          ₹{item.total_amount.toLocaleString("en-IN")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ActionButton
                            icon={Eye}
                            color="primary"
                            onClick={() => setViewId(item.id)}
                          />
                          <ActionButton
                            icon={Edit}
                            color="primary"
                            onClick={() => {
                              navigate(
                                ROUTES.QUOTATION.EDIT_QUOTATION.replace(
                                  ":id",
                                  String(item?.id),
                                ),
                              );
                            }}
                          />
                          <ActionButton
                            icon={Trash2}
                            color="red"
                            onClick={() => {
                              setConfrim(true);
                              setDeleteId(item.id);
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </div>
      {data?.pagination.totalPages > 1 && (
        <TablePagination
          total={data?.pagination.total}
          page={data?.pagination.page}
          totalPages={data?.pagination.totalPages}
          onPageChange={(page) => setFilter({ ...filter, page })}
        />
      )}
      {viewId && (
        <PrintViewModal
          isOpen={true}
          onClose={() => setViewId(null)}
          id={viewId}
          type="quotation"
        />
      )}

      <Modal
        open={confrim}
        title="Delete Confirmation"
        message="Are you sure you want to delete this quotation? This action cannot
              be undone."
        onClose={() => setConfrim(false)}
        buttons={
          <>
            <Button
              onClick={() => setConfrim(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              loading={isDeleteLoading}
              disabled={isDeleteLoading}
              onClick={handleConfirmDelete}
            >
              Confirm
            </Button>
          </>
        }
      />
    </div>
  );
}
