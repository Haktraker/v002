'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useGetTtdTtrRecords, useDeleteTtdTtrRecord } from '@/lib/api/endpoints/executive-dashboard/ttd-ttr';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TtdTtr, TtdTtrIndicator } from '@/lib/api/executive-dashboard-types/types';
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
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { TtdTtrEditModal } from '@/components/dashboard/ttd-ttr-edit-modal';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useApiLoading } from '@/lib/utils/api-utils';

// Updated Combined data structure with IDs
interface CombinedTtdTtr {
    id: string; // Unique key based on year-month
    month: string; // Keep as string (number string initially)
    year: string;
    quarter: number;
    ttdScore: string | null;
    ttrScore: string | null;
    ttdId: string | null;
    ttrId: string | null;
}

export default function TtdTtrPage() {
  const { withLoading } = useApiLoading(); // Loading state for actions
  const { data: apiResponse, isLoading, error, refetch } = useGetTtdTtrRecords();
  const deleteRecordMutation = useDeleteTtdTtrRecord(); 

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // State to hold the combined record for editing
  const [editingCombinedRecord, setEditingCombinedRecord] = useState<CombinedTtdTtr | null>(null);
  const [isDeletingCombined, setIsDeletingCombined] = useState(false); 

  // --- Process Data --- 
  const combinedData = useMemo<CombinedTtdTtr[]>(() => {
    if (!apiResponse?.data) return [];
    const combinedMap: Record<string, CombinedTtdTtr> = {};

    apiResponse.data.forEach(record => {
        const key = `${record.year}-${record.month}`;
        if (!combinedMap[key]) {
            combinedMap[key] = {
                id: key,
                month: record.month, // Store month as string (likely number string)
                year: record.year,
                quarter: Number(record.quarter) || 0, 
                ttdScore: null,
                ttrScore: null,
                ttdId: null,
                ttrId: null,
            };
        }
        if (record.indicator === ("TTD" as TtdTtrIndicator)) {
            combinedMap[key].ttdScore = record.score;
            combinedMap[key].ttdId = record._id;
        } else if (record.indicator === ("TTR" as TtdTtrIndicator)) { 
            combinedMap[key].ttrScore = record.score;
            combinedMap[key].ttrId = record._id;
        }
    });

     return Object.values(combinedMap).sort((a, b) => {
        const yearA = parseInt(a.year, 10);
        const monthA = parseInt(a.month, 10);
        const yearB = parseInt(b.year, 10);
        const monthB = parseInt(b.month, 10);

        if (isNaN(yearA) || isNaN(monthA) || isNaN(yearB) || isNaN(monthB)) {
            return 0; 
        }

        const dateA = new Date(yearA, monthA - 1);
        const dateB = new Date(yearB, monthB - 1);
        return dateA.getTime() - dateB.getTime();
     });

  }, [apiResponse]);

  // --- Handlers ---
  const handleDeleteCombined = async (idsToDelete: (string | null)[]) => {
     const validIds = idsToDelete.filter((id): id is string => id !== null);
     if (validIds.length === 0) {
         toast.info("No records found to delete for this period.");
         return;
     }
    
    setIsDeletingCombined(true); // Set loading state
    try {
         await withLoading(async () => { 
            let successCount = 0;
            let errorCount = 0;
            for (const id of validIds) {
                try {
                    await deleteRecordMutation.mutateAsync(id); 
                    successCount++;
                } catch (err) {    
                    console.error(`Failed to delete record ${id}:`, err);
                    errorCount++;
                }
            }
            if (successCount > 0) {
                toast.success(`Successfully deleted ${successCount} record(s).`);
                 refetch();
            }
            if (errorCount > 0) {
                toast.error(`Failed to delete ${errorCount} record(s).`);
            }
        });
    } finally {
        setIsDeletingCombined(false); // Reset loading state
    }
  };

  // Renamed handler, accepts CombinedTtdTtr
  const handleEditCombined = useCallback((combinedRecord: CombinedTtdTtr) => { 
    setEditingCombinedRecord(combinedRecord); // Set the combined record
    setIsEditModalOpen(true); // Open the modal
  }, []);

  // --- Table Setup ---
  const tableStyle = useTableStyle<CombinedTtdTtr>({
    enableSelection: false, 
    enableSorting: true,
    sortableColumns: ['ttdScore', 'ttrScore', 'month', 'year', 'quarter'],
  });

  const columns = useMemo<ColumnDef<CombinedTtdTtr>[]>(() => [
    tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
    tableStyle.getDefaultColumn('month', 'Month', { 
        isSortable: true,
        // Optionally format month number to name here if needed for display
        // formatter: (val) => val ? MONTHS[Number(val) - 1] || val : 'N/A' 
    }),
    tableStyle.getDefaultColumn('quarter', 'Quarter', { isSortable: true }),
    tableStyle.getDefaultColumn('ttdScore', 'TTD Score (hrs)', { isSortable: true, cellClassName: 'font-medium', formatter: (val) => val ?? 'N/A' }),
    tableStyle.getDefaultColumn('ttrScore', 'TTR Score (hrs)', { isSortable: true, cellClassName: 'font-medium', formatter: (val) => val ?? 'N/A' }),
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const combinedRecord = row.original;
            const canEdit = !!combinedRecord.ttdId || !!combinedRecord.ttrId;
            const canDelete = canEdit; // Same condition for delete

            return (
                <div className="flex items-center space-x-1">
                    {canEdit && (
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditCombined(combinedRecord)} // Call new handler
                            className="h-8 w-8 p-0" 
                            title="Edit TTD/TTR Scores"
                         >
                            <Pencil className="h-4 w-4" />
                         </Button>
                    )}
                    {canDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive" 
                                    title="Delete Period Records"
                                    disabled={isDeletingCombined} // Use combined delete state
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete the TTD and/or TTR records 
                                    for {combinedRecord.year}-{combinedRecord.month}. This cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => handleDeleteCombined([combinedRecord.ttdId, combinedRecord.ttrId])}
                                    className="bg-destructive hover:bg-destructive/90"
                                    disabled={isDeletingCombined} // Use combined delete state
                                >
                                    {isDeletingCombined ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            );
        }
    }
  ], [tableStyle, handleEditCombined, isDeletingCombined]); 

  const table = useReactTable({
    data: combinedData,
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

  // --- Render Logic ---
  if (isLoading) return <PageContainer><PageHeader title="TTD/TTR Overview" /><p>Loading...</p></PageContainer>;
  if (error) return <PageContainer><PageHeader title="TTD/TTR Overview" /><p>Error loading data.</p></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="TTD/TTR Overview" /> 
      <div className="flex items-center justify-between mb-6">
        <Input
          placeholder="Filter by Year..."
          value={(table.getColumn("year")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("year")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Link href="/dashboard/executive-dashboard/ttd-ttr/new">
            <Button>Add New TTD/TTR Record</Button>
          </Link>
        </div>
      </div>

      {tableStyle.renderTable(table)}
      {tableStyle.Pagination({ table })}
      
      {/* Edit Modal Render - Pass combined record */}
      {editingCombinedRecord && (
          <TtdTtrEditModal 
            isOpen={isEditModalOpen}
            onClose={() => {
                setIsEditModalOpen(false);
                setEditingCombinedRecord(null); // Use combined state setter
            }}
            record={editingCombinedRecord} // Pass the combined record
            onSuccess={() => {
                refetch(); 
            }}
          />
      )}
    </PageContainer>
  );
}
