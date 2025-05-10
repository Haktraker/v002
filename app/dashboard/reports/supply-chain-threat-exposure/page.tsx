'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  RowSelectionState,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useGetSupplyChainThreatExposures, 
  useDeleteSupplyChainThreatExposure,
} from '@/lib/api/endpoints/reports/supply-chain-threat-exposure';
import { 
    SupplyChainThreatExposure, 
    SeverityLevel, 
} from '@/lib/api/reports-types/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';

const SEVERITY_LEVELS: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

const SupplyChainThreatExposurePage = () => {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<SupplyChainThreatExposure | null>(null);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { selectedMonth, selectedYear } = useGlobalFilter();

  const queryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  const { data: apiResponse, isLoading, error, refetch } = useGetSupplyChainThreatExposures(queryParams);
  const deleteMutation = useDeleteSupplyChainThreatExposure();

  const records = apiResponse?.data || [];

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Record deleted successfully');
      refetch();
      setRowSelection({});
    } catch (err) {
      toast.error('Failed to delete record.');
      console.error(err);
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]).map(id => table.getRow(id).original._id);
    if (selectedIds.length === 0) {
      toast.info("No records selected for deletion.");
      setBulkDeleteDialogOpen(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await deleteMutation.mutateAsync(id);
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`Failed to delete record ${id}:`, err);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} record(s).`);
      refetch();
    }
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} record(s).`);
    }
    
    setRowSelection({});
    setBulkDeleteDialogOpen(false);
  };
  
  const openDeleteDialog = (record: SupplyChainThreatExposure) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<SupplyChainThreatExposure>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
      accessorKey: "chain",
      header: "Chain/Asset",
      cell: ({ row }) => <div className="font-medium">{row.getValue("chain")}</div>,
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const severity = row.getValue("severity") as SeverityLevel;
        return <div>{severity.charAt(0).toUpperCase() + severity.slice(1)}</div>;
      },
    },
    {
      accessorKey: "month",
      header: "Month",
      cell: ({ row }) => <div>{row.getValue("month") || 'N/A'}</div>,
    },
    {
      accessorKey: "year",
      header: "Year",
      cell: ({ row }) => <div>{row.getValue("year") || 'N/A'}</div>,
    },
    {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="text-right space-x-2">
              <Link href={`/dashboard/reports/supply-chain-threat-exposure/${record._id}/edit`}>
                <Button variant="ghost" size="icon" title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" title="Delete" onClick={() => openDeleteDialog(record)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
      },
  ], []);

  const table = useReactTable({
    data: records,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading data: {error.message || 'Unknown error'}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle>Supply Chain Threat Exposure</CardTitle>
                    <CardDescription>Manage and track supply chain threat exposure records.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <Input
                        placeholder="Filter by Chain/Asset..."
                        value={(table.getColumn("chain")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                           table.getColumn("chain")?.setFilterValue(event.target.value)
                        }
                        className="max-w-full sm:max-w-xs h-9"
                    />
                    <Link href="/dashboard/reports/supply-chain-threat-exposure/new" className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {Object.keys(rowSelection).length > 0 && (
                    <div className="mb-4 flex items-center gap-2">
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setBulkDeleteDialogOpen(true)}
                        >
                            Delete Selected ({Object.keys(rowSelection).length})
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setRowSelection({})}
                        >
                            Clear Selection
                        </Button>
                    </div>
                )}
                {records.length === 0 && !isLoading ? (
                    <div className="text-center text-muted-foreground py-8">No records found.</div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}  className={header.id === 'actions' ? 'text-right' : ''}>
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
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'text-right' : ''}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                    </TableRow>
                                ))
                                ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {/* Pagination Controls */}
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
            </CardContent>
        </Card>

        {/* Delete Confirmation Dialog (Single) */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div>Are you sure you want to delete the record for "{recordToDelete?.chain}" with severity "{recordToDelete?.severity}"? This action cannot be undone.</div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={() => recordToDelete && handleDelete(recordToDelete._id)} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

         {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Bulk Deletion</DialogTitle>
                </DialogHeader>
                <div>Are you sure you want to delete {Object.keys(rowSelection).length} selected record(s)? This action cannot be undone.</div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleBulkDelete} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
};

export default SupplyChainThreatExposurePage;
