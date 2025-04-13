'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { useGetComplianceScores, useDeleteComplianceScore } from '@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores';
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
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';

type ComplianceData = {
    _id: string;
  month: string;
  year: string;
  bu: Array<{
    buName: string;
    compliances: Array<{
      complianceName: string;
      count: number;
    }>;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export default function ComplianceScoresPage() {
  const { data: complianceScores, isLoading, error, refetch } = useGetComplianceScores();
  const deleteMention = useDeleteComplianceScore();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

//   const handleBulkDelete = async () => {
//     setIsDeleting(true);
//     try {
//       const selectedIds = Object.keys(rowSelection);
//       await Promise.all(selectedIds.map(id => deleteMention.mutateAsync(id)));
//       refetch();
//       toast.success('Selected compliance scores deleted successfully');
//       setRowSelection({});
//     } catch (error) {
//       console.error('Failed to delete selected compliance scores:', error);
//       toast.error('Failed to delete selected compliance scores');
//     } finally {
//       setIsDeleting(false);
//       setShowBulkDeleteDialog(false);
//     }
//   };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteMention.mutateAsync(id);
      refetch();
      toast.success('Compliance score deleted successfully');
    } catch (error) {
      console.error('Failed to delete compliance score:', error);
      toast.error('Failed to delete compliance score');
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
      toast.success('Selected compliance scores deleted successfully');
      setRowSelection({});
    } catch (error) {
      console.error('Failed to delete selected compliance scores:', error);
      toast.error('Failed to delete selected compliance scores');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const tableStyle = useTableStyle<ComplianceData>({
    enableSorting: true,
    sortableColumns: ['month', 'year', 'createdAt', 'updatedAt'],
  });

  const columns = useMemo<ColumnDef<ComplianceData>[]>(
    () => [
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
      tableStyle.getDefaultColumn('year', 'Year', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('month', 'Month', {
        isSortable: true,
        cellClassName: 'font-medium',
      }),
      {
        accessorFn: (row) => {
          const pci = row.bu.flatMap(b => 
            b.compliances.find(c => c.complianceName === 'PCI')?.count || 0
          )[0];
          return pci;
        },
        id: 'pci',
        header: 'PCI',
      },
      {
        accessorFn: (row) => {
          const hipaa = row.bu.flatMap(b => 
            b.compliances.find(c => c.complianceName === 'HIPAA')?.count || 0
          )[0];
          return hipaa;
        },
        id: 'hipaa',
        header: 'HIPAA',
      },
      {
        accessorFn: (row) => {
          const gdrr = row.bu.flatMap(b => 
            b.compliances.find(c => c.complianceName === 'GDRR')?.count || 0
          )[0];
          return gdrr;
        },
        id: 'gdrr',
        header: 'GDRR',
      },
      {
        accessorFn: (row) => {
          const iso = row.bu.flatMap(b => 
            b.compliances.find(c => c.complianceName === 'ISO')?.count || 0
          )[0];
          return iso;
        },
        id: 'iso',
        header: 'ISO',
      },
      {
        accessorFn: (row) => {
          const nist = row.bu.flatMap(b => 
            b.compliances.find(c => c.complianceName === 'NIST')?.count || 0
          )[0];
          return nist;
        },
        id: 'nist',
        header: 'NIST',
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
          const complianceScore = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = `/dashboard/security-breach-indicators/compliance-scores/${complianceScore._id}/edit`}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
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
                      This action cannot be undone. This will permanently delete the compliance score.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(complianceScore._id)} disabled={isDeleting}>
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
    [isDeleting]
  );

  const table = useReactTable({
    data: Array.isArray(complianceScores) ? complianceScores : [],
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
    return <div>Error loading compliance scores</div>;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Compliance Scores</h1>
          <Input
            placeholder="Filter by month..."
            value={(table.getColumn("month")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("month")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected compliance scores.
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
          <Link href="/dashboard/security-breach-indicators/compliance-scores/new">
            <Button>Add New Score</Button>
          </Link>
        </div>
      </div>
      </div>



      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
    </PageContainer>
  );
}