'use client';

import { useState, useMemo } from 'react';
import { useIPSAssets, useDeleteIPSAsset } from '@/lib/api/endpoints/assets';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { IPS } from '@/lib/api/types';
import Link from 'next/link';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function IPsPage() {
  const { data: ipsData, isLoading, error, refetch } = useIPSAssets();
  const deleteIPSAsset = useDeleteIPSAsset();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleDelete = async (id: string) => {
    console.log(id,'id');
    
    setIsDeleting(true);
    try {
      await deleteIPSAsset.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'IP asset deleted successfully',
      });
      refetch();
    } catch (error) {
      console.error('Failed to delete IP asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete IP asset',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = (ip: IPS) => {
    // Redirect to update page or open modal
    window.location.href = `/assets/ips/${ip._id}/edit`;
  };

  // Helper function to format dates safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Define columns for the data table
  const columns = useMemo<ColumnDef<IPS>[]>(
    () => [
      {
        accessorKey: "value",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Value
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue("value")}</div>,
      },
      {
        accessorKey: "location",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Location
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        },
      },
      {
        accessorKey: "description",
        header: "Description",
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Created At
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => formatDate(row.getValue("createdAt")),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Updated At
              {column.getIsSorted() === "asc" ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => formatDate(row.getValue("updatedAt")),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const ip = row.original;
          
          return (
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleUpdate(ip)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the IP asset.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(row.original._id)}
                      disabled={isDeleting}
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
    ],
    []
  );

  // Prepare data for the table
  const data = useMemo(() => {
    if (!ipsData) return [];
    return Array.isArray(ipsData) ? ipsData : [];
  }, [ipsData]);

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading IP assets</div>;
  }

  return (
    <div className="container mx-auto py-10 my-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">IP Assets</h1>
        <Link href="ips/new">
            <Button>
              Add New IP
            </Button>
        </Link>
      </div>
      
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by value..."
          value={(table.getColumn("value")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("value")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
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
            {table.getRowModel().rows?.length ? (
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No IP assets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} asset(s) total
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}