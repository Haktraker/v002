'use client';

import { useState, useMemo } from 'react';
import { useGetGeoWatch, useDeleteGeoWatch } from '@/lib/api/endpoints/threat-intelligence';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, ChevronDown, ChevronsUpDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { GeoWatch } from '@/lib/api/types';
import Link from 'next/link';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function GeoWatchPage() {
  const { data: geoWatchData, isLoading, error, refetch } = useGetGeoWatch();
  const deleteGeoWatch = useDeleteGeoWatch();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteGeoWatch.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Failed to delete Geo Watch:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map(row => row.original._id);
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Process each Geo Watch deletion sequentially
      for (const id of selectedIds) {
        try {
          await deleteGeoWatch.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete Geo Watch ${id}:`, error);
          errorCount++;
        }
      }
      
      // Show a summary toast at the end
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} Geo Watch entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch();
      } else {
        toast.error('Failed to delete any Geo Watch entries');
      }
    } catch (error) {
      console.error('Bulk deletion failed:', error);
      toast.error('Bulk deletion process failed');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
      setRowSelection({});
    }
  };

  const handleUpdate = (geoWatch: GeoWatch) => {
    // Redirect to update page
    window.location.href = `/dashboard/threatintelligence/geo_watch/${geoWatch._id}/edit`;
  };

  // Helper function to format dates safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Define columns for the data table
  const columns = useMemo<ColumnDef<GeoWatch>[]>(
    () => [
      {
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
      },
      {
        accessorKey: "eventType",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Event Type
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue("eventType")}</div>,
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "country",
        header: "Country",
      },
      {
        accessorKey: "region",
        header: "Region",
      },
      {
        accessorKey: "severity",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Severity
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "time",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Detection Time
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          const time = row.getValue("time");
          if (!time) return 'N/A';
          try {
            // Format ISO string to readable date and time
            const date = new Date(time as string);
            return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          } catch (e) {
            return 'Invalid date';
          }
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const geoWatch = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleUpdate(geoWatch)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the Geo Watch event for {geoWatch.location}, {geoWatch.country}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(geoWatch._id)} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    [isDeleting]
  );

  const table = useReactTable({
    data: geoWatchData || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  if (error) {
    console.log(error);
    return <div>Error loading geo watch data</div>;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Geo Watch</h1>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {Object.keys(rowSelection).length} Geo Watch entries.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button asChild>
            <Link href="/dashboard/threatintelligence/geo_watch/new">Add New</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter by location..."
          value={(table.getColumn("location")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("location")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Input
          placeholder="Filter by country..."
          value={(table.getColumn("country")?.getFilterValue() as string) || ""}
          onChange={(event) =>
            table.getColumn("country")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No Geo Watch entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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
      </div>
    </PageContainer>
  );
}