'use client';

import React, { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { 
    useGetAlertTypeDistributions, 
    useDeleteAlertTypeDistribution 
} from '@/lib/api/endpoints/business-units-security/alert-type-distribution';
import { 
  AlertTypeDistribution, 
  AlertTypeDistributionBu, 
  AlertTypeDistributionAlert, 
  AlertTypeName
} from '@/lib/api/types'; 
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
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
import { useTableStyle } from '@/hooks/use-table-style';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Define alert type order and colors (adjust as needed)
const ALERT_TYPE_ORDER: AlertTypeName[] = ["Malware", "Phishing", "Auth Failure", "Policy Violation", "Data Exfil"];
// Example badge variants (adjust based on your theme/design system)
const ALERT_BADGE_VARIANT: { [key in AlertTypeName]: string } = {
  "Malware": '#dc2626', // red-600
  "Phishing": '#f97316', // orange-500
  "Auth Failure": '#eab308', // yellow-500
  "Policy Violation": '#3b82f6', // blue-500
  "Data Exfil": '#8b5cf6'  // violet-500
};

export default function AlertTypeDistributionListPage() {
  // Fetch all data
  const {
    data: distributionData, 
    isLoading,
    error,
    refetch
  } = useGetAlertTypeDistributions(); 

  const deleteDistribution = useDeleteAlertTypeDistribution();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'year', desc: true }, { id: 'month', desc: true }]); 
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // Keep for potential future use
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const tableData = useMemo(() => {
    return Array.isArray(distributionData) ? distributionData : [];
  }, [distributionData]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteDistribution.mutateAsync(id);
      refetch();
      toast.success('Record deleted successfully');
      setRowSelection(prev => {
          const { [id]: _, ...rest } = prev;
          return rest;
      });
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRecordIds = Object.keys(rowSelection);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const id of selectedRecordIds) {
        try {
          await deleteDistribution.mutateAsync(id);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete record ${id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        refetch();
      } else {
        toast.error('Failed to delete any records');
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

  // Placeholder for Edit action - links to a non-existent page
  const handleUpdate = (record: AlertTypeDistribution) => {
    // Replace with actual edit page route when created
    window.location.href = `/dashboard/business-units-security/alert-type-distribution/${record._id}/edit`; 
  };

  const tableStyle = useTableStyle<AlertTypeDistribution>({
    enableSelection: true,
    enableSorting: true,
    sortableColumns: ['month', 'year'],
    onDelete: handleDelete, 
    onBulkDelete: handleBulkDelete,
    isDeleting,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
  });

  const columns = useMemo<ColumnDef<AlertTypeDistribution>[]>(
    () => [
      tableStyle.getSelectionColumn(),
      tableStyle.getDefaultColumn('year', 'Year', {
        isSortable: true,
        cellClassName: 'w-24',
      }),
      tableStyle.getDefaultColumn('month', 'Month', {
        isSortable: true,
        cellClassName: 'w-32',
      }),
      {
        accessorKey: 'bu',
        header: 'Business Units & Alerts',
        cell: ({ row }) => {
          const bus = row.original.bu;
          if (!bus || bus.length === 0) return <span className="text-muted-foreground">N/A</span>;

          const firstBu = bus[0];
          const remainingBus = bus.slice(1);

          const renderAlertDetails = (alert: AlertTypeDistributionAlert, index: number, isPopover: boolean) => (
            <Badge 
              key={alert.name || index} 
              style={{ 
                  backgroundColor: ALERT_BADGE_VARIANT[alert.name] || '#6b7280', // Default gray
                  color: 'white' 
              }}
              className={`whitespace-nowrap h-auto mb-1 ${isPopover ? 'text-[10px] px-1 py-0.5' : 'text-xs px-2 py-0.5'}`}
            >
               {alert.name}: {alert.count}
            </Badge>
          );

          return (
            <div className="flex flex-col gap-2 max-w-lg">
              {/* First BU Display */}
              <div className="flex flex-col gap-1">
                <span className="font-medium">{firstBu.buName || 'Unnamed BU'}</span>
                <div className="flex items-start gap-1 flex-wrap">
                  {firstBu.alert?.sort((a, b) => ALERT_TYPE_ORDER.indexOf(a.name) - ALERT_TYPE_ORDER.indexOf(b.name))
                    .map((alert, idx) => renderAlertDetails(alert, idx, false))}
                  {(!firstBu.alert || firstBu.alert.length === 0) && <span className="text-xs text-muted-foreground">No alerts</span>}
                </div>
              </div>

              {/* Popover for Remaining BUs */}
              {remainingBus.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs self-start">+{remainingBus.length} more BUs...</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3 max-h-80 overflow-y-auto">
                    <div className="flex flex-col gap-3">
                      {remainingBus.map((bu: AlertTypeDistributionBu, index: number) => (
                        <div key={bu.buName || index} className="flex flex-col gap-1 border-b pb-2 last:border-b-0">
                          <span className="font-semibold text-sm mb-1">{bu.buName || 'Unnamed BU'}</span>
                          <div className="flex items-start gap-1 flex-wrap">
                             {bu.alert?.sort((a, b) => ALERT_TYPE_ORDER.indexOf(a.name) - ALERT_TYPE_ORDER.indexOf(b.name))
                               .map((alert, idx) => renderAlertDetails(alert, idx, true))}
                             {(!bu.alert || bu.alert.length === 0) && <span className="text-[10px] text-muted-foreground">No alerts</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        },
        enableSorting: false, 
      },
      tableStyle.getActionColumn((record: AlertTypeDistribution) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleUpdate(record)} // Placeholder for Edit
            className="h-8 w-8 p-0"
            asChild // Use asChild if linking directly
          >
            <Link href={`/dashboard/business-units-security/alert-type-distribution/${record._id}/edit`}> 
              <Pencil className="h-4 w-4" aria-label="Edit record"/>
            </Link>
          </Button>
          <tableStyle.DeleteDialog id={record._id} /> 
        </>
      )),
    ],
    [isDeleting, tableStyle] // Include tableStyle in dependencies
  );

  const table = useReactTable({
    data: tableData,
    columns: columns, 
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
        pagination: { pageSize: 10 },
        sorting: [{ id: 'year', desc: true }, { id: 'month', desc: true }] 
    },
    getRowId: (row) => row._id, // Use _id for selection state key
  });

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Alert Type Distribution" />
        <div className="flex items-center justify-between my-6">
          <Skeleton className="h-8 w-60" /> 
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-md" /> 
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader title="Alert Type Distribution" />
        <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md mt-6">
          Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Alert Type Distribution" />
      
      <div className="flex items-center justify-between my-6">
        <h2 className="text-xl font-semibold">Monthly Alert Distribution Records</h2>
        <div className="flex items-center gap-2">
          {Object.keys(rowSelection).length > 0 && (
             <tableStyle.BulkDeleteDialog />
          )}
          <Link href="/dashboard/business-units-security/alert-type-distribution/new">
            <Button>Add New Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      <div className="mt-4">
        {tableStyle.Pagination({ table })}
      </div>
    </PageContainer>
  );
}
