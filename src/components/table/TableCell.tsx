interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

const TableCell = ({
  children,
  className = "",
  colSpan,
}: TableCellProps) => {
  return (
    <td colSpan={colSpan} className={`table-cell ${className}`}>
      {children}
    </td>
  );
};

export default TableCell;
