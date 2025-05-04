'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { 
  useGetReportsSecurityPostureScores, 
  useDeleteReportsSecurityPostureScore 
} from '@/lib/api/endpoints/reports/security-posture-score'; // Updated import
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ReportsSecurityPostureScore } from '@/lib/api/reports-types/types'; // Updated import
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

export default function ReportsSecurityPostureScorePage() {
  // Fetch data using the new hook
  const { data: apiResponse, isLoading, error, refetch } = useGetReportsSecurityPostureScores();
  const deleteRecord = useDeleteReportsSecurityPostureScore(); // Use the new delete hook

  // Table state (remains similar)
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // --- Handlers (mostly similar, adjusted context in messages) ---
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteRecord.mutateAsync(id);
      refetch();
      toast.success('Report Score record deleted successfully'); // Updated message
    } catch (err) {
      console.error('Failed to delete record:', err);
      toast.error('Failed to delete report score record'); // Updated message
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
        toast.success(`Successfully deleted ${successCount} report score records${errorCount > 0 ? `, ${errorCount} failed` : ''}`); // Updated message
        refetch();
      } else {
        toast.error('Failed to delete any report score records'); // Updated message
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

  const handleUpdate = (record: ReportsSecurityPostureScore) => {
    // Navigate to an edit page if it exists - TODO: Implement edit page
    // router.push(`/dashboard/reports/security-posture-score/${record._id}/edit`);
    toast.info('Edit functionality not yet implemented for Report Scores.');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // --- Table Setup (adjust columns based on new schema) ---
  const tableStyle = useTableStyle<ReportsSecurityPostureScore>({
    enableSelection: true,
    enableSorting: true,
    // Define sortable columns for ReportsSecurityPostureScore (no quarter)
    sortableColumns: ['score', 'percentage', 'month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<ReportsSecurityPostureScore>[]>(() => [
    tableStyle.getSelectionColumn(),
    tableStyle.getDefaultColumn('score', 'Score', { isSortable: true, cellClassName: 'font-medium' }),
    tableStyle.getDefaultColumn('percentage', 'Percentage', { isSortable: true }),
    tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
    tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
    // No Quarter column
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
    return <PageContainer><PageHeader title="Report: Security Posture Score" /><p>Loading...</p></PageContainer>; // Title updated
  }

  if (error) {
    console.error("Error loading data:", error);
    return <PageContainer><PageHeader title="Report: Security Posture Score" /><p>Error loading data. Check console.</p></PageContainer>; // Title updated
  }

  return (
    <PageContainer>
      <PageHeader title="Report: Security Posture Score Management" /> {/* Title updated */}
      <div className="flex items-center justify-between mb-6">
        {/* Filter Input */}
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
          {/* Add New Button */}
          <Link href="/dashboard/reports/security-posture-score/new"> {/* Link updated */}
            <Button>Add New Report Score</Button>
          </Link>
        </div>
      </div>

      {/* Render Table */}
      {tableStyle.renderTable(table)}
      {/* Render Pagination */}
      {/* Passing pagination details directly to the table hook might be better if needed */}
      {/* For now, let the table handle pagination internally or adjust useTableStyle if necessary */} 
      {tableStyle.Pagination({ table /* , totalItems: apiResponse?.pagination?.totalItems */ })} 
      {/* Render Bulk Delete Dialog */}
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}
