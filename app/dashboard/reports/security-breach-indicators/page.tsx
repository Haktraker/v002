'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  useGetReportsSecurityBreachIndicators,
  useDeleteReportsSecurityBreachIndicator,
  ReportsSecurityBreachIndicators,
  SECURITY_BREACH_INDICATOR_NAMES,
  SecurityBreachIndicatorName,
} from '@/lib/api/endpoints/reports/security-breach-indicators';
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
  FilterFn,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { SecurityBreachIndicatorsEditDialog } from './security-breach-indicators-edit-dialog';

// Simple date formatter utility
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export default function ReportsSecurityBreachIndicatorsPage() {
  const { data: apiResponse, isLoading, error, refetch } = useGetReportsSecurityBreachIndicators();
  const deleteRecordHook = useDeleteReportsSecurityBreachIndicator();

  // Table state
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<ReportsSecurityBreachIndicators | null>(null);

  const handleOpenEditDialog = (record: ReportsSecurityBreachIndicators) => {
    setSelectedRecordForEdit(record);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedRecordForEdit(null);
  };

  const handleEditSuccess = () => {
    refetch();
    handleCloseEditDialog();
  };

  // --- Handlers ---
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteRecordHook.mutateAsync(id);
      toast.success('Security Breach Indicator record deleted successfully');
      refetch();
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

    toast.info(`Attempting to bulk delete ${selectedIds.length} record(s)...`);

    for (const id of selectedIds) {
      try {
        await deleteRecordHook.mutateAsync(id);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete record ${id} during bulk operation:`, err);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully bulk deleted ${successCount} record(s).`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to bulk delete ${errorCount} record(s).`);
    }
    if (successCount === 0 && errorCount === 0 && selectedIds.length > 0) {
       toast.info("No records were processed for bulk deletion.");
    }

    refetch();
    setRowSelection({});
    setIsDeleting(false);
    setShowBulkDeleteDialog(false);
  };
  
  const customGlobalFilterFn: FilterFn<ReportsSecurityBreachIndicators> = useCallback((row, columnId, filterValue) => {
    const searchTerm = String(filterValue).toLowerCase();

    if (String(row.original.year).toLowerCase().includes(searchTerm) ||
        String(row.original.month).toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Check indicator names
    if (row.original.indicators) {
      for (const indicator of row.original.indicators) {
        if (String(indicator.indicatorName).toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    return false;
  }, []);


  // --- Table Setup ---
  const tableStyle = useTableStyle<ReportsSecurityBreachIndicators>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<ReportsSecurityBreachIndicators>[]>(() => {
    const indicatorColumns: ColumnDef<ReportsSecurityBreachIndicators>[] = SECURITY_BREACH_INDICATOR_NAMES.map(name => ({
      id: `indicator-${name}`,
      header: name,
      accessorFn: (row) => {
        const indicator = row.indicators.find(ind => ind.indicatorName === name);
        return indicator ? indicator.score : 'N/A';
      },
      cell: info => info.getValue(),
      enableSorting: false,
      meta: { cellClassName: 'text-center' }
    }));

    return [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      ...indicatorColumns,
      tableStyle.getDefaultColumn('createdAt', 'Created At', { isSortable: true, formatter: formatDate }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', { isSortable: true, formatter: formatDate }),
      tableStyle.getActionColumn((record) => (
        <>
          <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(record)} className="h-8 w-8 p-0">
            <Pencil className="h-4 w-4" />
          </Button>
          <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ];
  }, [isDeleting, tableStyle, handleOpenEditDialog]);

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
    globalFilterFn: customGlobalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
  });

  // --- Render Logic ---
  if (isLoading) {
    return <PageContainer><PageHeader title="Report: Security Breach Indicators" /><p>Loading...</p></PageContainer>;
  }

  if (error) {
    console.error("Error loading data:", error);
    return <PageContainer><PageHeader title="Report: Security Breach Indicators" /><p>Error loading data. Check console.</p></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader title="Security Breach Indicators Management" />
      <div className="flex items-center justify-between mb-6 mt-6">
        <Input
          placeholder="Filter by Year, Month, Indicator Name..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting || table.getFilteredSelectedRowModel().rows.length === 0}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${table.getFilteredSelectedRowModel().rows.length})`}
            </Button>
          )}
          <Link href="/dashboard/reports/security-breach-indicators/new">
            <Button>Add New Indicator Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}

      {selectedRecordForEdit && (
        <SecurityBreachIndicatorsEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          report={selectedRecordForEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </PageContainer>
  );
}
