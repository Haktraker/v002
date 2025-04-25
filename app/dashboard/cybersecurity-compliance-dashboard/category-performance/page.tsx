'use client';

import React, { useState, useMemo } from 'react';
import { 
    useGetControlCategoryPerformances, 
    useDeleteControlCategoryPerformance 
} from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/control-category-performance';
import { ControlCategoryPerformance, ControlCategoryName } from '@/lib/api/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from "@/components/ui/input"; // Keep for potential future filters
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { BU_LIST } from '@/lib/constants/bu-list';
import { MONTHS } from '@/lib/constants/months-list';

// Define control category names locally for column generation
const CONTROL_CATEGORY_NAMES: ControlCategoryName[] = [
  "Access Control",
  "Data Protection",
  "Network Security",
  "Asset Management",
  "Incident Response",
  "Business Continuity"
];

export default function CategoryPerformancePage() {
  // Fetch data - Add query params if filtering needed via API
  const { 
      data: performanceData, 
      isLoading, 
      error, 
      refetch 
  } = useGetControlCategoryPerformances(); 
  const deletePerformanceMutation = useDeleteControlCategoryPerformance();
  
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

  const tableStyle = useTableStyle<ControlCategoryPerformance>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete, // Pass handlers if useTableStyle uses them
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<ControlCategoryPerformance>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'font-medium' }),
      {
        id: 'buName', 
        header: 'Business Unit',
        accessorFn: (row) => row.bu?.[0]?.bu_name || 'N/A', 
        cell: info => info.getValue(),
        enableSorting: false,
        enableColumnFilter: true,
      },
      // Dynamically create columns for each control category score
      ...CONTROL_CATEGORY_NAMES.map((categoryName) => ({
        id: categoryName.replace(/\s+/g, ''), // Create a unique ID (e.g., AccessControl)
        header: categoryName,
        accessorFn: (row: ControlCategoryPerformance) => 
          row.bu?.[0]?.categories.find(c => c.category === categoryName)?.score,
        cell: (info: any) => info.getValue()?.toFixed(1) ?? 'N/A', // Display score rounded
        enableSorting: false, // Typically scores aren't sorted this way
      })),
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getActionColumn((record: ControlCategoryPerformance) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
            {/* Adjust link when edit page exists */}
            <Link href={`/dashboard/cybersecurity-compliance-dashboard/category-performance/${record._id}/edit`}>
               <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          {/* Use the delete dialog from useTableStyle */}
          <tableStyle.DeleteDialog id={record._id} /> 
        </>
      )),
    ],
    [isDeleting, tableStyle] // Ensure tableStyle is a dependency
  );

  const table = useReactTable({
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
                <Skeleton className="h-8 w-48" /> 
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[400px] w-full" />
        </PageContainer>
    );
  }

  if (error) {
    console.error("Error loading category performance:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }
  
  const currentBuFilter = columnFilters.find(f => f.id === 'buName')?.value as string || '';
  const currentMonthFilter = columnFilters.find(f => f.id === 'month')?.value as string || '';

  // Main content
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Control Category Performance</h1>
        
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog /> // Use dialog from hook
          )}
          <Button asChild size="sm">
             {/* Adjust link when add page exists */}
            <Link href="/dashboard/cybersecurity-compliance-dashboard/category-performance/new">
              Add New Record
            </Link>
          </Button>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
    </PageContainer>
  );
}
