'use client';

import React, { useState, useMemo } from 'react';
import {
    useGetCompanyRiskScores,
    useDeleteCompanyRiskScore
} from '@/lib/api/endpoints/business-units-security/company-risk-scores'; 
import { CompanyRiskScore, CompanyRiskScoreBu } from '@/lib/api/types'; 
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
// Import the chart component (assuming path)
import CompanyRiskScoresChart from '@/components/dashboard/company-risk-scores-chart';

export default function CompanyRiskScoresPage() {
  const {
      data: scoresData,
      isLoading,
      error,
      refetch
  } = useGetCompanyRiskScores(); 
  const deleteScoreMutation = useDeleteCompanyRiskScore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteScoreMutation.mutateAsync(id);
      refetch(); // Refetch data after deletion
      toast.success('Company Risk Score record deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete Company Risk Score record:', err);
      // Error toast is likely handled by the mutation hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.info("No records selected.")
      setIsDeleting(false);
      return;
    }
    try {
      await Promise.all(selectedIds.map(id => deleteScoreMutation.mutateAsync(id)));
      refetch(); // Refetch data after bulk deletion
      toast.success(`Successfully deleted ${selectedIds.length} record(s)`);
      setRowSelection({}); // Clear selection
    } catch (err) {
      console.error('Failed to bulk delete records:', err);
      // Error toast is likely handled by the mutation hook
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const tableStyle = useTableStyle<CompanyRiskScore>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<CompanyRiskScore>[]>(() => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true }),
      {
        accessorKey: 'bus',
        header: 'Business Units',
        cell: ({ row }) => {
          const bus = row.original.bus;
          if (!bus || bus.length === 0) return <span className="text-muted-foreground">N/A</span>;

          const displayCount = 2; // Show first 2 BUs directly
          const displayedBus = bus.slice(0, displayCount);
          const remainingCount = bus.length - displayCount;

          return (
            <div className="flex items-center gap-1 flex-wrap max-w-xs">
              {displayedBus.map((bu, index) => (
                <Badge key={bu._id || index} variant="secondary" className="whitespace-nowrap">
                  {bu.name}: {bu.count}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">+{remainingCount} more</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="flex flex-col gap-1">
                      {bus.slice(displayCount).map((bu, index) => (
                         <Badge key={bu._id || index} variant="secondary" className="whitespace-nowrap">
                           {bu.name}: {bu.count}
                         </Badge>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        },
        enableSorting: false, // Sorting on complex array object is non-trivial
      },
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getActionColumn((record: CompanyRiskScore) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
             {/* TODO: Update link when edit page exists */}
            <Link href={`/dashboard/business-units-security/company-risk-scores/${record._id}/edit`}>
               <Pencil className="h-4 w-4" aria-label="Edit record" />
            </Link>
          </Button>
           <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: Array.isArray(scoresData) ? scoresData : [],
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
    initialState: {
        pagination: {
            pageSize: 10, 
        }
    },
    enableRowSelection: true,
  });

  if (isLoading) {
    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-md" />
        </PageContainer>
    );
  }

  if (error) {
    console.error("Error loading Company Risk Scores data:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }
  
  const chartData = Array.isArray(scoresData) ? scoresData : [];

  return (
    <PageContainer>
      {/* Chart Section */}
      {/* {chartData.length > 0 && (
         <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Risk Score Distribution</h2>
            <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm h-[400px]">
               <CompanyRiskScoresChart data={chartData} />
            </div>
         </div>
      )} */}
      
      {/* Table Section */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Company Risk Scores Records</h1>
           {/* Add Filters here if needed */}
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/business-units-security/company-risk-scores/new">
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
