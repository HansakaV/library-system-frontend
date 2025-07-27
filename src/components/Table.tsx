import React from 'react';

interface TableProps<T> {
    data: T[];
    columns: { key: keyof T | 'actions'; header: string; render?: (item: T) => React.ReactNode }[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
}

const Table = <T extends { id: string }>({ data, columns, onEdit, onDelete }: TableProps<T>) => {
    const renderCell = (item: T, col: { key: keyof T | 'actions'; header: string; render?: (item: T) => React.ReactNode }) => {
        if (col.render) {
            return col.render(item);
        }

        if (col.key === 'actions') {
            return (
                <div className="flex space-x-2">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(item)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                            Delete
                        </button>
                    )}
                </div>
            );
        }

        const value = item[col.key as keyof T];
        return value != null ? String(value) : '';
    };

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    {columns.map((col) => (
                        <th
                            key={String(col.key)}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                            {col.header}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item) => (
                    <tr key={item.id}>
                        {columns.map((col) => (
                            <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {renderCell(item, col)}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;