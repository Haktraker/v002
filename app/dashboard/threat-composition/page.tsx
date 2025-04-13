'use client'
import { useState, useMemo } from 'react';
import { ThreatCompositionHeatmap } from '@/components/dashboard/threat-composition-heatmap';
import { PageContainer } from "@/components/layout/page-container";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetThreatCompositions, useDeleteThreatComposition } from "@/lib/api/endpoints/threat-composition/threatcomposition";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTableStyle } from "@/hooks/use-table-style";
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
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
} from "@/components/ui/alert-dialog";

export default function ThreatComposition() {
  const { data: threatCompositionData, error, refetch, isLoading } = useGetThreatCompositions();
  const deleteThreatComposition = useDeleteThreatComposition();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteThreatComposition.mutateAsync(id);
      refetch();
      toast.success('Threat composition deleted successfully');
    } catch (error) {
      console.error('Failed to delete threat composition:', error);
      toast.error('Failed to delete threat composition');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const selectedIds = Object.keys(rowSelection);
      await Promise.all(selectedIds.map(id => deleteThreatComposition.mutateAsync(id)));
      refetch();
      toast.success('Selected compositions deleted successfully');
      setRowSelection({});
    } catch (error) {
      console.error('Failed to delete selected compositions:', error);
      toast.error('Failed to delete selected compositions');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };
  
  const tableStyle = useTableStyle({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year', 'severityLevel', 'threatType', 'attackVector', 'bu', 'affectedAsset', 'incidentCount'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const handleUpdate = (composition: any) => {
    window.location.href = `/dashboard/threat-composition/${composition._id}/edit`;
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('month', 'Month', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('year', 'Year', {
        isSortable: true,
      }),
      // tableStyle.getDefaultColumn('_id', 'ID'),
      tableStyle.getDefaultColumn('severityLevel', 'Severity Level', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('threatType', 'Threat Type', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('attackVector', 'Attack Vector', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('bu', 'BU', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('affectedAsset', 'Affected Asset', {
        isSortable: true,
      }),
      tableStyle.getDefaultColumn('incidentCount', 'Incident Count', {
        isSortable: true,
      }),
      tableStyle.getActionColumn((composition: any) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleUpdate(composition)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this threat composition.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(composition._id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )),
    ],
    [isDeleting]
  );

  const table = useReactTable({
    data: threatCompositionData || [],
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
    console.log(error);
    return <div>Error loading threat composition data</div>;
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Threat Composition</h1>
          <Input
            placeholder="Filter threat compositions..."
            value={(table.getColumn("threatType")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("threatType")?.setFilterValue(event.target.value)
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
          <Link href="/dashboard/threat-composition/new">
            <Button>Add New</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {tableStyle.renderTable(table)}
          {tableStyle.Pagination({ table })}
          {tableStyle.BulkDeleteDialog()}
          
          <div className="mt-8">
            <ThreatCompositionHeatmap data={threatCompositionData || []} isLoading={isLoading} />
          </div>
        </>
      )}
    </PageContainer>
  );
}