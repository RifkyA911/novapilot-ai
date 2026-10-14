export interface ColumnDef<T> {
	id: string;
	header: string;
	accessorKey?: keyof T | ((row: T) => any);
	sortable?: boolean;
	class?: string;
	align?: "left" | "center" | "right";
	exportValue?: (row: T) => string;
}
