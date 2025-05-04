'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { useGetDigitalRisks, useDeleteDigitalRisk } from '@/lib/api/endpoints/executive-dashboard/digital-risk-intelligence';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { DigitalRiskIntelligence, RiskLevel, RiskIndicator } from '@/lib/api/executive-dashboard-types/types';
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
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';

// Badge colors for risk levels
const riskLevelBadgeVariant: Record<RiskLevel, "default" | "secondary" | "destructive" | "outline" | null | undefined > = {
  "no risk": 'outline', // Changed from 'success' to 'outline'
  medium: 'secondary', // Changed from 'warning'
  high: 'destructive',
  critical: 'destructive', 
};

// Helper to format indicator labels
const formatIndicatorLabel = (indicator: RiskIndicator): string => {
    return indicator.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function DigitalRiskIntelligencePage() {
  // Fetch data
  const { data: apiResponse, isLoading, error, refetch } = useGetDigitalRisks();
  const deleteRecord = useDeleteDigitalRisk();

  // Table state
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // --- Handlers ---
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteRecord.mutateAsync(id);
      refetch();
      toast.success('Risk record deleted successfully');
    } catch (err) {
      console.error('Failed to delete record:', err);
      toast.error('Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map(row => row.original._id);
    let successCount = 0, errorCount = 0;

    try {
      for (const id of selectedIds) {
        try {
          await deleteRecord.mutateAsync(id);
          successCount++;
        } catch (err) {
          console.error(`Failed to delete record ${id}:`, err);
          errorCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch();
      } else {
        toast.error('Failed to delete any records');
      }
    } catch (err) {
      console.error('Bulk deletion failed:', err);
      toast.error('Bulk deletion process failed');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
      setRowSelection({});
    }
  };

  const handleUpdate = (record: DigitalRiskIntelligence) => {
    // TODO: Implement update functionality
    toast.info(`Edit functionality for indicator ${record.indicator} not yet implemented.`);
    // Example: router.push(`/dashboard/executive-dashboard/digital-risk-intelligence/edit/${record._id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // --- Table Setup ---
  const tableStyle = useTableStyle<DigitalRiskIntelligence>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['indicator', 'level', 'month', 'year', 'quarter', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<DigitalRiskIntelligence>[]>(() => [
    tableStyle.getSelectionColumn(),
    {
        accessorKey: 'indicator',
        header: ({ column }) => tableStyle.getHeaderContent(column, 'Indicator', true),
        cell: ({ row }) => formatIndicatorLabel(row.getValue('indicator') as RiskIndicator),
        filterFn: 'includesString', // Enable basic text filtering
    },
    {
      accessorKey: 'level',
      header: ({ column }) => tableStyle.getHeaderContent(column, 'Risk Level', true),
      cell: ({ row }) => {
        const level = row.getValue('level') as RiskLevel;
        // Use the mapped variant directly
        const badgeVariant = riskLevelBadgeVariant[level];
        return (
          <Badge variant={badgeVariant || 'default'} // Fallback to default if somehow undefined
                 className="capitalize min-w-[70px] flex justify-center"
          >
            {level}
          </Badge>
        );
      },
      filterFn: 'equalsString', // Enable select/exact filtering if needed
    },
    tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
    tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
    tableStyle.getDefaultColumn('quarter', 'Quarter', { isSortable: true }),
    tableStyle.getDefaultColumn('createdAt', 'Created At', { isSortable: true, formatter: formatDate }),
    tableStyle.getDefaultColumn('updatedAt', 'Updated At', { isSortable: true, formatter: formatDate }),
    tableStyle.getActionColumn((record) => (
      <>
        <Button variant="ghost" size="icon" onClick={() => handleUpdate(record)} className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
        </Button>
        <tableStyle.DeleteDialog id={record._id} />
      </>
    )),
  ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: apiResponse?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
  });

  // --- Render Logic ---
  if (isLoading) return <PageContainer><PageHeader title="Digital Risk Intelligence" /><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><PageHeader title="Digital Risk Intelligence" /><p>Error loading data.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Digital Risk Intelligence Management" />
      <div className="flex items-center justify-between mb-6">
        <Input
          placeholder="Filter by Indicator..."
          value={(table.getColumn("indicator")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("indicator")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        {/* Add filtering for level if needed using a Select component */}
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${Object.keys(rowSelection).length})`}
            </Button>
          )}
          <Link href="/dashboard/executive-dashboard/digital-risk-intelligence/new">
            <Button>Add New Risk Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}
