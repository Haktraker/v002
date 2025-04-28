'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import {
  useGetRiskScoreDistributions,
  useDeleteRiskScoreDistribution
} from '@/lib/api/endpoints/user-behavior-analytics/user-risk-score-distributions';
import { RiskScoreDistribution } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Pencil, Home } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
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
import { useTableStyle } from '@/hooks/use-table-style';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function UserRiskScoreDistributionsPage() {
  // Fetch all data
  const {
    data: paginatedResponse, // Use appropriate variable name
    isLoading,
    error,
    refetch
  } = useGetRiskScoreDistributions();

  const deleteDistribution = useDeleteRiskScoreDistribution();

  const [isDeleting, setIsDeleting] = useState(false);
  // Default sort by year then month
  const [sorting, setSorting] = useState<SortingState>([{ id: 'year', desc: true }, { id: 'month', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const tableData = useMemo(() => {
    return paginatedResponse?.data ?? []; // Extract data array from paginated response
  }, [paginatedResponse]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDistribution.mutateAsync(id);
      refetch();
      // Success toast is handled by the hook
      setRowSelection(prev => {
          const { [id]: _, ...rest } = prev;
          return rest;
      });
    } catch (error) {
      // Error toast is handled by the hook
      console.error('Failed to delete distribution record:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRecordIds = Object.keys(rowSelection);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const id of selectedRecordIds) {
        try {
          await deleteDistribution.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete distribution record ${id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        // Hook handles individual success toasts, maybe a summary here?
        toast.info(`Attempted to delete ${selectedRecordIds.length} records. ${successCount} succeeded, ${errorCount} failed.`);
        refetch();
      } else {
        toast.error('Failed to delete any selected records. See console for details.');
      }
    } catch (error) {
      console.error('Bulk deletion process failed:', error);
      toast.error('Bulk deletion process failed');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
      setRowSelection({});
    }
  };

  const tableStyle = useTableStyle<RiskScoreDistribution>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: [
      'year', 'month', 'low', 'medium', 'high', 'critical'
    ],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<RiskScoreDistribution>[]>(() => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true, cellClassName: 'w-24' }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'w-32' }),
      tableStyle.getDefaultColumn('low', 'Low Count', { isSortable: true, cellClassName: 'text-right' }),
      tableStyle.getDefaultColumn('medium', 'Medium Count', { isSortable: true, cellClassName: 'text-right' }),
      tableStyle.getDefaultColumn('high', 'High Count', { isSortable: true, cellClassName: 'text-right' }),
      tableStyle.getDefaultColumn('critical', 'Critical Count', { isSortable: true, cellClassName: 'text-right' }),
      tableStyle.getActionColumn((record: RiskScoreDistribution) => (
        <>
          {/* TODO: Implement Edit Page */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            // asChild // Use Link directly for now
            disabled // Disable until edit page exists
          >
             {/* TODO: Update href when edit page is created */}
            {/* <Link href={`/dashboard/user-behavior-analytics/user-risk-score-distributions/${record._id}/edit`}>  */}
              <Pencil className="h-4 w-4" aria-label="Edit record (disabled)"/>
            {/* </Link> */}
          </Button>
          <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ], [isDeleting, tableStyle]
  );

  const table = useReactTable({
    data: tableData,
    columns: columns,
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
      pagination: { // Controlled pagination from API response
        pageIndex: paginatedResponse?.page ? paginatedResponse.page - 1 : 0,
        pageSize: paginatedResponse?.limit ?? 10,
      },
    },
    manualPagination: true, // Data is paginated by the API
    pageCount: paginatedResponse?.totalPages ?? -1, // Use totalPages from API
    initialState: {
        // Sorting is handled by state variable with default
    },
    getRowId: (row) => row._id,
  });

  // Handle pagination changes
  const currentPage = table.getState().pagination.pageIndex + 1;
  const currentLimit = table.getState().pagination.pageSize;
  React.useEffect(() => {
    // Refetch when pageIndex or pageSize changes, comparing with API response values
    if ((paginatedResponse?.page !== currentPage || paginatedResponse?.limit !== currentLimit) && !isLoading) {
        refetch(); // This implicitly uses the params from the initial useGet hook call
                  // If you needed different params for pagination, you'd manage them in state
                  // and pass them to useGetRiskScoreDistributions
    }
  }, [currentPage, currentLimit, paginatedResponse, isLoading, refetch]);


  if (isLoading && !paginatedResponse) { // Show skeleton only on initial load
    return (
      <PageContainer>
         {/* Breadcrumb Skeleton? Or omit during loading */}
        <PageHeader title="User Risk Score Distributions" />
        <div className="flex items-center justify-between my-6">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-md" />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="User Risk Score Distributions" />
        <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md mt-6">
          Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/user-behavior-analytics">
                    User Behavior Analytics
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/user-behavior-analytics/user-risk-score-distributions" className="font-semibold">
                User Risk Score Distributions
                </BreadcrumbLink>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

      <PageHeader title="User Risk Score Distributions" />

      <div className="flex items-center justify-between my-6">
        <h2 className="text-xl font-semibold">Risk Distribution Records</h2>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
          <Link href="/dashboard/user-behavior-analytics/user-risk-score-distributions/new">
            <Button>Add New Distribution</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      <div className="mt-4">
        {tableStyle.Pagination({ table })} {/* Use the hook's pagination */} 
      </div>
    </PageContainer>
  );
}
