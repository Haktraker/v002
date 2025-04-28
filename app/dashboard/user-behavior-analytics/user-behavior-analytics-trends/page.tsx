'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { 
    useGetUserBehaviorAnalytics, 
    useDeleteUserBehaviorAnalytics 
} from '@/lib/api/endpoints/user-behavior-analytics/user-behavior-analytics';
import { UserBehaviorAnalytics } from '@/lib/api/types'; 
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
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

export default function UserBehaviorAnalyticsTrendsPage() {
  // Fetch all data
  const {
    data: analyticsData, 
    isLoading,
    error,
    refetch
  } = useGetUserBehaviorAnalytics(); 

  const deleteAnalytics = useDeleteUserBehaviorAnalytics();
  
  const [isDeleting, setIsDeleting] = useState(false);
  // Default sort by year then month
  const [sorting, setSorting] = useState<SortingState>([{ id: 'year', desc: true }, { id: 'month', desc: true }]); 
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // Keep for potential future use
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const tableData = useMemo(() => {
    return Array.isArray(analyticsData) ? analyticsData : [];
  }, [analyticsData]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteAnalytics.mutateAsync(id);
      refetch();
      toast.success('Record deleted successfully');
      setRowSelection(prev => {
          const { [id]: _, ...rest } = prev;
          return rest;
      });
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete record');
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
          await deleteAnalytics.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete record ${id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch();
      } else {
        toast.error('Failed to delete any records');
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

  const tableStyle = useTableStyle<UserBehaviorAnalytics>({
    enableSelection: true,
    enableSorting: true,
    // Define sortable columns based on schema fields
    sortableColumns: [
      'month', 'year', 'criticalAlerts', 'AvgRiskScore', 
      'suspiciousUsers', 'dataAccessAnomalies', 'networkAnomalies', 'responseTime'
    ],
    onDelete: handleDelete, 
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<UserBehaviorAnalytics>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true, cellClassName: 'w-24' }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'w-32' }),
      tableStyle.getDefaultColumn('criticalAlerts', 'Critical Alerts', { 
          isSortable: true, 
          cellClassName: 'text-right' 
      }),
      tableStyle.getDefaultColumn('AvgRiskScore', 'Avg Risk Score', { 
          isSortable: true, 
          cellClassName: 'text-right',
          formatter: (val) => typeof val === 'number' ? val.toFixed(1) : 'N/A'
      }),
      tableStyle.getDefaultColumn('suspiciousUsers', 'Suspicious Users', { 
          isSortable: true, 
          cellClassName: 'text-right' 
      }),
      tableStyle.getDefaultColumn('dataAccessAnomalies', 'Data Access Anomalies', { 
          isSortable: true, 
          cellClassName: 'text-right' 
      }),
      tableStyle.getDefaultColumn('networkAnomalies', 'Network Anomalies', { 
          isSortable: true, 
          cellClassName: 'text-right' 
      }),
      tableStyle.getDefaultColumn('responseTime', 'Response Time (ms)', { 
          isSortable: true, 
          cellClassName: 'text-right' 
      }),
      tableStyle.getActionColumn((record: UserBehaviorAnalytics) => (
        <>
          {/* Link to a non-existent edit page - update later */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            asChild 
          >
            <Link href={`/dashboard/user-behavior-analytics/user-behavior-analytics-trends/${record._id}/edit`}> 
              <Pencil className="h-4 w-4" aria-label="Edit record"/>
            </Link>
          </Button>
          <tableStyle.DeleteDialog id={record._id} /> 
        </>
      )),
    ],
    [isDeleting, tableStyle] 
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
    },
    initialState: { 
        pagination: { pageSize: 10 },
        sorting: [{ id: 'year', desc: true }, { id: 'month', desc: true }] 
    },
    getRowId: (row) => row._id, // Use _id for selection state key
  });

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="User Behavior Analytics Trends" />
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
        <PageHeader title="User Behavior Analytics Trends" />
        <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md mt-6">
          Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="User Behavior Analytics Trends" />
      
      <div className="flex items-center justify-between my-6">
        <h2 className="text-xl font-semibold">Monthly UBA Records</h2>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
           {/* Link to a non-existent new page - update later */}
          <Link href="/dashboard/user-behavior-analytics/user-behavior-analytics-trends/new">
            <Button>Add New Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      <div className="mt-4">
        {tableStyle.Pagination({ table })}
      </div>
    </PageContainer>
  );
}
