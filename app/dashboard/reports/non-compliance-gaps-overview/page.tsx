'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  useGetReportNonComplianceGapsOverviews,
  useDeleteReportNonComplianceGapsOverview,
  useUpdateReportNonComplianceGapsOverview,
  ReportNonComplianceGapsOverview,
  COMPLIANCE_TYPES,
  STATUS_TYPES,
  NonComplianceGapDetailItem,
  UpdateReportNonComplianceGapsOverviewDto,
  ComplianceType,
} from '@/lib/api/endpoints/reports/non-compliance-gaps-overview';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, Trash2 } from 'lucide-react';
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
  CellContext,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { NonComplianceGapsOverviewEditDialog } from './non-compliance-gaps-overview-edit-dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { NonComplianceDetailsDialog } from './non-compliance-details-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define the new interface for aggregated data
export interface MonthlyComplianceSummary {
  _id: string; // Use the ID of the first original record for identification
  year: string;
  month: string;
  complianceScores: Partial<Record<ComplianceType, string | "N/A">>;
  totalScore: string | "N/A"; // From the first record's main score
  originalRecords: ReportNonComplianceGapsOverview[];
}

export default function ReportNonComplianceGapsOverviewPage() {
  const { data: apiResponse, isLoading, error, refetch } = useGetReportNonComplianceGapsOverviews();
  const deleteRecordHook = useDeleteReportNonComplianceGapsOverview();
  const updateRecordHook = useUpdateReportNonComplianceGapsOverview();

  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<ReportNonComplianceGapsOverview | null>(null);

  // State for custom delete confirmation dialog
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<MonthlyComplianceSummary | null>(null);

  // State for the new "Non Compliance Details" dialog
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedRecordsForDetails, setSelectedRecordsForDetails] = useState<ReportNonComplianceGapsOverview[] | null>(null);

  const aggregatedData = useMemo((): MonthlyComplianceSummary[] => {
    if (!apiResponse?.data) return [];

    const groupedByMonthYear: Record<string, ReportNonComplianceGapsOverview[]> = {};
    apiResponse.data.forEach(record => {
      const key = `${record.year}-${record.month}`;
      if (!groupedByMonthYear[key]) {
        groupedByMonthYear[key] = [];
      }
      groupedByMonthYear[key].push(record);
    });

    return Object.entries(groupedByMonthYear).map(([key, records]) => {
      const [year, month] = key.split('-');
      const firstRecord = records[0];
      
      const complianceScores: Partial<Record<ComplianceType, string | "N/A">> = {};
      COMPLIANCE_TYPES.forEach(ct => {
        const recordForComplianceType = records.find(r => r.compliance === ct);
        complianceScores[ct] = recordForComplianceType ? recordForComplianceType.score : "N/A";
      });

      return {
        _id: firstRecord._id, // For actions, uniquely identifies the group (by its first record)
        year,
        month,
        complianceScores,
        totalScore: firstRecord.score || "N/A",
        originalRecords: records,
      };
    });
  }, [apiResponse]);

  const handleOpenEditDialog = (summaryRow: MonthlyComplianceSummary) => {
    if (summaryRow.originalRecords.length > 0) {
      setSelectedRecordForEdit(summaryRow.originalRecords[0]); // Edit the first original record
      setIsEditDialogOpen(true);
    } else {
      toast.info("No original records available to edit for this group.");
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedRecordForEdit(null);
  };

  const handleEditSuccess = () => {
    refetch();
    handleCloseEditDialog();
  };

  const handleOpenDetailsDialog = (records: ReportNonComplianceGapsOverview[]) => {
    setSelectedRecordsForDetails(records);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedRecordsForDetails(null);
  };

  const handleDeleteAggregated = async (summaryRow: MonthlyComplianceSummary) => {
    setIsDeleting(true);
    const idsToDelete = summaryRow.originalRecords.map(r => r._id);
    let successCount = 0;
    let errorCount = 0;
    toast.info(`Attempting to delete ${idsToDelete.length} underlying record(s) for ${summaryRow.year}-${summaryRow.month}...`);

    for (const id of idsToDelete) {
      try {
        await deleteRecordHook.mutateAsync(id);
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }
    if (successCount > 0) toast.success(`Successfully deleted ${successCount} record(s).`);
    if (errorCount > 0) toast.error(`Failed to delete ${errorCount} record(s).`);
    
    refetch();
    // Reset selection if the deleted row was selected
    const newRowSelection = { ...rowSelection };
    const deletedRowIndex = table.getRowModel().rows.findIndex(row => row.original._id === summaryRow._id);
    if (deletedRowIndex > -1 && newRowSelection[deletedRowIndex]) {
        delete newRowSelection[deletedRowIndex];
        setRowSelection(newRowSelection);
    }
    setIsDeleting(false);
  };

  const handleInitiateDelete = (summaryRow: MonthlyComplianceSummary) => {
    setRowToDelete(summaryRow);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    await handleDeleteAggregated(rowToDelete);
    setIsConfirmDeleteDialogOpen(false);
    setRowToDelete(null);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedAggregatedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
    let totalIdsToDelete: string[] = [];
    selectedAggregatedRows.forEach(aggRow => {
        totalIdsToDelete.push(...aggRow.originalRecords.map(r => r._id));
    });

    let successCount = 0;
    let errorCount = 0;
    toast.info(`Attempting to bulk delete ${totalIdsToDelete.length} underlying record(s)...`);
    
    for (const id of totalIdsToDelete) {
      try {
        await deleteRecordHook.mutateAsync(id);
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }
    if (successCount > 0) toast.success(`Successfully bulk deleted ${successCount} record(s).`);
    if (errorCount > 0) toast.error(`Failed to bulk delete ${errorCount} record(s).`);
    
    refetch();
    setRowSelection({});
    setIsDeleting(false);
    setShowBulkDeleteDialog(false);
  };

  const customGlobalFilterFn: FilterFn<MonthlyComplianceSummary> = useCallback((row, columnId, filterValue) => {
    const searchTerm = String(filterValue).toLowerCase();
    const summary = row.original;

    let match = (
      String(summary.year).toLowerCase().includes(searchTerm) ||
      String(summary.month).toLowerCase().includes(searchTerm) ||
      String(summary.totalScore).toLowerCase().includes(searchTerm) ||
      Object.values(summary.complianceScores).some(score => String(score).toLowerCase().includes(searchTerm))
    );

    if (match) return true;

    // Search within original records for more detailed fields
    return summary.originalRecords.some(record => 
      String(record.compliance).toLowerCase().includes(searchTerm) ||
      (record.details && record.details.some(detail => 
        String(detail.issueName).toLowerCase().includes(searchTerm) ||
        String(detail.relatedStandard).toLowerCase().includes(searchTerm) ||
        String(detail.responsiblePerson).toLowerCase().includes(searchTerm) ||
        String(detail.priorityLevel).toLowerCase().includes(searchTerm) ||
        String(detail.status).toLowerCase().includes(searchTerm)
      ))
    );
  }, []);

  const tableStyle = useTableStyle<MonthlyComplianceSummary>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['year', 'month', 'totalScore'],
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<MonthlyComplianceSummary, any>[]>(() => {
    return [
      tableStyle.getSelectionColumn(),
      {
        accessorKey: 'year',
        header: 'Year',
        cell: info => info.getValue(),
        meta: { cellClassName: 'min-w-[80px]' },
        enableSorting: true,
      },
      {
        accessorKey: 'month',
        header: 'Month',
        cell: info => info.getValue(),
        meta: { cellClassName: 'min-w-[100px]' },
        enableSorting: true,
      },
      ...COMPLIANCE_TYPES.map((complianceType): ColumnDef<MonthlyComplianceSummary, any> => ({
        id: `compliance-${complianceType}`,
        header: complianceType,
        accessorFn: (row: MonthlyComplianceSummary) => row.complianceScores[complianceType] || "N/A",
        cell: info => info.getValue(),
        meta: { cellClassName: 'min-w-[120px] text-center' },
        enableSorting: false,
      })),
      {
        accessorKey: 'totalScore',
        header: 'Total Scores',
        cell: info => info.getValue(),
        meta: { cellClassName: 'min-w-[120px] font-semibold' },
        enableSorting: true,
      },
      {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => handleOpenDetailsDialog(row.original.originalRecords)}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Button>
        ),
        meta: { cellClassName: 'min-w-[150px]' }
      },
      {
        id: 'haktrak',
        header: 'Haktrak',
        cell: () => "Will be implemented later", // Placeholder
        meta: { cellClassName: 'min-w-[150px]' }
      },
      tableStyle.getActionColumn((summaryRow: MonthlyComplianceSummary) => (
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(summaryRow)} className="h-8 w-8 p-0" title="Edit first record for this month">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleInitiateDelete(summaryRow)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title={`Delete all ${summaryRow.originalRecords.length} records for ${summaryRow.year}-${summaryRow.month}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )),
    ];
  }, [tableStyle, handleOpenEditDialog, aggregatedData]);

  const table = useReactTable({
    data: aggregatedData,
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
    getRowId: (row) => row._id,
  });

  if (isLoading) return <PageContainer><PageHeader title="Non-Compliance Gaps Overview" /><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><PageHeader title="Non-Compliance Gaps Overview" /><p>Error loading data. Check console.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Non-Compliance Gaps Overview Management" />
      <div className="flex items-center justify-between mb-6 mt-6">
        <Input
          placeholder="Filter records..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${table.getFilteredSelectedRowModel().rows.length} groups)`}
            </Button>
          )}
          <Link href="/dashboard/reports/non-compliance-gaps-overview/new">
            <Button>Add New Gap Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}

      {selectedRecordForEdit && (
        <NonComplianceGapsOverviewEditDialog
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          reportToEdit={selectedRecordForEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Custom Delete Confirmation Dialog */}
      {rowToDelete && (
        <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete all {rowToDelete.originalRecords.length} underlying compliance gap records 
                for {rowToDelete.year}-{rowToDelete.month}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRowToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <NonComplianceDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        records={selectedRecordsForDetails}
      />
    </PageContainer>
  );
}
