'use client';

import React, { useState, useMemo } from 'react';
import {
    useGetSocTeamPerformances,
    useDeleteSocTeamPerformance,
} from '@/lib/api/endpoints/business-units-security/soc-team-performance';
import { SocTeamPerformanceTeam, SocTeamPerformanceBuDetail, SocTeamPerformance } from '@/lib/api/types';
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
import SocTeamPerformanceChart from '@/components/dashboard/soc-team-performance-chart'; // Import chart

// Helper to format percentages
const formatPercentage = (value?: number) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
};

export default function SocTeamPerformancePage() {
  const {
      data: performanceData,
      isLoading,
      error,
      refetch
  } = useGetSocTeamPerformances(); 
  const deleteMutation = useDeleteSocTeamPerformance();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try { await deleteMutation.mutateAsync(id); refetch(); toast.success('Record deleted'); setRowSelection(prev => { const { [id]: _, ...rest } = prev; return rest; }); }
    catch (err) { console.error('Delete failed:', err); }
    finally { setIsDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) { toast.info("No records selected."); setIsDeleting(false); return; }
    try { await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id))); refetch(); toast.success(`Deleted ${selectedIds.length} record(s)`); setRowSelection({}); }
    catch (err) { console.error('Bulk delete failed:', err); }
    finally { setIsDeleting(false); setShowBulkDeleteDialog(false); }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; }
  };

  const tableStyle = useTableStyle<SocTeamPerformance>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<SocTeamPerformance>[]>(() => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
      {
        accessorKey: 'socTeam',
        header: 'Team Performance Details',
        cell: ({ row }) => {
          const teams = row.original.socTeam;
          if (!teams || teams.length === 0) return <span className="text-muted-foreground">N/A</span>;

          const displayTeamCount = 1; // Show details for the first team only in main cell
          const displayedTeams = teams.slice(0, displayTeamCount);
          const remainingTeamCount = teams.length - displayTeamCount;

          return (
            <div className="flex flex-col gap-3 max-w-lg">
              {displayedTeams.map((team, index) => (
                <div key={team._id || index} className="text-xs">
                  <span className="font-semibold text-sm block mb-1">{team.teamName || 'Unnamed Team'}</span>
                   {/* Show BU details within a popover for the first team */} 
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                           Show {team.bu?.length || 0} BU Detail(s)
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0">
                         <BuDetailsTable buData={team.bu} />
                     </PopoverContent>
                   </Popover>
                </div>
              ))}
              {/* Popover for remaining teams */}
              {remainingTeamCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">+{remainingTeamCount} more team(s)...</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3 max-h-80 overflow-y-auto">
                    <div className="flex flex-col gap-4">
                      {teams.slice(displayTeamCount).map((team, index) => (
                        <div key={team._id || index} className="text-xs border-b pb-2 last:border-b-0">
                           <span className="font-semibold text-sm block mb-1">{team.teamName || 'Unnamed Team'}</span>
                            <BuDetailsTable buData={team.bu} />
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
      tableStyle.getActionColumn((record: SocTeamPerformance) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
            <Link href={`/dashboard/business-units-security/soc-team-performance/${record._id}/edit`}>
               <Pencil className="h-4 w-4" aria-label="Edit record" />
            </Link>
          </Button>
           <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: Array.isArray(performanceData) ? performanceData : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
  });

  // Loading and Error States
  if (isLoading) {
    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-6"><Skeleton className="h-8 w-60" /><Skeleton className="h-10 w-36" /></div>
            <Skeleton className="h-[400px] w-full rounded-md mb-8" />
            <Skeleton className="h-[400px] w-full rounded-md" />
        </PageContainer>
    );
  }
  if (error) {
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</div>
        </PageContainer>
    );
  }
  
  // Flatten the socTeam arrays from all performance records for the chart
  const chartData: SocTeamPerformanceTeam[] = useMemo(() => {
    if (!Array.isArray(performanceData)) return [];
    // Use flatMap to extract and flatten the socTeam arrays
    return performanceData.flatMap(record => record.socTeam || []); 
  }, [performanceData]);

  return (
    <PageContainer>
      {/* Chart Section */}
      {chartData.length > 0 && (
         <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">SOC Team Performance Overview</h2>
             <SocTeamPerformanceChart data={chartData} /> 
         </div>
      )}
      
      {/* Table Section */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap"><h1 className="text-2xl font-semibold">SOC Team Performance Records</h1></div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && <tableStyle.BulkDeleteDialog />}
          <Button asChild size="sm"><Link href="/dashboard/business-units-security/soc-team-performance/new">Add New Record</Link></Button>
        </div>
      </div>
      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
    </PageContainer>
  );
}

// Helper component to display BU details in a table within Popover
function BuDetailsTable({ buData }: { buData?: SocTeamPerformanceBuDetail[] }) {
    if (!buData || buData.length === 0) {
        return <span className="text-xs text-muted-foreground">No BU details available.</span>;
    }
    return (
        <table className="w-full text-xs">
            <thead>
                <tr className="border-b">
                    <th className="text-left font-medium text-muted-foreground p-1.5">BU Name</th>
                    <th className="text-right font-medium text-muted-foreground p-1.5">Res. Rate</th>
                    <th className="text-right font-medium text-muted-foreground p-1.5">Accuracy</th>
                    <th className="text-right font-medium text-muted-foreground p-1.5">Inc. Handled</th>
                </tr>
            </thead>
            <tbody>
                {buData.map((bu, index) => (
                    <tr key={bu._id || index} className="border-b last:border-b-0">
                        <td className="p-1.5 font-medium">{bu.buName}</td>
                        <td className="p-1.5 text-right">{formatPercentage(bu.resolutionRate)}</td>
                        <td className="p-1.5 text-right">{formatPercentage(bu.accuracy)}</td>
                        <td className="p-1.5 text-right">{bu.incidentsHandled}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
