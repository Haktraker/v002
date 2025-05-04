'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { useGetIncidentAlertVolumes, useDeleteIncidentAlertVolume } from '@/lib/api/endpoints/executive-dashboard/incident-and-alert-volume';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { IncidentAndAlertVolume } from '@/lib/api/executive-dashboard-types/types';
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

export default function IncidentAndAlertVolumePage() {
  // Fetch data
  const { data: apiResponse, isLoading, error, refetch } = useGetIncidentAlertVolumes();
  const deleteRecord = useDeleteIncidentAlertVolume();

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
      toast.success('Record deleted successfully');
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

  const handleUpdate = (record: IncidentAndAlertVolume) => {
    toast.info('Edit functionality not yet implemented.');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // --- Table Setup ---
  const tableStyle = useTableStyle<IncidentAndAlertVolume>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['score', 'month', 'year', 'quarter', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<IncidentAndAlertVolume>[]>(() => [
    tableStyle.getSelectionColumn(),
    tableStyle.getDefaultColumn('score', 'Volume/Score', { isSortable: true, cellClassName: 'font-medium' }),
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
  if (isLoading) return <PageContainer><PageHeader title="Incident & Alert Volume" /><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><PageHeader title="Incident & Alert Volume" /><p>Error loading data.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Incident & Alert Volume Management" />
      <div className="flex items-center justify-between mb-6">
        <Input
          placeholder="Filter by Month..." // Example filter, adjust as needed
          value={(table.getColumn("month")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("month")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${Object.keys(rowSelection).length})`}
            </Button>
          )}
          <Link href="/dashboard/executive-dashboard/incident-and-alert-volume/new">
            <Button>Add New Volume Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}
