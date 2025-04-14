'use client';

import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/page-container';
import { useTableStyle } from '@/hooks/use-table-style';
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
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { UserRiskDistribution } from '@/lib/api/types';
import { useDeleteUserRiskDistribution, useGetUserRiskDistributions } from '@/lib/api/endpoints/security-breach-indicators/user-risk-distribution/user-risk-distribution';
import Link from 'next/link';
import { Pencil } from 'lucide-react';

export default function UserRiskDistributionPage() {
  const { data: riskData, isLoading, error, refetch } = useGetUserRiskDistributions();
  const deleteRiskDistribution = useDeleteUserRiskDistribution();

  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteRiskDistribution.mutateAsync(id);
      refetch();
      toast.success('Risk distribution record deleted successfully');
    } catch (error) {
      console.error('Failed to delete risk distribution record:', error);
      toast.error('Failed to delete risk distribution record');
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
      for (const id of selectedIds) {
        try {
          await deleteRiskDistribution.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete risk distribution record ${id}:`, error);
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

  const formatSeverities = (severities: { severity: string; count: number }[]) => {
    if (!severities) return 'N/A';
    return severities
      .sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return order[a.severity as keyof typeof order] - order[b.severity as keyof typeof order];
      })
      .map(s => `${s.severity}: ${s.count}`)
      .join(', ');
  };

  const formatBusinessUnits = (bu: { buName: string; severities: { severity: string; count: number }[] }[]) => {
    if (!bu || bu.length === 0) return 'N/A';
    return bu.map(unit => unit.buName).join(', ');
  };

  const tableStyle = useTableStyle<UserRiskDistribution>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = React.useMemo<ColumnDef<UserRiskDistribution>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('month', 'Month', {
        isSortable: true,
        cellClassName: 'font-medium',
      }),
      tableStyle.getDefaultColumn('year', 'Year', {
        isSortable: true,
      }),
      {
        id: 'critical',
        header: 'Critical',
        cell: ({ row }) => {
          const allSeverities = row.original.bu.flatMap(unit => unit.severities);
          const criticalCount = allSeverities.reduce((total, curr) => 
            curr.severity === 'Critical' ? total + curr.count : total, 0
          );
          return criticalCount;
        },
      },
      {
        id: 'high',
        header: 'High',
        cell: ({ row }) => {
          const allSeverities = row.original.bu.flatMap(unit => unit.severities);
          const highCount = allSeverities.reduce((total, curr) => 
            curr.severity === 'High' ? total + curr.count : total, 0
          );
          return highCount;
        },
      },
      {
        id: 'medium',
        header: 'Medium',
        cell: ({ row }) => {
          const allSeverities = row.original.bu.flatMap(unit => unit.severities);
          const mediumCount = allSeverities.reduce((total, curr) => 
            curr.severity === 'Medium' ? total + curr.count : total, 0
          );
          return mediumCount;
        },
      },
      {
        id: 'low',
        header: 'Low',
        cell: ({ row }) => {
          const allSeverities = row.original.bu.flatMap(unit => unit.severities);
          const lowCount = allSeverities.reduce((total, curr) => 
            curr.severity === 'Low' ? total + curr.count : total, 0
          );
          return lowCount;
        },
      },
      tableStyle.getActionColumn((riskDist) => (
        <>
          <Link href={`/dashboard/security-breach-indicators/user-risk-distribution/${riskDist._id}/edit`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <tableStyle.DeleteDialog id={riskDist._id} />
        </>
      )),
    ],
    [isDeleting]
  );

  const table = useReactTable({
    data: Array.isArray(riskData) ? riskData : [],
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
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.log(error);
    return <div>Error loading risk distribution data</div>;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">User Risk Distribution</h1>
          <Input
            placeholder="Filter by month..."
            value={(table.getColumn('month')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('month')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/security-breach-indicators/user-risk-distribution/new">
            <Button variant="default" className="gap-2">
              Add New
            </Button>
          </Link>
          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}