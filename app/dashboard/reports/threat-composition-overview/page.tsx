'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import {
  useGetThreatCompositionOverviews,
  useDeleteThreatCompositionOverview,
  THREAT_TYPES
} from '@/lib/api/endpoints/reports/threat-composition-overview';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ReportsThreatCompositionOverview, ReportsThreatType } from '@/lib/api/reports-types/types';
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
import { EditThreatCompositionDialog } from './edit-threat-composition-dialog';

// New interface for aggregated data
interface MonthlyThreatSummary {
  id: string; // e.g., "2024-March"
  year: string;
  month: string;
  totalIncidents: number;
  threatCounts: { [key in ReportsThreatType]?: number | 'N/A' }; // Store counts for each threat type
  originalRecords?: ReportsThreatCompositionOverview[];
}

export default function ReportsThreatCompositionOverviewPage() {
  const { data: rawApiResponse, isLoading, error, refetch } = useGetThreatCompositionOverviews();
  const deleteRecordHook = useDeleteThreatCompositionOverview();

  // State for Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<ReportsThreatCompositionOverview | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const aggregatedData = useMemo(() => {
    if (!rawApiResponse) return [];

    const summary: { [key: string]: MonthlyThreatSummary } = {};

    rawApiResponse.forEach(record => {
      const yearMonthKey = `${record.year}-${record.month}`;
      if (!summary[yearMonthKey]) {
        summary[yearMonthKey] = {
          id: yearMonthKey,
          year: record.year,
          month: record.month,
          totalIncidents: 0,
          threatCounts: THREAT_TYPES.reduce((acc, type) => {
            acc[type] = 0; // Initialize all known threat types with 0
            return acc;
          }, {} as { [key in ReportsThreatType]?: number | 'N/A' }),
          originalRecords: []
        };
      }

      summary[yearMonthKey].totalIncidents += record.incidentCount;
      const currentThreatTypeCount = summary[yearMonthKey].threatCounts[record.threatType] || 0;
      if (typeof currentThreatTypeCount === 'number') {
        summary[yearMonthKey].threatCounts[record.threatType] = currentThreatTypeCount + record.incidentCount;
      }
      summary[yearMonthKey].originalRecords?.push(record);
    });
    
    // Convert counts to "N/A" if zero
    Object.values(summary).forEach(item => {
      THREAT_TYPES.forEach(type => {
        if (item.threatCounts[type] === 0) {
          item.threatCounts[type] = 'N/A';
        }
      });
    });

    return Object.values(summary);
  }, [rawApiResponse]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // --- Custom Global Filter Function ---
  const customGlobalFilterFn: FilterFn<MonthlyThreatSummary> = (row, columnId, filterValue) => {
    const searchTerm = String(filterValue).toLowerCase();

    // Check year and month (ensure they are strings before calling toLowerCase)
    if (String(row.original.year).toLowerCase().includes(searchTerm) ||
        String(row.original.month).toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Check threat types in originalRecords
    if (row.original.originalRecords) {
      for (const record of row.original.originalRecords) {
        if (String(record.threatType).toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    return false;
  };

  // --- Handlers ---
  const handleDelete = async (monthId: string) => {
    setIsDeleting(true);
    const monthSummary = aggregatedData.find(agg => agg.id === monthId);
    const recordsToDelete = monthSummary?.originalRecords || [];

    if (recordsToDelete.length === 0) {
      toast.error(`No individual records found for ${monthId} to delete.`);
      setIsDeleting(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    toast.info(`Attempting to delete ${recordsToDelete.length} record(s) for ${monthId}...`);

    for (const record of recordsToDelete) {
      try {
        await deleteRecordHook.mutateAsync(record._id);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete record ${record._id}:`, err);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} record(s) for ${monthId}.`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} record(s) for ${monthId}.`);
    }
    if (successCount === 0 && errorCount === 0) { // Should not happen if recordsToDelete.length > 0
        toast.info("No records were processed for deletion.");
    }
    
    refetch(); // Refetch data to update the table
    setIsDeleting(false);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedMonthIds = selectedRows.map(row => row.original.id);
    
    let allRecordsToDelete: ReportsThreatCompositionOverview[] = [];
    selectedMonthIds.forEach(monthId => {
      const monthSummary = aggregatedData.find(agg => agg.id === monthId);
      if (monthSummary?.originalRecords) {
        allRecordsToDelete.push(...monthSummary.originalRecords);
      }
    });

    if (allRecordsToDelete.length === 0) {
      toast.error("No individual records found for selected months to delete.");
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    toast.info(`Attempting to bulk delete ${allRecordsToDelete.length} record(s)...`);

    for (const record of allRecordsToDelete) {
      try {
        await deleteRecordHook.mutateAsync(record._id);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete record ${record._id} during bulk operation:`, err);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully bulk deleted ${successCount} record(s).`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to bulk delete ${errorCount} record(s).`);
    }
     if (successCount === 0 && errorCount === 0) {
        toast.info("No records were processed for bulk deletion.");
    }

    refetch();
    setRowSelection({}); // Clear selection
    setIsDeleting(false);
    setShowBulkDeleteDialog(false);
  };

  const handleOpenEditDialog = (record: ReportsThreatCompositionOverview) => {
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

  const tableStyle = useTableStyle<MonthlyThreatSummary>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['year', 'month', 'totalIncidents'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<MonthlyThreatSummary>[]>(() => {
    const dynamicThreatTypeColumns: ColumnDef<MonthlyThreatSummary>[] = THREAT_TYPES.map(
      (threatType) => ({
        id: `threat-${threatType}`,
        header: threatType,
        accessorFn: (row) => row.threatCounts[threatType] ?? 'N/A',
        cell: info => info.getValue(),
        enableSorting: false,
        meta: { cellClassName: 'text-center' }
      })
    );

    return [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
      ...dynamicThreatTypeColumns,
      tableStyle.getDefaultColumn('totalIncidents', 'Total Incidents', { isSortable: true, cellClassName: 'font-medium text-center' }),
      tableStyle.getActionColumn((aggRow: MonthlyThreatSummary) => (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (aggRow.originalRecords && aggRow.originalRecords.length > 0) {
                handleOpenEditDialog(aggRow.originalRecords[0]);
              } else {
                toast.info("No individual records available for editing for this month.");
              }
            }}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <tableStyle.DeleteDialog id={aggRow.id} />
        </>
      )),
    ];
  }, [tableStyle, isDeleting, aggregatedData]);

  const table = useReactTable({
    data: aggregatedData,
    columns,
    globalFilterFn: customGlobalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
  });

  if (isLoading) {
    return <PageContainer><PageHeader title="Report: Threat Composition Overview" /><p>Loading...</p></PageContainer>;
  }

  if (error) {
    console.error("Error loading data:", error);
    return <PageContainer><PageHeader title="Report: Threat Composition Overview" /><p>Error loading data. Check console.</p></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader title="Report: Threat Composition Overview Management" />
      <div className="flex items-center justify-between mb-6 mt-6">
        <Input
          placeholder="Filter by Year, Month, Threat Type..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${Object.keys(rowSelection).length})`}
            </Button>
          )}
          <Link href="/dashboard/reports/threat-composition-overview/new">
            <Button>Add New Overview Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}

      {selectedRecordForEdit && (
        <EditThreatCompositionDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          threatComposition={selectedRecordForEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </PageContainer>
  );
}
