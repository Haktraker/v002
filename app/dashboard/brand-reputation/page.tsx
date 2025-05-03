'use client';

import React, { ReactNode } from "react";
import { useState, useMemo } from 'react';
import { useGetBrandReputations, useDeleteBrandReputation, useUpdateBrandReputation } from '@/lib/api/endpoints/brand-reputation';
import { Button } from '@/components/ui/button';
import { Pencil, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { BrandReputation, BrandReputationStatus } from '@/lib/api/types';
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
  Row,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BrandReputationPage() {
  const { data: brandReputationData, isLoading, error, refetch } = useGetBrandReputations();
  const deleteBrandReputation = useDeleteBrandReputation();
  const updateBrandReputation = useUpdateBrandReputation();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteBrandReputation.mutateAsync(id);
      refetch();
      toast.success('Brand reputation entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete brand reputation entry:', error);
      toast.error('Failed to delete brand reputation entry');
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
          await deleteBrandReputation.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete brand reputation entry ${id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch();
      } else {
        toast.error('Failed to delete any entries');
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

  const handleUpdate = (brandReputation: BrandReputation) => {
    window.location.href = `/dashboard/brand-reputation/${brandReputation._id}/edit`;
  };

  const handleStatusChange = async (id: string, newStatus: BrandReputationStatus) => {
    setIsUpdating(true);
    try {
      await updateBrandReputation.mutateAsync({
        id,
        status: newStatus
      });
      toast.success('Status updated successfully');
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: BrandReputationStatus) => {
    const variants: Record<string, string> = {
      'taking down': 'destructive',
      'in progress': 'warning',
      'false positive': 'secondary',
      'resolving': 'success'
    };
    
    const variant = variants[status] || 'default';
    
    return (
      <Badge variant={variant as any}>{status}</Badge>
    );
  };

  const statusOptions: BrandReputationStatus[] = [
    'taking down',
    'in progress',
    'false positive',
    'resolving'
  ];

  const tableStyle = useTableStyle<BrandReputation>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['brandName', 'domainName', 'status', 'time', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<BrandReputation>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('brandName', 'Brand Name', {
        isSortable: true,
        cellClassName: 'font-medium',
      }),
      tableStyle.getDefaultColumn('domainName', 'Domain Name', {
        isSortable: true,
      }),
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        cell: ({ row }: { row: Row<BrandReputation> }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 flex items-center gap-1 p-1 w-full justify-start"
                disabled={isUpdating}
              >
                {getStatusBadge(row.original.status)}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className="cursor-pointer"
                  onClick={() => handleStatusChange(row.original._id, status)}
                >
                  {getStatusBadge(status)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        accessorKey: 'incidentDescription',
        header: 'Incident Description',
        cell: ({ row }: { row: Row<BrandReputation> }) => (
          <div className="max-w-md truncate" title={row.original.incidentDescription}>
            {row.original.incidentDescription}
          </div>
        ),
      },
      tableStyle.getDefaultColumn('time', 'Time', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: formatDate,
      }),
      tableStyle.getActionColumn((brandReputation: BrandReputation) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleUpdate(brandReputation)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <tableStyle.DeleteDialog id={brandReputation._id} />
        </>
      )),
    ],
    [isDeleting, isUpdating]
  );

  const table = useReactTable({
    data: Array.isArray(brandReputationData) ? brandReputationData : [],
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
    console.error(error);
    return <div>Error loading brand reputation data</div>;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Brand Reputation</h1>
          <Input
            placeholder="Filter by brand name..."
            value={(table.getColumn("brandName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("brandName")?.setFilterValue(event.target.value)
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
          <Link href="/dashboard/brand-reputation/new">
            <Button>Add New Entry</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}
    </PageContainer>
  );
}
