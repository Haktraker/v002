'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Pencil, MoreHorizontal } from 'lucide-react';
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
  flexRender,
} from "@tanstack/react-table";
import { toast } from 'sonner';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Checkbox } from "@/components/ui/checkbox"

import { 
    useGetReportsDigitalRiskIntelligence, 
    useDeleteReportsDigitalRiskIntelligence 
} from '@/lib/api/endpoints/reports/digital-risk-intelligence';
import { ReportsDigitalRiskIntelligence, ReportLevel, ReportIndicator } from '@/lib/api/reports-types/types';
import { showToast } from '@/lib/utils/toast-utils';

// Assuming useTableStyle is a custom hook in your project
import { useTableStyle } from '@/hooks/use-table-style'; 

// Badge colors for risk levels - adapt from reference
const reportLevelBadgeVariant: Record<ReportLevel, "default" | "secondary" | "destructive" | "outline" | null | undefined > = {
  "no risk": 'outline',
  medium: 'secondary',
  high: 'destructive',
  critical: 'destructive', 
};

// Helper to format indicator labels - adapt from reference
const formatIndicatorLabel = (indicator?: ReportIndicator): string => {
    if (!indicator) return 'N/A';
    return indicator.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const ReportsDigitalRiskIntelligencePage = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, setIsDeleting] = useState(false); // For delete operations
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  
  // Pagination state (kept from previous version, tanstack table handles display)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const queryParams = {
    page: currentPage,
    limit: pageSize,
    // Add sortOrder and sortBy if API supports it and connect to `sorting` state
  };

  const { data: apiResponse, isLoading, error, refetch } = useGetReportsDigitalRiskIntelligence(queryParams);
  const deleteMutation = useDeleteReportsDigitalRiskIntelligence();

  // handleDelete is now called by useTableStyle's DeleteDialog upon confirmation
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    // window.confirm is removed, confirmation is handled by the modal dialog
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Report record deleted successfully');
      refetch();
      setRowSelection(prev => {
        const newSelection = {...prev};
        const deselectedKey = Object.keys(newSelection).find(key => table.getRow(key)?.original._id === id);
        if (deselectedKey) delete newSelection[deselectedKey];
        return newSelection;
      });
    } catch (err: any) {
      toast.error(`Failed to delete report record: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // handleBulkDelete remains largely the same, as it uses setShowBulkDeleteDialog
  // and tableStyle.BulkDeleteDialog() to render its modal
  const handleBulkDelete = async () => {
    // ... existing bulk delete logic ...
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows.filter(row => row.getIsSelected());
    const selectedIds = selectedRows.map(row => row.original._id);
    
    let successCount = 0;
    let errorCount = 0;

    try {
        for (const id of selectedIds) {
            try {
            await deleteMutation.mutateAsync(id);
            successCount++;
            } catch (err) {
            console.error(`Failed to delete record ${id}:`, err);
            errorCount++;
            }
        }
        if (successCount > 0) {
            toast.success(`Successfully deleted ${successCount} record(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
            refetch();
        } else if (errorCount > 0) {
            toast.error('Failed to delete selected record(s).');
        } else {
            // toast.info("No records were selected for deletion or no records were successfully deleted.");
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

  const tableStyle = useTableStyle<ReportsDigitalRiskIntelligence>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['indicator', 'level', 'month', 'year', 'createdAt'], 
    onDelete: handleDelete, // This handleDelete will be called by the dialog
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<ReportsDigitalRiskIntelligence>[]>(() => [
    tableStyle.getSelectionColumn(),
    tableStyle.getDefaultColumn('indicator', 'Indicator', { 
        isSortable: true, 
        formatter: (val: ReportIndicator | undefined) => formatIndicatorLabel(val)
    }),
    tableStyle.getDefaultColumn('level', 'Level', { 
        isSortable: true, 
        formatter: (levelValue: ReportLevel) => { 
            const badgeVariant = reportLevelBadgeVariant[levelValue] || 'outline';
            return <Badge variant={badgeVariant} className="capitalize min-w-[70px] flex justify-center">{levelValue}</Badge>;
        }
    }),
    tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
    tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),   
    tableStyle.getDefaultColumn('createdAt', 'Created At', { isSortable: true, formatter: (val: string | undefined) => formatDate(val) }),
    tableStyle.getActionColumn((record: ReportsDigitalRiskIntelligence) => (
      <>
        <Link href={`/dashboard/reports/digital-risk-intelligence/edit/${record._id}`} passHref legacyBehavior>
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 p-0">
                <a><Pencil className="h-4 w-4" /></a>
            </Button>
        </Link>
        <tableStyle.DeleteDialog id={record._id} />
      </>
    )),
  ], [isDeleting, tableStyle, refetch]); 

  const table = useReactTable({
    data: apiResponse?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // For client-side pagination controls
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { 
        sorting, 
        columnFilters, 
        rowSelection,
        // pagination state is managed separately for API calls for now
    },
    manualPagination: true, // Since API handles pagination
    pageCount: apiResponse?.pagination?.totalPages ?? -1, // Required for manual pagination
    manualSorting: true, // Add if API handles sorting
    manualFiltering: true, // Add if API handles filtering
  });

  // Handle API-driven pagination changes
  useEffect(() => {
    table.setPageSize(pageSize); // Sync table state if pageSize changes
  }, [pageSize, table]);

  useEffect(() => {
    // This effect handles refetching if current page becomes invalid after deletion, similar to previous logic
    const totalPages = apiResponse?.pagination?.totalPages ?? 0;
    if ((apiResponse?.data?.length === 0 && currentPage > 1 && totalPages > 0 && currentPage > totalPages) || 
        (apiResponse?.data?.length === 0 && currentPage > 1 && totalPages === 0 && !isLoading && !error)) {
      setCurrentPage(Math.max(1, totalPages > 0 ? totalPages : currentPage - 1));
    } 
    // refetch() is called via queryParams dependency on useGetReportsDigitalRiskIntelligence
  }, [apiResponse?.data?.length, apiResponse?.pagination?.totalPages, currentPage, isLoading, error]);


  if (isLoading && !apiResponse) return <PageContainer><PageHeader title="Digital Risk Intelligence Reports" /><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><PageHeader title="Digital Risk Intelligence Reports" /><p>Error loading data: {error.message}</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Digital Risk Intelligence Reports Management" />
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-4">
            <Input
                placeholder="Filter by Indicator..." 
                value={(table.getColumn("indicator")?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn("indicator")?.setFilterValue(event.target.value)}
                className="max-w-sm"
            />
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : `Delete Selected (${Object.keys(rowSelection).length})`}
            </Button>
          )}
          <Link href="/dashboard/reports/digital-risk-intelligence/new">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Render table using useTableStyle hook */}
      {tableStyle.renderTable(table)}
      
      {/* Render pagination using useTableStyle hook */}
      {tableStyle.Pagination({ table })}

      {/* Render bulk delete dialog using useTableStyle hook */}
      {tableStyle.BulkDeleteDialog()}

    </PageContainer>
  );
};

export default ReportsDigitalRiskIntelligencePage;
