import React from "react";

interface TableProps {
  children: React.ReactNode;
  minClassName?: string;
}

const Table: React.FC<TableProps> = ({
  children,
  minClassName = "table-min-sm",
}) => {
  return (
    <div className="table-wrap backdrop-hidden">
      <table className={`table text-xs ${minClassName}`}>{children}</table>
    </div>
  );
};

export default Table;
