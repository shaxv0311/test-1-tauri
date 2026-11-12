import Button from "../ui/Button";

interface TablePaginationProps {
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

const TablePagination = ({
  total,
  page,
  totalPages,
  loading,
  onPageChange,
}: TablePaginationProps) => {
  return (
    <div className="pagination">
      <span className="pagination-info">
        {total} entries total
      </span>
      <div className="pagination-controls">
        <Button
          className="page-btn pagination-edge-btn"
          variant="others"
          disabled={page === 1 || loading}
          onClick={() => onPageChange(1)}
        >
          «
        </Button>
        <Button
          className="page-btn"
          variant="others"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
        >
          ‹ Prev
        </Button>
        <span className="pagination-page-label">
          {page} / {totalPages}
        </span>
        <Button
          className="page-btn"
          variant="others"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || loading}
        >
          Next ›
        </Button>
        <Button
          className="page-btn pagination-edge-btn"
          variant="others"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || loading}
        >
          »
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;
