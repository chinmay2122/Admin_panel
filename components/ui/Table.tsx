import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export function Table({
  children,
  className = "",
  containerClassName = "",
  ...props
}: TableProps) {
  return (
    <div className={`w-full border border-[#E8E8E3] rounded-lg bg-white ${containerClassName || "overflow-x-auto"}`}>
      <table className={`w-full border-collapse text-left ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-[#FAFAF8] border-b border-[#E8E8E3] text-[#6E6E69] text-xs uppercase tracking-wider font-medium ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={`divide-y divide-[#E8E8E3] bg-white text-sm text-[#141413] ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = "",
  onClick,
  onKeyDown,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  const isClickable = Boolean(onClick);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (onKeyDown) onKeyDown(e);
    if (isClickable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick?.(e as unknown as React.MouseEvent<HTMLTableRowElement>);
    }
  };

  return (
    <tr
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      className={`transition-colors duration-150 ${
        isClickable
          ? "cursor-pointer hover:bg-[#F7F7F4] focus-visible:outline-none focus-visible:bg-[#F5F5F0]"
          : "hover:bg-[#FAFAF8]"
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-[#6E6E69] uppercase tracking-wider select-none ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`px-4 py-3.5 text-xs md:text-sm text-[#141413] align-middle ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
