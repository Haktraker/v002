'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { useGetThirdPartyThreats, useDeleteThirdPartyThreat } from '@/lib/api/endpoints/reports/third-party-threat-intelligence';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ReportThirdPartyThreatIntelligence, SeverityLevel } from '@/lib/api/reports-types/types';
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

// Badge colors for severity levels
const severityBadgeVariant: Record<SeverityLevel, "default" | "secondary" | "destructive" | "outline" | null | undefined > = {
  low: 'default',
  medium: 'secondary',
  high: 'destructive',
  critical: 'destructive',
};

export default function ThirdPartyThreatIntelligencePage() {
  // Fetch data
  const { data: apiResponse, isLoading, error, refetch } = useGetThirdPartyThreats();
  const deleteRecord = useDeleteThirdPartyThreat();

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
      toast.success('Threat record deleted successfully');
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

  const handleUpdate = (record: ReportThirdPartyThreatIntelligence) => {
    // TODO: Implement update functionality - likely navigate to an edit page
    toast.info(`Edit functionality for ${record.thirdParty} not yet implemented.`);
    // Example: router.push(`/dashboard/executive-dashboard/third-party-threat-intelligence/edit/${record._id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // --- Table Setup ---
  const tableStyle = useTableStyle<ReportThirdPartyThreatIntelligence>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['thirdParty', 'severity', 'month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<ReportThirdPartyThreatIntelligence>[]>(() => [
    tableStyle.getSelectionColumn(),
    tableStyle.getDefaultColumn('thirdParty', 'Third Party', { isSortable: true, cellClassName: 'font-medium' }),
    {
      accessorKey: 'severity',
      header: ({ column }) => tableStyle.getHeaderContent(column, 'Severity', true),
      cell: ({ row }) => {
        const severity = row.getValue('severity') as SeverityLevel;
        return (
          <Badge variant={severityBadgeVariant[severity]}
                 className="capitalize min-w-[60px] flex justify-center"
          >
            {severity}
          </Badge>
        );
      }
    },
    tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
    tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
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
  if (isLoading) return <PageContainer><PageHeader title="Third Party Threat Intelligence" /><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><PageHeader title="Third Party Threat Intelligence" /><p>Error loading data.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Third Party Threat Intelligence Management" />
      <div className="flex items-center justify-between mb-6">
        <Input
          placeholder="Filter by Third Party..."
          value={(table.getColumn("thirdParty")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("thirdParty")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${Object.keys(rowSelection).length})`}
            </Button>
          )}
          <Link href="/dashboard/reports/third-party-threat-intelligence/new">
            <Button>Add New Threat Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}
