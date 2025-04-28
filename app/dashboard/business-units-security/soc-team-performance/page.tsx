'use client';

import React, { useState, useMemo } from 'react';
// No Global Filter
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { useGetSocTeamPerformances, useDeleteSocTeamPerformance } from '@/lib/api/endpoints/business-units-security/soc-team-performance';
// Correct types
import { 
  SocTeamPerformance, 
  SocTeamPerformanceTeam, 
  SocTeamPerformanceBuDetail 
} from '@/lib/api/types'; 
import { Button } from '@/components/ui/button';
// No Input filter needed for this layout
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
} from "@tanstack/react-table";
import { useTableStyle } from '@/hooks/use-table-style';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export default function SocTeamPerformanceListPage() {
  // No global filter

  // Fetch all data
  const {
    data: performanceData, 
    isLoading,
    error,
    refetch
  } = useGetSocTeamPerformances(); 

  const deletePerformance = useDeleteSocTeamPerformance();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'year', desc: true }, { id: 'month', desc: true }]); 
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Data is used directly from fetch hook
  const tableData = useMemo(() => {
    return Array.isArray(performanceData) ? performanceData : [];
  }, [performanceData]);

  const handleDelete = async (id: string) => {
    // id is the record _id
    setIsDeleting(true);
    try {
      await deletePerformance.mutateAsync(id);
      refetch();
      toast.success('Record deleted successfully');
      setRowSelection(prev => {
          const { [id]: _, ...rest } = prev;
          return rest;
      });
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRecordIds = Object.keys(rowSelection);
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const id of selectedRecordIds) {
        try {
          await deletePerformance.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete record ${id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch();
      } else {
        toast.error('Failed to delete any records');
      }
    } catch (error) {
      console.error('Bulk deletion failed:', error);
      toast.error('Bulk deletion process failed');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
      setRowSelection({});
    }
  };

  const handleUpdate = (record: SocTeamPerformance) => {
    window.location.href = `/dashboard/business-units-security/soc-team-performance/${record._id}/edit`;
  };

  const tableStyle = useTableStyle<SocTeamPerformance>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year'],
    onDelete: handleDelete, 
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  // Columns definition similar to the original Risk Assessment layout
  const columns = useMemo<ColumnDef<SocTeamPerformance>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', {
        isSortable: true,
        cellClassName: 'w-24',
      }),
      tableStyle.getDefaultColumn('month', 'Month', {
        isSortable: true,
        cellClassName: 'w-32',
      }),
      {
        accessorKey: 'socTeam',
        header: 'Teams & Metrics by BU',
        cell: ({ row }) => {
          const teams = row.original.socTeam;
          if (!teams || teams.length === 0) return <span className="text-muted-foreground">N/A</span>;

          const firstTeam = teams[0];
          const remainingTeams = teams.slice(1);

          const renderBuDetails = (bu: SocTeamPerformanceBuDetail, index: number, isPopover: boolean) => (
            <Badge 
              key={bu.buName || index} 
              variant={isPopover ? "outline" : "secondary"} 
              className={`whitespace-nowrap h-auto mb-1 ${isPopover ? 'text-[10px]' : 'text-xs'}`}
            >
              <div className="flex flex-col items-start p-1"> 
                <span className="font-semibold mb-0.5">{bu.buName || 'Unnamed BU'}</span>
                <span>Res: {bu.resolutionRate?.toFixed(1) ?? 'N/A'}%</span>
                <span>Acc: {bu.accuracy?.toFixed(1) ?? 'N/A'}%</span>
                <span>Inc: {bu.incidentsHandled ?? 'N/A'}</span>
              </div>
            </Badge>
          );

          return (
            <div className="flex flex-col gap-2 max-w-lg">
              {/* First Team Display */}
              <div className="flex flex-col gap-1">
                <span className="font-medium">{firstTeam.teamName || 'Unnamed Team'}</span>
                <div className="flex items-start gap-1 flex-wrap">
                  {firstTeam.bu?.map((bu, idx) => renderBuDetails(bu, idx, false))}
                  {(!firstTeam.bu || firstTeam.bu.length === 0) && <span className="text-xs text-muted-foreground">No BUs</span>}
                </div>
              </div>

              {/* Popover for Remaining Teams */}
              {remainingTeams.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs self-start">+{remainingTeams.length} more teams...</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3 max-h-80 overflow-y-auto">
                    <div className="flex flex-col gap-3">
                      {remainingTeams.map((team: SocTeamPerformanceTeam, index: number) => (
                        <div key={team.teamName || index} className="flex flex-col gap-1 border-b pb-2 last:border-b-0">
                          <span className="font-semibold text-sm mb-1">{team.teamName || 'Unnamed Team'}</span>
                          <div className="flex items-start gap-1 flex-wrap">
                             {team.bu?.map((bu, idx) => renderBuDetails(bu, idx, true))}
                             {(!team.bu || team.bu.length === 0) && <span className="text-[10px] text-muted-foreground">No BUs</span>}
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
      tableStyle.getActionColumn((record: SocTeamPerformance) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleUpdate(record)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <tableStyle.DeleteDialog id={record._id} /> 
        </>
      )),
    ],
    [isDeleting, tableStyle]
  );

  const table = useReactTable({
    data: tableData,
    columns: columns, 
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Keep for potential future use
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters, // Keep for potential future use
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    initialState: { 
        pagination: { pageSize: 10 },
        sorting: [{ id: 'year', desc: true }, { id: 'month', desc: true }] 
    },
    getRowId: (row) => row._id, // Use _id for selection state key
  });

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="SOC Team Performance" />
        {/* Simplified Loading state */}
        <div className="flex items-center justify-between my-6">
          <Skeleton className="h-8 w-60" /> 
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-md" /> 
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="SOC Team Performance" />
        <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md mt-6">
          Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="SOC Team Performance" />
      
      <div className="flex items-center justify-between my-6">
        <h2 className="text-xl font-semibold">Monthly Performance Records</h2>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)}>
              Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
          <Link href="/dashboard/business-units-security/soc-team-performance/new">
            <Button>Add New Record</Button>
          </Link>
        </div>
      </div>

      {/* Use standard table rendering */}
      {tableStyle.renderTable(table)}
      <div className="mt-4">
        {tableStyle.Pagination({ table })}
      </div>
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}
