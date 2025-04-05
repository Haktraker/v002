'use client';

import React from "react";
import { useState, useMemo } from 'react';
import { useGetDarkWebMentions, useDeleteDarkWebMention, useUpdateDarkWebMention } from '@/lib/api/endpoints/dark-web-monitoring/dark-web-mention';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { DarkWebMention, DarkWebMentionType, DarkWebMentionStatus } from '@/lib/api/types';
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
  flexRender,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DarkWebMentionsPage() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type') as DarkWebMentionType | null;
  
  const { data: mentions, isLoading, error, refetch } = useGetDarkWebMentions({ type: typeFilter || undefined });
  const deleteMention = useDeleteDarkWebMention();
  const updateMention = useUpdateDarkWebMention();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteMention.mutateAsync(id);
      refetch();
      toast.success('Dark web mention deleted successfully');
    } catch (error) {
      console.error('Failed to delete dark web mention:', error);
      toast.error('Failed to delete dark web mention');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const selectedIds = Object.keys(rowSelection);
      await Promise.all(selectedIds.map(id => deleteMention.mutateAsync(id)));
      refetch();
      toast.success('Selected mentions deleted successfully');
      setRowSelection({});
    } catch (error) {
      console.error('Failed to delete selected mentions:', error);
      toast.error('Failed to delete selected mentions');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: DarkWebMentionStatus) => {
    try {
      await updateMention.mutateAsync({
        id,
        data: { status: newStatus }
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const { getHeaderContent } = useTableStyle<DarkWebMention>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ["type", "asset", "source", "impactEvaluation", "status", "chronologyTags"],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<DarkWebMention>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
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
    },
    {
      accessorKey: "type",
      header: ({ column }) => getHeaderContent(column, "Type"),
      cell: ({ row }) => (
        <p title={row.getValue("type")} className="capitalize">
          {row.getValue("type")}
        </p>
      ),
    },
    {
      accessorKey: "asset",
      header: ({ column }) => getHeaderContent(column, "Asset"),
    },
    {
      accessorKey: "source",
      header: ({ column }) => getHeaderContent(column, "Source"),
    },
    {
      accessorKey: "impactEvaluation",
      header: ({ column }) => getHeaderContent(column, "Impact"),
      cell: ({ row }) => {
        const impact = row.getValue("impactEvaluation") as string;
        return (
          <p title={impact} className="truncate">
            {impact}
          </p>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => getHeaderContent(column, "Status"),
      cell: ({ row }) => {
        const mention = row.original as DarkWebMention;
        return (
          <Select
            value={mention.status}
            onValueChange={(value: DarkWebMentionStatus) => handleStatusChange(mention._id, value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "chronologyTags",
      header: ({ column }) => getHeaderContent(column, "chronologyTags"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const mention = row.original;

        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/dark-web-monitoring/dark-web-mentions/${mention._id}/edit`}>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the dark web mention.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(mention._id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ], [getHeaderContent]);

  const table = useReactTable({
    data: mentions || [],
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

  if (error) {
    return (
      <PageContainer>
        <div className="text-center text-destructive">
          Error loading dark web mentions
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dark Web Mentions</h1>
        <Link href="/dashboard/dark-web-monitoring/dark-web-mentions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Mention
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter mentions by asset"
          value={(table.getColumn("asset")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("asset")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {Object.keys(rowSelection).length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowBulkDeleteDialog(true)}
            disabled={isDeleting}
          >
            Delete Selected
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No dark web mentions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {Object.keys(rowSelection).length} selected mentions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}