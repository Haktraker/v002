'use client';

import React, { useState, useMemo } from 'react';
import { useGetComplianceRiskDistributions, useDeleteComplianceRiskDistribution } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compilance-risk-distribution';
import { ComplianceRiskDistribution, ComplianceRiskDistributionBu, SeverityName } from '@/lib/api/types';
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
  flexRender,
} from "@tanstack/react-table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ComplianceRiskDistributionPage() {
  const { data: complianceData, isLoading, error, refetch } = useGetComplianceRiskDistributions();
  const deleteMutation = useDeleteComplianceRiskDistribution();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const uniqueBuNames = useMemo(() => {
    if (!complianceData) return [];
    const buSet = new Set<string>();
    complianceData.forEach(entry => {
      entry.bu?.forEach(bu => buSet.add(bu.buName));
    });
    return Array.from(buSet).sort();
  }, [complianceData]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
      toast.success('Compliance risk distribution entry deleted successfully');
      setRowSelection(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete entry:', err);
      toast.error('Failed to delete compliance risk distribution entry');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedIds = Object.keys(rowSelection);
    try {
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      refetch();
      toast.success(`Successfully deleted ${selectedIds.length} entries`);
      setRowSelection({});
    } catch (err) {
      console.error('Failed to bulk delete entries:', err);
      toast.error('Failed to delete selected entries');
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

  const formatBusinessUnits = (buArray?: ComplianceRiskDistributionBu[]): string => {
    if (!buArray || buArray.length === 0) return 'N/A';
    return buArray.map(bu => bu.buName).join(', ');
  };

  const tableStyle = useTableStyle<ComplianceRiskDistribution>({
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
  });

  const columns = useMemo<ColumnDef<ComplianceRiskDistribution>[]>(() => {
    const staticColumns: ColumnDef<ComplianceRiskDistribution>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all rows"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'font-medium' }),
      tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
    ];

    const dynamicBuColumns: ColumnDef<ComplianceRiskDistribution>[] = uniqueBuNames.map(buName => ({
      id: `bu_${buName}`,
      header: buName,
      cell: ({ row }) => {
        const buData = row.original.bu?.find(b => b.buName === buName);
        if (!buData) return <span className="text-muted-foreground">N/A</span>;
        
        let severityColor = 'text-foreground';
        switch(buData.severity.severityName) {
            case 'Critical': severityColor = 'text-red-600'; break;
            case 'High': severityColor = 'text-orange-500'; break;
            case 'Medium': severityColor = 'text-yellow-500'; break;
            case 'Low': severityColor = 'text-green-500'; break;
        }

        return (
          <span className={`${severityColor} font-medium`}>
             {buData.severity.severityName} ({buData.severity.score})
          </span>
        );
      },
      enableSorting: false,
    }));

    staticColumns.splice(3, 0, ...dynamicBuColumns);

    staticColumns.push(tableStyle.getDefaultColumn('createdAt', 'Created At', { isSortable: true, formatter: formatDate }));
    staticColumns.push(tableStyle.getDefaultColumn('updatedAt', 'Updated At', { isSortable: true, formatter: formatDate }));
    staticColumns.push({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
                <Link href={`/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution/${entry._id}/edit`}>
                  <Pencil className="h-4 w-4" aria-label="Edit entry" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" aria-label="Delete entry" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the compliance risk distribution data for {entry.month} {entry.year}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(entry._id)} disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      });

    return staticColumns;
  }, [isDeleting, tableStyle, uniqueBuNames]);

  const table = useReactTable({
    data: Array.isArray(complianceData) ? complianceData : [],
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
                <Skeleton className="h-8 w-64" /> 
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-md" />
        </PageContainer>
    );
  }

  if (error) {
    console.error("Error loading compliance risk distribution:", error);
    return (
        <PageContainer>
            <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
        </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-semibold">Compliance Risk Distribution</h1>
           <Input
            placeholder="Filter by month..."
            value={(table.getColumn("month")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("month")?.setFilterValue(event.target.value)
            }
            className="h-9 max-w-xs"
            aria-label="Filter data by month"
          />
           {/* Add more filters if needed (e.g., by year, BU) */}
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
                      This action cannot be undone. This will permanently delete the selected {Object.keys(rowSelection).length} entries.
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
            {/* Update Link href when add page is available */}
            <Link href="/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution/new">
              Add New Entry
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="[&:has([role=checkbox])]:pl-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="[&:has([role=checkbox])]:pl-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {tableStyle.Pagination({ table })}
    </PageContainer>
  );
}
