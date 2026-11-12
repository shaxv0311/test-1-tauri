import { useEffect, useState } from "react";
import {
    CheckCircle2,
    CirclePlus,
    Eye,
    ListOrdered,
    Pencil,
    Printer,
    Search,
    Trash2,
} from "lucide-react";

import Table from "../../../../components/table/Table";
import TableHeader from "../../../../components/table/TableHeader";
import TableRow from "../../../../components/table/TableRow";
import TableCell from "../../../../components/table/TableCell";
import ActionButton from "../../../../components/table/ActionButton";
import NoData from "../../../../components/table/noData";
import TablePagination from "../../../../components/table/BottomPagination";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Dropdown from "../../../../components/ui/Dropdown";
import StatusCard from "../../../../components/ui/StatusCard";
import CircleLoader from "../../../../components/ui/CircleLoader";
import Modal from "../../../../components/ui/Modal";
import { useDebounce, setToastMessage } from "../../../../helper/helper";
import { formatDateDMY } from "../../../../helper/date";
import { useCalculateAction } from "../../../../hooks/useCalculateAction";
import {
    useDeleteDeliveryOrderMutation,
    useGetDeliveryOrdersQuery,
    useUpdateDeliveryOrderStatusMutation,
    type DeliveryOrderStatus,
} from "../../../../api/featutres/orderFeatures/deliveryOrderApi";
import DeliveryOrderFormModal from "../../components/DeliveryOrderFormModal";
import DeliveryOrderDetailModal from "../../components/DeliveryOrderDetailModal";
import PrintViewModal from "../../../../components/ui/PrintViewModal";

const headerItems = [
    { label: "No", className: "text-center" },
    { label: "Customer" },
    { label: "Order Date" },
    { label: "Delivery Charge", className: "text-right" },
    { label: "Status", className: "text-center" },
    { label: "Action", className: "text-center" },
] as any;

const STATUS_OPTIONS = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Delivered", value: "delivered" },
];

type ConfirmAction = { type: "delete" | "deliver"; id: number } | null;

export default function OrderDeleveryPage() {
    const calc = useCalculateAction();
    const [search, setSearch] = useState("");
    const [viewId, setViewId] = useState<number | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [printId, setPrintId] = useState<number | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

    const debouncedSearch = useDebounce(search, 600);

    const [filter, setFilter] = useState<{
        page: number;
        limit: number;
        search: string;
        status?: DeliveryOrderStatus;
    }>({
        page: 1,
        limit: 10,
        search: "",
    });

    useEffect(() => {
        setFilter((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }, [debouncedSearch]);

    const { data, isLoading } = useGetDeliveryOrdersQuery(filter);
    const orders = data?.orders ?? [];

    const [deleteDeliveryOrder, { isLoading: isDeleting }] =
        useDeleteDeliveryOrderMutation();
    const [updateStatus, { isLoading: isUpdatingStatus }] =
        useUpdateDeliveryOrderStatusMutation();

    const isConfirmLoading = isDeleting || isUpdatingStatus;

    const handleConfirm = async () => {
        if (!confirmAction) return;

        try {
            const res: any =
                confirmAction.type === "delete"
                    ? await deleteDeliveryOrder(confirmAction.id).unwrap()
                    : await updateStatus({
                        id: confirmAction.id,
                        orderStatus: "delivered",
                    }).unwrap();

            if (res?.success) {
                setToastMessage("success", res?.message || "Done");
            }
        } catch (error: any) {
            // A 401 is already handled globally (toast + redirect to login).
            if (error?.status === 401) return;
            setToastMessage(
                "error",
                error?.data?.message || "Something went wrong",
            );
        } finally {
            setConfirmAction(null);
        }
    };

    return (
        <div className="section-body gap-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <ListOrdered size={20} className="text-primary" />
                        <h2 className="orders-title">Delivery Orders</h2>
                    </div>
                    <StatusCard
                        status={`${data?.pagination?.total ?? 0} Orders`}
                        color="blue"
                        isShow
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="orders-filters">
                <Input
                    placeholder="Search by customer name..."
                    icon={<Search size={16} className="text-txt2" />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Dropdown
                    placeholder="All Status"
                    options={STATUS_OPTIONS}
                    value={filter.status ?? ""}
                    onChange={(e) =>
                        setFilter((prev) => ({
                            ...prev,
                            status: (e.target.value || undefined) as
                                | DeliveryOrderStatus
                                | undefined,
                            page: 1,
                        }))
                    }
                />
                <Button
                    variant="primary"
                    type="button"
                    className="w-full sm-w-auto"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <CirclePlus size={20} />
                    Add Delivery Order
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
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="border-none">
                                        <NoData
                                            message="No delivery orders found. Create your first delivery order to see it here."
                                            className="border-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((item: any, index: number) => {
                                    const isDelivered = item.orderStatus === "delivered";
                                    return (
                                        <TableRow key={item.id ?? index}>
                                            <TableCell className="text-center">
                                                <span className="font-semibold text-txt2">
                                                    {(data?.pagination?.page - 1) * filter.limit +
                                                        index +
                                                        1}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-txt1 font-bold text-xs">
                                                    {item.patient_name || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-txt3 text-xs">
                                                    {item.orderDate ? formatDateDMY(item.orderDate) : "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-txt1 font-semibold text-xs">
                                                    {calc.formatCurrency(calc.toNumber(item.delivery_charge))}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <StatusCard
                                                    status={item.orderStatus}
                                                    color={isDelivered ? "green" : "orange"}
                                                    isShow
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!isDelivered && (
                                                        <ActionButton
                                                            icon={CheckCircle2}
                                                            color="green"
                                                            onClick={() =>
                                                                setConfirmAction({
                                                                    type: "deliver",
                                                                    id: item.id,
                                                                })
                                                            }
                                                        />
                                                    )}
                                                    <ActionButton
                                                        icon={Eye}
                                                        color="primary"
                                                        onClick={() => setViewId(item.id)}
                                                    />
                                                    {!isDelivered && <ActionButton
                                                        icon={Pencil}
                                                        color="blue"
                                                        onClick={() => setEditId(item.id)}
                                                    />}


                                                    <ActionButton
                                                        icon={Printer}
                                                        color="primary"
                                                        onClick={() => setPrintId(item.id)}
                                                    />
                                                    {!isDelivered && (
                                                        <ActionButton
                                                            icon={Trash2}
                                                            color="red"
                                                            onClick={() =>
                                                                setConfirmAction({
                                                                    type: "delete",
                                                                    id: item.id,
                                                                })
                                                            }
                                                        />
                                                    )}
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

            {data?.pagination?.totalPages > 1 && (
                <TablePagination
                    total={data.pagination.total}
                    page={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    loading={isLoading}
                    onPageChange={(page) => setFilter((prev) => ({ ...prev, page }))}
                />
            )}

            {/* Create / Edit */}
            {(isCreateOpen || editId) && (
                <DeliveryOrderFormModal
                    isOpen={isCreateOpen || Boolean(editId)}
                    orderId={editId}
                    onClose={() => {
                        setIsCreateOpen(false);
                        setEditId(null);
                    }}
                />
            )}

            {/* Detail */}
            {viewId && (
                <DeliveryOrderDetailModal id={viewId} onClose={() => setViewId(null)} />
            )}

            {/* Invoice / Bill preview & print */}
            {printId && (
                <PrintViewModal
                    onClose={() => setPrintId(null)}
                    isOpen={Boolean(printId)}
                    id={printId}
                    type="delivery"
                />
            )}

            {/* Delete / Deliver confirmation */}
            <Modal
                open={Boolean(confirmAction)}
                title={
                    confirmAction?.type === "delete"
                        ? "Delete Confirmation"
                        : "Mark as Delivered"
                }
                message={
                    confirmAction?.type === "delete"
                        ? "Are you sure you want to delete this delivery order? This action cannot be undone."
                        : "Mark this delivery order as delivered? The ordered quantity will be deducted from stock and this cannot be undone."
                }
                onClose={() => setConfirmAction(null)}
                buttons={
                    <>
                        <Button
                            onClick={() => setConfirmAction(null)}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            variant={confirmAction?.type === "delete" ? "danger" : "success"}
                            loading={isConfirmLoading}
                            disabled={isConfirmLoading}
                            onClick={handleConfirm}
                        >
                            Confirm
                        </Button>
                    </>
                }
            />
        </div>
    );
}