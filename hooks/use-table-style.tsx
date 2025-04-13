import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { flexRender } from '@tanstack/react-table';

interface TableStyleOptions<TData> {
  enableSelection?: boolean;
  enableSorting?: boolean;
  sortableColumns?: (keyof TData)[];
  onDelete?: (id: string) => Promise<void>;
  onBulkDelete?: () => Promise<void>;
  isDeleting?: boolean;
  showBulkDeleteDialog?: boolean;
  setShowBulkDeleteDialog?: (show: boolean) => void;
}

export function useTableStyle<TData>({ 
  enableSelection = false, 
  enableSorting = true,
  sortableColumns = [],
  onDelete,
  onBulkDelete,
  isDeleting = false,
  showBulkDeleteDialog = false,
  setShowBulkDeleteDialog,
}: TableStyleOptions<TData>) {
  const getHeaderContent = (
    column: any,
    label: string,
    isSortable: boolean = true
  ) => {
    if (!enableSorting || !isSortable) {
      return label;
    }

    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="hover:bg-transparent"
      >
        {label}
        {column.getIsSorted() === "asc" ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "desc" ? (
          <ChevronDown className="ml-2 h-4 w-4" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    );
  };

  const getSelectionColumn = (): ColumnDef<TData> => ({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  });

  const getActionColumn = (
    actions: (row: TData) => React.ReactNode
  ): ColumnDef<TData> => ({
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        {actions(row.original)}
      </div>
    ),
  });

  const getDefaultColumn = (
    key: keyof TData,
    label: string,
    options: {
      isSortable?: boolean;
      className?: string;
      cellClassName?: string;
      formatter?: (value: any) => React.ReactNode;
    } = {}
  ): ColumnDef<TData> => {
    const {
      isSortable = sortableColumns.includes(key),
      className = '',
      cellClassName = '',
      formatter,
    } = options;

    return {
      accessorKey: key as string,
      header: ({ column }) => (
        <div className={className}>
          {getHeaderContent(column, label, isSortable)}
        </div>
      ),
      cell: ({ row }) => (
        <div className={cellClassName}>
          {formatter
            ? formatter(row.getValue(key as string))
            : row.getValue(key as string)}
        </div>
      ),
      enableSorting: enableSorting && isSortable,
    };
  };

  const DeleteDialog = ({ id }: { id: string }) => {
    if (!onDelete) return null;

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const BulkDeleteDialog = () => {
    if (!onBulkDelete || !setShowBulkDeleteDialog) return null;

    return (
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all selected items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const renderTable = (table: any) => {
    return (
      <div className="border rounded-md">
        <Table className="w-full">
          <TableHeader className="bg-muted/50 dark:bg-background/5">
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 dark:hover:bg-background/5"
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const Pagination = ({ table }: { table: any }) => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
    </div>
  );

  return {
    getHeaderContent,
    getSelectionColumn,
    getActionColumn,
    getDefaultColumn,
    DeleteDialog,
    BulkDeleteDialog,
    renderTable,
    Pagination,
  };
}