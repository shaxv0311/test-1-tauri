interface TableRowProps {
  children: React.ReactNode;
}

const TableRow = ({ children }: TableRowProps) => {
  return <tr className="table-row">{children}</tr>;
};

export default TableRow;
