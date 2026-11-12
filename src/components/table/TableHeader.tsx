import React from "react";

interface HeaderItem {
  label: string;
  className?: string;
  sortKey?: string | null;
  sorted?: boolean;
  rounded?: boolean;
}

interface TableHeaderProps {
  headerItems: HeaderItem[];
}

const TableHeader: React.FC<TableHeaderProps> = ({ headerItems }) => {
  return (
    <thead>
      <tr>
        {headerItems.map((col, index) => {
          const rounded = col.rounded ?? true;
          const isFirst = index === 0;
          const isLast = index === headerItems.length - 1;
          return (
            <th
              key={index}
              className={[
                "table-head-cell",
                rounded && isFirst ? "table-head-cell-first" : "",
                rounded && isLast ? "table-head-cell-last" : "",
                col.className || "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {col.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default TableHeader;
