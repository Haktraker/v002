'use client';

import React from "react";
import { useState, useMemo } from 'react';
import { useIPSAssets, useDeleteIPSAsset } from '@/lib/api/endpoints/assets';
import { Button } from '@/components/ui/button';
import { Pencil, Home } from 'lucide-react';
import { toast } from 'sonner';
import { IPS } from '@/lib/api/types';
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
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

export default function IPsPage() {
  const { data: ipsData, isLoading, error, refetch } = useIPSAssets();
  const deleteIPSAsset = useDeleteIPSAsset();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteIPSAsset.mutateAsync(id);
      refetch();
      toast.success('IP asset deleted successfully');
    } catch (error) {
      console.error('Failed to delete IP asset:', error);
      toast.error('Failed to delete IP asset');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map(row => row.original._id);
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const id of selectedIds) {
        try {
          await deleteIPSAsset.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete IP asset ${id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} IP assets${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch();
      } else {
        toast.error('Failed to delete any IP assets');
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

  const handleUpdate = (ip: IPS) => {
    window.location.href = `/dashboard/assets/ips/${ip._id}/edit`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const tableStyle = useTableStyle<IPS>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['value', 'location', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<IPS>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('value', 'IP Address', {
        isSortable: true,
        cellClassName: 'font-medium',
      }),
      tableStyle.getDefaultColumn('location', 'Location', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('description', 'Description'),
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getActionColumn((ip: IPS) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleUpdate(ip)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <tableStyle.DeleteDialog id={ip._id} />
        </>
      )),
    ],
    [isDeleting]
  );

  const table = useReactTable({
    data: Array.isArray(ipsData) ? ipsData : ipsData?.data || [],
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
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.log(error);
    return <div>Error loading IP assets</div>;
  }

  const { BreadcrumbComponent } = useBreadcrumb();

  return (
    <div className="p-6">
      <BreadcrumbComponent />

      <div className="flex items-center justify-between my-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">IP Assets</h1>
          <Input
            placeholder="Filter IPs..."
            value={(table.getColumn("value")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("value")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" onClick={() => setShowBulkDeleteDialog(true)}>
              Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
          <Link href="/dashboard/assets/ips/new">
            <Button>Add New IP</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}
    </div>
  );
}