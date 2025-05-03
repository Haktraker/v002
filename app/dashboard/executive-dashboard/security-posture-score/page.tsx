'use client'; // Make it a client component

import React from 'react';
import { useState, useMemo } from 'react';
import { useGetSecurityPostureScores, useDeleteSecurityPostureScore } from '@/lib/api/endpoints/executive-dashboard/security-posture-score';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react'; // Assuming edit functionality might be added
import { toast } from 'sonner';
import { SecurityPostureScore } from '@/lib/api/executive-dashboard-types/types';
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

export default function SecurityPostureScorePage() {
  // Fetch data
  const { data: apiResponse, isLoading, error, refetch } = useGetSecurityPostureScores();
  const deleteRecord = useDeleteSecurityPostureScore(); // Hook for deleting

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
      refetch(); // Refetch data after successful delete
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

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const id of selectedIds) {
        try {
          await deleteRecord.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete record ${id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch(); // Refetch after bulk delete
      } else {
        toast.error('Failed to delete any records');
      }
    } catch (err) {
      console.error('Bulk deletion failed:', err);
      toast.error('Bulk deletion process failed');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
      setRowSelection({}); // Clear selection after bulk action
    }
  };

  // Placeholder for potential update navigation
  const handleUpdate = (record: SecurityPostureScore) => {
    // Navigate to an edit page if it exists
    // window.location.href = `/dashboard/executive-dashboard/security-posture-score/${record._id}/edit`;
    toast.info('Edit functionality not yet implemented.');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // --- Table Setup ---
  const tableStyle = useTableStyle<SecurityPostureScore>({
    enableSelection: true,
    enableSorting: true,
    // Define sortable columns for SecurityPostureScore
    sortableColumns: ['score', 'percentage', 'month', 'year', 'quarter', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<SecurityPostureScore>[]>(() => [
    tableStyle.getSelectionColumn(),
    tableStyle.getDefaultColumn('score', 'Score', { isSortable: true, cellClassName: 'font-medium' }),
    tableStyle.getDefaultColumn('percentage', 'Percentage', { isSortable: true }),
    tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
    tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
    tableStyle.getDefaultColumn('quarter', 'Quarter', { isSortable: true }),
    tableStyle.getDefaultColumn('createdAt', 'Created At', { isSortable: true, formatter: formatDate }),
    tableStyle.getDefaultColumn('updatedAt', 'Updated At', { isSortable: true, formatter: formatDate }),
    tableStyle.getActionColumn((record) => (
      <>
        {/* Edit Button Placeholder */}
        <Button variant="ghost" size="icon" onClick={() => handleUpdate(record)} className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
        </Button>
        {/* Delete Dialog */}
        <tableStyle.DeleteDialog id={record._id} />
      </>
    )),
  ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: apiResponse?.data || [], // Use the data array from the response
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

  // --- Render Logic ---
  if (isLoading) {
    return <PageContainer><PageHeader title="Security Posture Score Management" /><p>Loading...</p></PageContainer>;
  }

  if (error) {
    console.error("Error loading data:", error);
    return <PageContainer><PageHeader title="Security Posture Score Management" /><p>Error loading data. Check console.</p></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader title="Security Posture Score Management" />
      <div className="flex items-center justify-between mb-6">
        {/* Filter Input (e.g., by Score) */}
        <Input
          placeholder="Filter by Score..."
          value={(table.getColumn("score")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("score")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {/* Bulk Delete Button */}
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${Object.keys(rowSelection).length})`}
            </Button>
          )}
          {/* Add New Button Placeholder */}
          <Link href="/dashboard/executive-dashboard/security-posture-score/new"> {/* Adjust link as needed */}
            <Button>Add New Score</Button>
          </Link>
        </div>
      </div>

      {/* Render Table */}
      {tableStyle.renderTable(table)}
      {/* Render Pagination */}
      {tableStyle.Pagination({ table })}
      {/* Render Bulk Delete Dialog */}
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}


