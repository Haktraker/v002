'use client';

import React, { useState, useMemo } from 'react';
import {
    useGetBusinessUnitPerformances,
    useDeleteBusinessUnitPerformance
} from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/business-unit-performance'; // Use correct endpoint
import { BusinessUnitPerformance, ControlCategoryName } from '@/lib/api/types'; // Use correct type
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
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
} from "@tanstack/react-table";
// Remove unused Select components for now, can add back if filtering is implemented
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
// import { Input } from "@/components/ui/input"; // Keep for potential future filters
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
// Import constants
import { BU_LIST } from '@/lib/constants/bu-list';
import { MONTHS } from '@/lib/constants/months-list';
import { CATEGORY_LIST } from '@/lib/constants/category-list'; // Use the constant for categories

export default function BusinessUnitPerformancePage() {
  // Fetch data using the correct hook
  const {
      data: performanceData,
      isLoading,
      error,
      refetch
  } = useGetBusinessUnitPerformances(); // No query params needed for fetching all initially
  const deletePerformanceMutation = useDeleteBusinessUnitPerformance(); // Use correct delete hook

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deletePerformanceMutation.mutateAsync(id);
      refetch();
      toast.success('Performance record deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete performance record:', err);
      toast.error('Failed to delete performance record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    try {
      await Promise.all(selectedIds.map(id => deletePerformanceMutation.mutateAsync(id)));
      refetch();
      toast.success(`Successfully deleted ${selectedIds.length} performance record(s)`);
      setRowSelection({});
    } catch (err) {
      console.error('Failed to bulk delete performance records:', err);
      toast.error('Failed to delete selected performance records');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Configure useTableStyle for BusinessUnitPerformance
  const tableStyle = useTableStyle<BusinessUnitPerformance>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<BusinessUnitPerformance>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'font-medium' }),
      {
        id: 'buName',
        header: 'Business Unit',
        // Access bu_name from the first BU entry in the array for display purposes
        accessorFn: (row) => row.bu?.[0]?.bu_name || 'N/A',
        cell: info => info.getValue(),
        enableSorting: false, // Sorting complex objects can be tricky
        // Add filterFn if needed later: filterFn: (row, id, value) => value.includes(row.getValue(id)),
      },
      // Dynamically create columns for each category score using CATEGORY_LIST
      ...CATEGORY_LIST.map((categoryName) => ({
        id: categoryName.replace(/\s+/g, ''), // Create a unique ID (e.g., AccessControl)
        header: categoryName,
        // Access the score for this category from the first BU entry
        accessorFn: (row: BusinessUnitPerformance) =>
          row.bu?.[0]?.categories.find(c => c.category === categoryName)?.score,
        cell: (info: any) => info.getValue()?.toFixed(1) ?? <span className="text-muted-foreground">N/A</span>, // Display score or N/A
        enableSorting: false,
      })),
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getActionColumn((record: BusinessUnitPerformance) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
            {/* Update link when edit page exists */}
            <Link href={`/dashboard/cybersecurity-compliance-dashboard/business-unit-performance/${record._id}/edit`}>
               <Pencil className="h-4 w-4" aria-label="Edit record" />
            </Link>
          </Button>
          {/* Use the delete dialog from useTableStyle */}
           <tableStyle.DeleteDialog
             id={record._id}
           />
        </>
      )),
    ],
    [isDeleting, tableStyle] // Ensure tableStyle is a dependency
  );

  const table = useReactTable({
    // Ensure data is always an array, even if API potentially returns single object or null
    data: Array.isArray(performanceData) ? performanceData : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: {
        pagination: {
            pageSize: 10,
        }
    }
  });

  // Loading and Error states
  if (isLoading) {
    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-md" />
        </PageContainer>
    );
  }

  if (error) {
    console.error("Error loading Business Unit Performance:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }

  // Optional: Add filter values if implementing filtering later
  // const currentBuFilter = columnFilters.find(f => f.id === 'buName')?.value as string || '';
  // const currentMonthFilter = columnFilters.find(f => f.id === 'month')?.value as string || '';

  // Main content
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Header and Potential Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Business Unit Performance</h1>
           {/* Add Select filters here if needed later, similar to category-performance page */}
           {/* Example:
             <Select value={currentBuFilter} onValueChange={(value) => table.getColumn('buName')?.setFilterValue(value || undefined)}> ... </Select>
           */}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog /> // Remove itemDescription prop
          )}
          <Button asChild size="sm">
             {/* Update link when add page exists */}
            <Link href="/dashboard/cybersecurity-compliance-dashboard/business-unit-performance/new">
              Add New Record
            </Link>
          </Button>
        </div>
      </div>

      {/* Render Table and Pagination */}
      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
    </PageContainer>
  );
}
