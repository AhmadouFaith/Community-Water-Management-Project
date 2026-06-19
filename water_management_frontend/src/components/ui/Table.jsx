/**
 * Table — a responsive data table using .table-header and .table-row CSS utilities.
 * Props:
 *   columns  — array of { key, label, render? }
 *   data     — array of row objects
 *   keyField — field used as React key (default: 'id')
 */
export default function Table({ columns = [], data = [], keyField = 'id' }) {
    return (
        <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 dark:border-white/5">
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="table-header text-left whitespace-nowrap"
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row[keyField]} className="table-row">
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className="py-3.5 px-6 text-slate-700 dark:text-slate-300 whitespace-nowrap"
                                >
                                    {col.render
                                        ? col.render(row[col.key], row)
                                        : row[col.key] ?? '—'}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="py-12 text-center text-sm text-slate-400 font-medium"
                            >
                                No records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
