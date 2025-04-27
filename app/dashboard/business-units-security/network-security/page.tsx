'use client';

import React, { useState, useMemo } from 'react';
import {
    useGetNetworkSecurities,
    useDeleteNetworkSecurity
} from '@/lib/api/endpoints/business-units-security/network-security'; 
import { NetworkSecurity, NetworkSecurityActivityName } from '@/lib/api/types'; 
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
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

// Define the possible activity names explicitly for column generation
const ACTIVITY_NAMES: NetworkSecurityActivityName[] = [
    "Active Connections",
    "Blocked Traffic",
    "SSL/TLS Traffic",
    "DNS Queries"
];

export default function NetworkSecurityPage() {
  const {
      data: networkSecurityData, 
      isLoading,
      error,
      refetch
  } = useGetNetworkSecurities(); 
  const deleteNetworkSecurityMutation = useDeleteNetworkSecurity();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteNetworkSecurityMutation.mutateAsync(id);
      refetch();
      toast.success('Network Security record deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete network security record:', err);
      toast.error('Failed to delete network security record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    try {
      await Promise.all(selectedIds.map(id => deleteNetworkSecurityMutation.mutateAsync(id)));
      refetch();
      toast.success(`Successfully deleted ${selectedIds.length} record(s)`);
      setRowSelection({});
    } catch (err) {
      console.error('Failed to bulk delete records:', err);
      toast.error('Failed to delete selected records');
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

  const tableStyle = useTableStyle<NetworkSecurity>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<NetworkSecurity>[]>(() => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'font-medium' }),
      // Removed the Business Units column definition
      // {
      //   id: 'businessUnits',
      //   header: 'Business Units',
      //   accessorFn: (row) => row.bu?.map(b => b.buName).join(', ') || 'N/A',
      //   cell: info => {
      //       const buList = info.getValue() as string;
      //       const displayLimit = 50; // Limit display length
      //       return buList.length > displayLimit ? buList.substring(0, displayLimit) + '...' : buList;
      //   },
      //   enableSorting: false,
      // },
       // Dynamically create columns for each activity score, aggregating across BUs
      ...ACTIVITY_NAMES.map((activityName) => ({
        id: activityName.replace(/\W+/g, ''), // Create a unique ID (e.g., ActiveConnections)
        header: activityName,
        // Aggregate scores for this activity across all BUs in the row
        accessorFn: (row: NetworkSecurity) => 
          row.bu?.reduce((sum, currentBu) => {
              const activity = currentBu.activity.find(a => a.activityName === activityName);
              return sum + (activity ? activity.score : 0);
          }, 0), // Start sum at 0
        cell: (info: any) => {
            const totalScore = info.getValue() as number | undefined | null;
            // Display the aggregated score or N/A if calculation resulted in null/undefined
            return totalScore != null ? totalScore.toFixed(1) : <span className="text-muted-foreground">N/A</span>;
        },
        enableSorting: false, // Sorting aggregated data might not be straightforward
      })),
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getActionColumn((record: NetworkSecurity) => (
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
             {/* TODO: Update link when edit page exists */}
            <Link href={`/dashboard/business-units-security/network-security/${record._id}/edit`}>
               <Pencil className="h-4 w-4" aria-label="Edit record" />
            </Link>
          </Button>
           <tableStyle.DeleteDialog id={record._id} />
        </>
      )),
    ], [isDeleting, tableStyle]);

  const table = useReactTable({
    data: Array.isArray(networkSecurityData) ? networkSecurityData : [],
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
    }
  });

  // Loading and Error states
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
    console.error("Error loading Network Security data:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }

  // Main content
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Network Security Records</h1>
           {/* Add Filters here if needed */}
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/business-units-security/network-security/new">
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
