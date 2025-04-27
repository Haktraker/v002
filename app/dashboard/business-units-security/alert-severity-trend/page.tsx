'use client';

import React, { useState, useMemo } from 'react';
import {
    useGetAlertSeverityTrends,
    useDeleteAlertSeverityTrend
} from '@/lib/api/endpoints/business-units-security/alert-severity-trend'; 
import { AlertSeverityTrend } from '@/lib/api/types'; 
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

export default function AlertSeverityTrendPage() {
  const {
      data: trendData,
      isLoading,
      error,
      refetch
  } = useGetAlertSeverityTrends(); 
  const deleteTrendMutation = useDeleteAlertSeverityTrend();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteTrendMutation.mutateAsync(id);
      refetch();
      toast.success('Alert Trend record deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete Alert Trend record:', err);
      toast.error('Failed to delete Alert Trend record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    try {
      await Promise.all(selectedIds.map(id => deleteTrendMutation.mutateAsync(id)));
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

  const tableStyle = useTableStyle<AlertSeverityTrend>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['bu', 'month', 'year', 'critical', 'high', 'medium', 'low', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<AlertSeverityTrend>[]>(() => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
      tableStyle.getDefaultColumn('bu', 'Business Unit', { isSortable: true, cellClassName: 'font-medium' }),
      tableStyle.getDefaultColumn('critical', 'Critical', { isSortable: true }),
      tableStyle.getDefaultColumn('high', 'High', { isSortable: true }),
      tableStyle.getDefaultColumn('medium', 'Medium', { isSortable: true }),
      tableStyle.getDefaultColumn('low', 'Low', { isSortable: true }),
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getActionColumn((record: AlertSeverityTrend) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
             {/* TODO: Update link when edit page exists */}
            <Link href={`/dashboard/business-units-security/alert-severity-trend/${record._id}/edit`}>
               <Pencil className="h-4 w-4" aria-label="Edit record" />
            </Link>
          </Button>
           <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: Array.isArray(trendData) ? trendData : [],
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
    console.error("Error loading Alert Severity Trend data:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Alert Severity Trend Records</h1>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/business-units-security/alert-severity-trend/new">
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
