'use client';

import React, { useState, useMemo } from 'react';
import {
    useGetBuAlerts,
    useDeleteBuAlerts
} from '@/lib/api/endpoints/business-units-security/business-units-alerts'; 
import { BuAlerts } from '@/lib/api/types'; 
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
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
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'; // Or use Popover

export default function BuAlertsPage() {
  const {
      data: buAlertsData,
      isLoading,
      error,
      refetch
  } = useGetBuAlerts(); 
  const deleteBuAlertsMutation = useDeleteBuAlerts();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteBuAlertsMutation.mutateAsync(id);
      refetch();
      toast.success('BU Alert record deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete BU Alert record:', err);
      toast.error('Failed to delete BU Alert record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    try {
      await Promise.all(selectedIds.map(id => deleteBuAlertsMutation.mutateAsync(id)));
      refetch();
      toast.success(`Successfully deleted ${selectedIds.length} record(s)`);
      setRowSelection({});
    } catch (err) {
      console.error('Failed to bulk delete records:', err);
      toast.error('Failed to delete selected records');
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

  // Helper component for displaying count and comment
  const CountCommentCell = ({ count, comment }: { count?: number; comment?: string }) => {
    if (count === undefined || count === null) {
        return <span className="text-muted-foreground">N/A</span>;
    }
    if (!comment) {
      return <span>{count}</span>;
    }
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="underline decoration-dotted cursor-help">{count}</span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 text-sm">
          <p>{comment}</p>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const tableStyle = useTableStyle<BuAlerts>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['bu', 'month', 'year', 'createdAt', 'updatedAt'], 
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<BuAlerts>[]>(() => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
      tableStyle.getDefaultColumn('bu', 'Business Unit', { isSortable: true, cellClassName: 'font-medium' }),
      // Severity Columns with Comments
      {
        accessorKey: 'critical', 
        header: 'Critical',
        cell: ({ row }) => (
            <CountCommentCell count={row.original.critical?.count} comment={row.original.critical?.criticalComment} />
        ),
        enableSorting: true, // Enable sorting by count
        sortingFn: (rowA, rowB, columnId) => {
            const countA = rowA.original.critical?.count ?? -1;
            const countB = rowB.original.critical?.count ?? -1;
            return countA - countB;
        }
      },
      {
        accessorKey: 'high', 
        header: 'High',
        cell: ({ row }) => (
            <CountCommentCell count={row.original.high?.count} comment={row.original.high?.highComment} />
        ),
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
            const countA = rowA.original.high?.count ?? -1;
            const countB = rowB.original.high?.count ?? -1;
            return countA - countB;
        }
      },
      {
        accessorKey: 'medium', 
        header: 'Medium',
        cell: ({ row }) => (
            <CountCommentCell count={row.original.medium?.count} comment={row.original.medium?.mediumComment} />
        ),
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
            const countA = rowA.original.medium?.count ?? -1;
            const countB = rowB.original.medium?.count ?? -1;
            return countA - countB;
        }
      },
      {
        accessorKey: 'low', 
        header: 'Low',
        cell: ({ row }) => (
            <CountCommentCell count={row.original.low?.count} comment={row.original.low?.lowComment} />
        ),
        enableSorting: true,
        sortingFn: (rowA, rowB, columnId) => {
            const countA = rowA.original.low?.count ?? -1;
            const countB = rowB.original.low?.count ?? -1;
            return countA - countB;
        }
      },
      // Timestamps
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      // Actions
      tableStyle.getActionColumn((record: BuAlerts) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
             {/* TODO: Update link when edit page exists */}
            <Link href={`/dashboard/business-units-security/business-units-alerts/${record._id}/edit`}>
               <Pencil className="h-4 w-4" aria-label="Edit record" />
            </Link>
          </Button>
           <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: Array.isArray(buAlertsData) ? buAlertsData : [],
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
    console.error("Error loading BU Alerts data:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }

  // Main content
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Business Unit Alerts Records</h1>
           {/* Add Filters here if needed */}
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/business-units-security/business-units-alerts/new">
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
