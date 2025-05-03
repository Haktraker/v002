'use client';

import React, { useState, useMemo } from 'react';
import { useGetAttackSurfaces, useUpdateAttackSurface, useDeleteAttackSurface } from '@/lib/api/endpoints/attack-surface/attack-surface';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink, Image, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AttackSurface, AttackSurfaceStatus } from '@/lib/api/types';
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
  CellContext,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditAttackSurfaceDialog } from './edit-attack-surface-dialog';
import { format as formatFns, parseISO } from 'date-fns';
import AttackSurfaceChart from "@/components/dashboard/attack-surface-chart";

// Helper function for date formatting
const formatDateHelper = (dateString?: string | null, formatStr = 'PP') => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return formatFns(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date';
  }
};

// Define possible statuses
const STATUS_OPTIONS: AttackSurfaceStatus[] = ["investigating", "resolved", "unresolved"];

export default function AttackSurfacePage() {
  const { data: attackSurfaceData, isLoading, error, refetch } = useGetAttackSurfaces();
  const updateAttackSurfaceMutation = useUpdateAttackSurface();
  const deleteAttackSurfaceMutation = useDeleteAttackSurface();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAttackSurface, setEditingAttackSurface] = useState<AttackSurface | null>(null);

  // Track expanded mitigation steps by row ID
  const [expandedMitigationSteps, setExpandedMitigationSteps] = useState<Record<string, boolean>>({});

  // Toggle expansion for a specific row
  const toggleMitigationStepsExpansion = (id: string) => {
    setExpandedMitigationSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // --- Handlers ---

  const handleStatusChange = async (id: string, newStatus: AttackSurfaceStatus) => {
    setIsUpdatingStatus(id);
    try {
      await updateAttackSurfaceMutation.mutateAsync({ id, status: newStatus });
      toast.success('Attack Surface status updated successfully');
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteAttackSurfaceMutation.mutateAsync(id);
      toast.success('Attack Surface entry deleted successfully');
      refetch();
    } catch (error) {
      console.error('Failed to delete Attack Surface entry:', error);
      toast.error('Failed to delete Attack Surface entry');
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

    for (const id of selectedIds) {
      try {
        await deleteAttackSurfaceMutation.mutateAsync(id);
        successCount++;
      } catch (error) {
        console.error(`Failed to delete Attack Surface entry ${id}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      refetch();
    } else if (errorCount > 0) {
       toast.error('Failed to delete selected entries');
    } else {
       toast.info('No entries were deleted');
    }

    setIsDeleting(false);
    setShowBulkDeleteDialog(false);
    setRowSelection({});
  };

  const handleOpenEditDialog = (attackSurface: AttackSurface) => {
    setEditingAttackSurface(attackSurface);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingAttackSurface(null);
  };

  // --- Table Setup ---

  const tableStyle = useTableStyle<AttackSurface>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['detectionTime', 'affectedSystems', 'services', 'status', 'createdAt', 'updatedAt'],
    onDelete: handleDelete,
    onBulkDelete: handleBulkDelete,
    isDeleting: isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<AttackSurface>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('detectionTime', 'Detection Time', {
        isSortable: true,
        formatter: (val) => formatDateHelper(val, 'PPpp'),
      }),
      tableStyle.getDefaultColumn('affectedSystems', 'Affected Systems', { isSortable: true }),
      { // Custom column for Open Ports
        accessorKey: 'openPorts',
        header: 'Open Ports',
        cell: ({ row }) => {
          const ports = row.original.openPorts;
          if (!ports || ports.length === 0) return <span className="text-muted-foreground">-</span>;
          return ports.map(p => p.port).join(', ');
        },
      },
      tableStyle.getDefaultColumn('services', 'Services', { isSortable: true }),
      { // Custom expandable column for Mitigation Steps
        accessorKey: 'mitigationSteps',
        header: 'Mitigation Steps',
        cell: ({ row }: CellContext<AttackSurface, unknown>) => {
          const attackSurface = row.original;
          const content = attackSurface.mitigationSteps;
          const id = attackSurface._id;
          const isExpanded = expandedMitigationSteps[id] || false;
          
          if (!content) return <span className="text-muted-foreground">-</span>;
          
          const shouldTruncate = content.length > 100;
          
          return (
            <div className="max-w-xs">
              <div className={shouldTruncate && !isExpanded ? "truncate" : ""}>
                {content}
              </div>
              {shouldTruncate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMitigationStepsExpansion(id)}
                  className="p-0 h-6 text-xs flex items-center mt-1"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" /> Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" /> Show More
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        },
      },
      { // Screenshot column
        accessorKey: 'screenshot',
        header: 'Screenshot',
        cell: ({ row }) => {
          const url = row.original.screenshot;
          if (!url) return <span className="text-muted-foreground">-</span>;
          
          return (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
            >
              <Image className="h-4 w-4" />
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        },
      },
      { // Sample File column
        accessorKey: 'sampleFile',
        header: 'Sample File',
        cell: ({ row }) => {
          const url = row.original.sampleFile;
          if (!url) return <span className="text-muted-foreground">-</span>;
          
          return (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
            >
              <FileText className="h-4 w-4" />
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        },
      },
      { // Custom Status Column with Dropdown
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }: CellContext<AttackSurface, unknown>) => {
          const attackSurface = row.original;
          const currentStatus = attackSurface.status || 'unresolved';
          const isLoadingStatus = isUpdatingStatus === attackSurface._id;

          return (
            <Select
              value={currentStatus}
              onValueChange={(newStatus: AttackSurfaceStatus) => handleStatusChange(attackSurface._id, newStatus)}
              disabled={isLoadingStatus || updateAttackSurfaceMutation.isPending}
            >
              <SelectTrigger className={`w-[130px] h-8 ${isLoadingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
      tableStyle.getDefaultColumn('createdAt', 'Created At', {
        isSortable: true,
        formatter: (val) => formatDateHelper(val),
      }),
      tableStyle.getDefaultColumn('updatedAt', 'Updated At', {
        isSortable: true,
        formatter: (val) => formatDateHelper(val),
      }),
      { // Custom Action Column
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: CellContext<AttackSurface, unknown>) => {
          const attackSurface = row.original;
          return (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenEditDialog(attackSurface)}
                className="h-8 w-8 p-0"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <tableStyle.DeleteDialog id={attackSurface._id} />
            </div>
          );
        },
      },
    ],
    [isUpdatingStatus, isDeleting, updateAttackSurfaceMutation.isPending, tableStyle]
  );

  const tableData = useMemo(() => attackSurfaceData || [], [attackSurfaceData]);

  const table = useReactTable({
    data: tableData,
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

  // --- Render Logic ---

  if (isLoading) {
     return (
       <PageContainer>
         <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-semibold">Attack Surface</h1>
           <Skeleton className="h-10 w-24" />
         </div>
         <Skeleton className="h-[400px] w-full" />
       </PageContainer>
     );
  }

  if (error) {
    console.error("Error loading Attack Surface data:", error);
    return (
        <PageContainer>
             <h1 className="text-2xl font-semibold mb-6">Attack Surface</h1>
             <Alert variant="destructive" className="mx-auto my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load Attack Surface data. Please try again later.
                </AlertDescription>
             </Alert>
        </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Attack Surface</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Filter Affected Systems..."
            value={(table.getColumn("affectedSystems")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("affectedSystems")?.setFilterValue(event.target.value)
            }
            className="max-w-sm h-9"
          />
          <Link href="/dashboard/attack-surface/new">
            <Button variant="default" size="sm" className="h-9">
              Add New
            </Button>
          </Link>
          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={isDeleting}
              size="sm"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete ({Object.keys(rowSelection).length})
            </Button>
          )}
        </div>
      </div>

      {/* Add the chart component */}
      <div className="mb-8">
        <AttackSurfaceChart />
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      {tableStyle.BulkDeleteDialog()}

      {editingAttackSurface && (
          <EditAttackSurfaceDialog
              isOpen={showEditDialog}
              onClose={handleCloseEditDialog}
              attackSurface={editingAttackSurface}
              onSuccess={refetch}
          />
      )}
    </PageContainer>
  );
}
