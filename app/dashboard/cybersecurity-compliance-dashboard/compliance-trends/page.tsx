'use client';

import React, { useState, useMemo } from 'react';
import { useGetComplianceTrends, useDeleteComplianceTrend } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compliance-trend';
import { ComplianceTrend } from '@/lib/api/types';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { BU_LIST } from '@/lib/constants/bu-list';
import { MONTHS } from '@/lib/constants/months-list';

export default function ComplianceTrendsPage() {
  const { data: complianceTrends, isLoading, error, refetch } = useGetComplianceTrends();
  const deleteTrendMutation = useDeleteComplianceTrend();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteTrendMutation.mutateAsync(id);
      refetch();
      toast.success('Compliance trend deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete compliance trend:', err);
      toast.error('Failed to delete compliance trend');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    try {
      await Promise.all(selectedIds.map(id => deleteTrendMutation.mutateAsync(id)));
      refetch();
      toast.success(`Successfully deleted ${selectedIds.length} compliance trend(s)`);
      setRowSelection({});
    } catch (err) {
      console.error('Failed to bulk delete compliance trends:', err);
      toast.error('Failed to delete selected compliance trends');
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

  const tableStyle = useTableStyle<ComplianceTrend>({
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
  });

  const columns = useMemo<ColumnDef<ComplianceTrend>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || 
                    (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'font-medium' }),
      {
        id: 'buName',
        header: 'Business Unit',
        accessorFn: (row) => row.bu?.[0]?.bu_name || 'N/A', 
        cell: info => info.getValue(),
        enableSorting: false,
        enableColumnFilter: true,
      },
      {
        id: 'isoScore',
        header: 'ISO 27001',
        accessorFn: (row) => 
          row.bu?.[0]?.compliance.find(c => c.complianceName === 'ISO 27001')?.complianceScore,
        cell: info => info.getValue() ?? 'N/A',
        enableSorting: false,
      },
      {
        id: 'nistScore',
        header: 'NIST CSF',
        accessorFn: (row) => 
          row.bu?.[0]?.compliance.find(c => c.complianceName === 'NIST CSF')?.complianceScore,
        cell: info => info.getValue() ?? 'N/A',
        enableSorting: false,
      },
      {
        id: 'pdplScore',
        header: 'PDPL',
        accessorFn: (row) => 
          row.bu?.[0]?.compliance.find(c => c.complianceName === 'PDPL')?.complianceScore,
        cell: info => info.getValue() ?? 'N/A',
        enableSorting: false,
      },
      {
        id: 'cisScore',
        header: 'CIS Controls',
        accessorFn: (row) => 
          row.bu?.[0]?.compliance.find(c => c.complianceName === 'CIS Controls')?.complianceScore,
        cell: info => info.getValue() ?? 'N/A',
        enableSorting: false,
      },
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const trend = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
                <Link href={`/dashboard/cybersecurity-compliance-dashboard/compliance-trends/${trend._id}/edit`}>
                   <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this compliance trend data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(trend._id)} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    [isDeleting, tableStyle]
  );

  const table = useReactTable({
    data: Array.isArray(complianceTrends) ? complianceTrends : [],
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

  if (isLoading) {
    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-8 w-48" /> 
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[400px] w-full" />
        </PageContainer>
    );
  }

  if (error) {
    console.error("Error loading compliance trends:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading compliance trends: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }
  
  const currentBuFilter = columnFilters.find(f => f.id === 'buName')?.value as string || '';
  const currentMonthFilter = columnFilters.find(f => f.id === 'month')?.value as string || '';

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Compliance Trends</h1>
          {/* <Select 
            value={currentMonthFilter}
            onValueChange={(value) => {
              table.getColumn('month')?.setFilterValue(value === '' ? undefined : value);
            }}
          >
            <SelectTrigger className="h-9 w-[150px]">
               <SelectValue placeholder="Filter by Month..." />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={currentBuFilter}
            onValueChange={(value) => {
              table.getColumn('buName')?.setFilterValue(value === '' ? undefined : value);
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
               <SelectValue placeholder="Filter by Business Unit..." />
            </SelectTrigger>
            <SelectContent>
              {BU_LIST.map((bu) => (
                <SelectItem key={bu} value={bu}>{bu}</SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
        
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({Object.keys(rowSelection).length})
                </Button>
              </AlertDialogTrigger>
               <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the selected {Object.keys(rowSelection).length} compliance trend(s).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
          <Button asChild size="sm">
            <Link href="/dashboard/cybersecurity-compliance-dashboard/compliance-trends/new">
              Add New Trend
            </Link>
          </Button>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
    </PageContainer>
  );
}
