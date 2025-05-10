'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ReportNonComplianceGapsOverview,
  NonComplianceGapDetailItem,
} from '@/lib/api/endpoints/reports/non-compliance-gaps-overview';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel, // Added for pagination
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // ShadCN Table components

interface NonComplianceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  records: ReportNonComplianceGapsOverview[] | null;
}

// Define columns for the details table
const detailColumns: ColumnDef<NonComplianceGapDetailItem, any>[] = [
  {
    accessorKey: 'issueName',
    header: 'Issue Name',
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[150px]' },
  },
  {
    accessorKey: 'relatedStandard',
    header: 'Related Standard',
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[150px]' },
  },
  {
    accessorKey: 'priorityLevel',
    header: 'Priority Level',
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[100px]' },
  },
  {
    accessorKey: 'recommendation',
    header: 'Recommendation', // As per schema
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[200px]' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[100px]' },
  },
  {
    accessorKey: 'responsiblePerson',
    header: 'Responsible Person',
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[150px]' },
  },
  {
    accessorKey: 'user',
    header: 'User',
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[120px]' },
  },
  {
    accessorKey: 'bu',
    header: 'BU',
    cell: info => info.getValue() || 'N/A',
    meta: { cellClassName: 'min-w-[100px]' },
  },
];

export function NonComplianceDetailsDialog({
  isOpen,
  onClose,
  records,
}: NonComplianceDetailsDialogProps) {
  const allDetails = useMemo((): NonComplianceGapDetailItem[] => {
    if (!records) return [];
    // Add a unique key to each detail item for TanStack Table if items don't have inherent IDs
    // And associate original record info if needed, e.g. for context, or just use index.
    return records.flatMap((record, recordIndex) => 
        record.details.map((detail, detailIndex) => ({
            ...detail,
            // Create a pseudo-unique ID for the row if detail._id is not guaranteed or for combined list
            _uniqueDetailId: `${record._id}-${detailIndex}-${detail.issueName || 'detail'}` 
        }))
    );
  }, [records]);

  const table = useReactTable<NonComplianceGapDetailItem>({
    data: allDetails,
    columns: detailColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Enable pagination
    initialState: {
        pagination: {
            pageSize: 5, // Show 5 details per page
        }
    }
  });

  if (!isOpen || !records) return null;

  const firstRecord = records[0]; // For dialog title

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>
            Non Compliance Details for {firstRecord?.year}-{firstRecord?.month}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {allDetails.length > 0 ? (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id} className={(header.column.columnDef.meta as any)?.cellClassName}>
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
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={(row.original as any)._uniqueDetailId || row.id} // Use the unique ID
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className={(cell.column.columnDef.meta as any)?.cellClassName}>
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
                      colSpan={detailColumns.length}
                      className="h-24 text-center"
                    >
                      No details found for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
             <p className="text-center py-4">No details available for this period.</p>
          )}
        </div>
        {allDetails.length > 0 && (
            <div className="flex items-center justify-end space-x-2 py-4">
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
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 