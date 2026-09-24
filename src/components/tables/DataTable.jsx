import EmptyState from "../common/EmptyState";

/**
 * Generic data table.
 * columns: [{ key, label, render?, align? }]
 * rows: array of row objects
 */
export default function DataTable({
  columns,
  rows,
  rowKey,
  emptyIcon,
  emptyTitle = "No records found",
  emptyDescription,
}) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={column.align ? { textAlign: column.align } : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey ? rowKey(row) : row.id ?? index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.primary ? "cell-primary" : undefined}
                  style={column.align ? { textAlign: column.align } : undefined}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
