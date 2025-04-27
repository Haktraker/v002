'use client';

import React, { useState, useMemo } from 'react';
import {
    useGetRiskAssessmentsByBu,
    useDeleteRiskAssessmentByBu
} from '@/lib/api/endpoints/business-units-security/risk-assessment-by-bu'; 
import { RiskAssessmentByBu, RiskAssessmentBu, RiskAssessmentSeverity, SeverityLevelName } from '@/lib/api/types'; 
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
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
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
// Import the chart component
import RiskAssessmentByBuChart from '@/components/dashboard/risk-assessment-by-bu-chart';

// Define severity levels and corresponding colors/classes for consistency
const SEVERITY_LEVELS_ORDER: SeverityLevelName[] = ["Critical", "High", "Medium", "Low"];
// Map severities to available Badge variants
const SEVERITY_BADGE_VARIANT: { [key in SeverityLevelName]: string} = {
    Critical: '#dc2626', // Red-600
    High: '#f97316',     // Orange-500
    Medium: '#facc15',   // Yellow-400
    Low: '#3b82f6'       // Blue-500    // Using 'secondary' for Low
};

export default function RiskAssessmentByBuPage() {
  const {
      data: assessmentData,
      isLoading,
      error,
      refetch
  } = useGetRiskAssessmentsByBu(); 
  const deleteAssessmentMutation = useDeleteRiskAssessmentByBu();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteAssessmentMutation.mutateAsync(id);
      refetch(); 
      toast.success('Risk Assessment record deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.info("No records selected.");
      setIsDeleting(false);
      return;
    }
    try {
      await Promise.all(selectedIds.map(id => deleteAssessmentMutation.mutateAsync(id)));
      refetch();
      toast.success(`Successfully deleted ${selectedIds.length} record(s)`);
      setRowSelection({});
    } catch (err) {
      console.error('Failed to bulk delete records:', err);
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; }
  };

  const tableStyle = useTableStyle<RiskAssessmentByBu>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<RiskAssessmentByBu>[]>(() => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
      {
        accessorKey: 'bu',
        header: 'Business Units & Severities',
        cell: ({ row }) => {
          const bus = row.original.bu;
          if (!bus || bus.length === 0) return <span className="text-muted-foreground">N/A</span>;

          const displayBuCount = 1; // Show details for the first BU
          const displayedBus = bus.slice(0, displayBuCount);
          const remainingBuCount = bus.length - displayBuCount;

          return (
            <div className="flex flex-col gap-2 max-w-md">
              {displayedBus.map((bu, index) => (
                <div key={bu._id || index} className="flex flex-col gap-1">
                  <span className="font-medium">{bu.name || 'Unnamed BU'}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                     {bu.severities?.sort((a, b) => SEVERITY_LEVELS_ORDER.indexOf(a.severity) - SEVERITY_LEVELS_ORDER.indexOf(b.severity))
                       .map((sev, sevIndex) => (
                        <Badge 
                            key={sev._id || sevIndex} 
                            style={{ 
                                backgroundColor: SEVERITY_BADGE_VARIANT[sev.severity],
                                color: 'white'
                            }}
                            className="whitespace-nowrap px-2 py-0.5 text-xs"
                        >
                           {sev.severity}: {sev.count}
                         </Badge>
                      ))}
                      {(!bu.severities || bu.severities.length === 0) && <span className="text-xs text-muted-foreground">No severities</span>}
                  </div>
                </div>
              ))}
              {remainingBuCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">+{remainingBuCount} more BUs...</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3 max-h-60 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                      {bus.slice(displayBuCount).map((bu, index) => (
                        <div key={bu._id || index} className="flex flex-col gap-1 text-xs border-b pb-1 last:border-b-0">
                           <span className="font-semibold">{bu.name || 'Unnamed BU'}</span>
                           <div className="flex items-center gap-1 flex-wrap">
                               {bu.severities?.sort((a, b) => SEVERITY_LEVELS_ORDER.indexOf(a.severity) - SEVERITY_LEVELS_ORDER.indexOf(b.severity))
                                .map((sev, sevIndex) => (
                                  <Badge 
                                      key={sev._id || sevIndex} 
                                      style={{
                                          backgroundColor: SEVERITY_BADGE_VARIANT[sev.severity],
                                          color: 'white'
                                      }} 
                                      className="whitespace-nowrap text-[10px] px-1 py-0.5"
                                  >
                                     {sev.severity}: {sev.count}
                                   </Badge>
                                ))}
                                {(!bu.severities || bu.severities.length === 0) && <span className="text-[10px] text-muted-foreground">No severities</span>}
                           </div>
                         </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      tableStyle.getDefaultColumn('createdAt', 'Created At', { isSortable: true, formatter: formatDate }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', { isSortable: true, formatter: formatDate }),
      tableStyle.getActionColumn((record: RiskAssessmentByBu) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
            <Link href={`/dashboard/business-units-security/risk-assessment-by-bu/${record._id}/edit`}>
               <Pencil className="h-4 w-4" aria-label="Edit record" />
            </Link>
          </Button>
           <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: Array.isArray(assessmentData) ? assessmentData : [],
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
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
  });

  if (isLoading) {
    return (
        <PageContainer>
             {/* Simplified Loading state */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-60" /> 
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-md mb-8" /> {/* Placeholder for chart */}
            <Skeleton className="h-[400px] w-full rounded-md" /> {/* Placeholder for table */}
        </PageContainer>
    );
  }

  if (error) {
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }
  
  const chartData = Array.isArray(assessmentData) ? assessmentData : [];

  return (
    <PageContainer>
      {/* Chart Section */}
      
      {chartData.length > 0 && (
         <div className="mb-8">
            {/* <h2 className="text-xl font-semibold mb-4">Risk Assessment Overview</h2> */}
             {/* Use chart component */}
             {/* <RiskAssessmentByBuChart data={chartData} /> */}
         </div>
      )}
      
      {/* Table Section */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Risk Assessment Records</h1>
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/business-units-security/risk-assessment-by-bu/new">
              Add New Record
            </Link>
          </Button>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
    </PageContainer>
  );
}
