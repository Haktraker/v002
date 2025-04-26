'use client';

import React, { useState, useMemo } from 'react';
import { useGetFrameworkInfos, useDeleteFrameworkInfo } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/framework-info';
import {
    FrameworkInfo,
    FrameworkDetail,
    FrameworkBuDetail,
    FrameworkSeverity,
    FrameworkBuStatus,
    FrameworkName
} from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from "@/components/ui/input";
import { useTableStyle } from '@/hooks/use-table-style';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

// Flattened data structure for the table
interface FlattenedFrameworkData {
    _id: string; // Unique ID for the row (combination of info._id, framework name, bu_id)
    infoId: string; // Original FrameworkInfo ID for deletion
    month: string;
    year: string;
    frameworkName: FrameworkName;
    frameworkHeader: string;
    frameworkSubtitle: string;
    buName: string;
    buId: string;
    buStatus: FrameworkBuStatus;
    gapDescription: string;
    affectedSystems: string[];
    severity: FrameworkSeverity;
    // Add mitigation plan fields if they need to be columns
    createdAt?: string;
    updatedAt?: string;
}

// Helper function to flatten the nested data structure
const flattenData = (data: FrameworkInfo[] | undefined): FlattenedFrameworkData[] => {
    const flattened: FlattenedFrameworkData[] = [];
    if (!data) return flattened;

    data.forEach(info => {
        info.frameWorks?.forEach((framework: FrameworkDetail) => {
            framework.bu?.forEach((bu: FrameworkBuDetail) => {
                flattened.push({
                    _id: `${info._id}-${framework.frame_work_name}-${bu.bu_id}`, // Unique key for table row
                    infoId: info._id, // Store the original document ID for deletion
                    month: info.month,
                    year: info.year,
                    frameworkName: framework.frame_work_name,
                    frameworkHeader: framework.frame_work_header,
                    frameworkSubtitle: framework.frame_work_subtitle,
                    buName: bu.bu_name,
                    buId: bu.bu_id,
                    buStatus: bu.bu_status,
                    gapDescription: bu.gap_discription,
                    affectedSystems: bu.affected_systems,
                    severity: bu.severity,
                    createdAt: info.createdAt,
                    updatedAt: info.updatedAt,
                });
            });
        });
    });
    return flattened;
};

// --- Badge Styling Helpers (copied from frame-work-info-display) ---
const getSeverityBadgeClass = (severity: FrameworkSeverity): string => {
    // Cast severity to unknown then string for comparison to satisfy very strict linter rule
    switch (severity as unknown as string) {
        case 'Critical': return 'bg-red-600 hover:bg-red-700 text-white';
        case 'High': return 'bg-orange-500 hover:bg-orange-600 text-white';
        case 'Medium': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
        case 'Low': return 'bg-blue-500 hover:bg-blue-600 text-white';
        default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
};

const getStatusBadgeClass = (status: FrameworkBuStatus): string => {
    switch (status) {
        case 'Compliant': return 'bg-green-600 hover:bg-green-700 text-white';
        case 'Non-Compliant': return 'bg-red-600 hover:bg-red-700 text-white';
        default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
};

export default function FrameworkInfoPage() {
    const { data: frameworkInfoData, isLoading, error, refetch } = useGetFrameworkInfos();
    const deleteMutation = useDeleteFrameworkInfo();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Flatten data for the table
    const flattenedTableData = useMemo(() => flattenData(frameworkInfoData), [frameworkInfoData]);

    // Note: Deleting a row in this flattened view will delete the *entire* FrameworkInfo document
    // associated with that row (infoId). If granular deletion (e.g., removing just one BU) is needed,
    // the backend API and frontend logic would need significant changes (likely using PATCH).
    const handleDelete = async (infoId: string) => {
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(infoId);
            refetch(); // Refetch the data to update the table
            toast.success('Framework Info entry deleted successfully');
            // Clear selection if the deleted item was selected
            setRowSelection(prev => {
                const newSelection = { ...prev };
                Object.keys(newSelection).forEach(key => {
                    if (flattenedTableData.find(row => row._id === key)?.infoId === infoId) {
                         delete newSelection[key];
                    }
                });
                return newSelection;
            });
        } catch (err) {
            console.error('Failed to delete entry:', err);
            toast.error('Failed to delete Framework Info entry');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        // Get unique FrameworkInfo IDs to delete from selected rows
        const selectedInfoIds = Array.from(new Set(
            Object.keys(rowSelection)
                .map(rowId => flattenedTableData.find(row => row._id === rowId)?.infoId)
                .filter((id): id is string => !!id)
        ));

        if (selectedInfoIds.length === 0) {
            toast.info("No valid entries selected for deletion.");
            setIsDeleting(false);
            setShowBulkDeleteDialog(false);
            return;
        }

        try {
            await Promise.all(selectedInfoIds.map(id => deleteMutation.mutateAsync(id)));
            refetch();
            toast.success(`Successfully deleted ${selectedInfoIds.length} Framework Info entries`);
            setRowSelection({}); // Clear selection after successful deletion
        } catch (err) {
            console.error('Failed to bulk delete entries:', err);
            toast.error('Failed to delete selected Framework Info entries');
        } finally {
            setIsDeleting(false);
            setShowBulkDeleteDialog(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return 'Invalid Date';
        }
    };

    // Hook for table styling helpers
    const tableStyle = useTableStyle<FlattenedFrameworkData>({
        enableSorting: true,
        sortableColumns: ['month', 'year', 'frameworkName', 'buName', 'buStatus', 'severity', 'createdAt', 'updatedAt'],
    });

    const columns = useMemo<ColumnDef<FlattenedFrameworkData>[]>(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all rows"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px]"
                    // Store the flattened row ID (_id) in selection state
                    value={row.original._id}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        tableStyle.getDefaultColumn('month', 'Month', { isSortable: true, cellClassName: 'font-medium' }),
        tableStyle.getDefaultColumn('year', 'Year', { isSortable: true }),
        tableStyle.getDefaultColumn('frameworkName', 'Framework', { isSortable: true }),
        tableStyle.getDefaultColumn('frameworkHeader', 'Header'),
        // tableStyle.getDefaultColumn('frameworkSubtitle', 'Subtitle'), // Maybe too verbose for table
        tableStyle.getDefaultColumn('buName', 'BU Name', { isSortable: true }),
        {
            accessorKey: 'buStatus',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-2 py-1 h-auto -ml-2"
                >
                    Status
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <Badge
                    className={cn("text-xs px-2.5 py-0.5", getStatusBadgeClass(row.original.buStatus))}
                    >
                    {row.original.buStatus}
                </Badge>
            ),
        },
        {
            accessorKey: 'severity',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="px-2 py-1 h-auto -ml-2"
                >
                    Severity
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: ({ row }) => (
                <Badge
                    className={cn("text-xs px-2 py-0.5", getSeverityBadgeClass(row.original.severity))}
                    >
                    {`${row.original.severity}`}
                </Badge>
            ),
        },
        tableStyle.getDefaultColumn('gapDescription', 'Gap Description', { cellClassName: 'text-xs max-w-xs truncate'}), // Truncate long text
        tableStyle.getDefaultColumn('affectedSystems', 'Affected Systems', { formatter: (val) => Array.isArray(val) ? val.join(', ') : 'N/A' }),
        tableStyle.getDefaultColumn('createdAt', 'Created At', { isSortable: true, formatter: formatDate }),
        tableStyle.getDefaultColumn('updatedAt', 'Updated At', { isSortable: true, formatter: formatDate }),
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const entry = row.original;
                return (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" asChild>
                            {/* Link to an edit page (needs to be created) - use infoId */}
                            <Link href={`/dashboard/cybersecurity-compliance-dashboard/framework-info/${entry.infoId}/edit`}>
                                <Pencil className="h-4 w-4" aria-label="Edit entry" />
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" aria-label="Delete entry" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the entire Framework Info entry for {entry.month} {entry.year} including all its frameworks and business units.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    {/* Use infoId for deletion */}
                                    <AlertDialogAction onClick={() => handleDelete(entry.infoId)} disabled={isDeleting}>
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                );
            },
        },
    ], [isDeleting, tableStyle]);

    const table = useReactTable({
        data: flattenedTableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        // Provide a function to get row ID using our unique flattened ID
        getRowId: row => row._id,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            }
        }
    });

    // Loading Skeleton
    if (isLoading) {
        return (
            <PageContainer>
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                     <Skeleton className="h-9 w-40" />
                     <Skeleton className="h-9 w-40" />
                </div>
                <Skeleton className="h-[500px] w-full rounded-md" />
            </PageContainer>
        );
    }

    // Error State
    if (error) {
        console.error("Error loading Framework Info data:", error);
        return (
            <PageContainer>
                <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
                    Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
            </PageContainer>
        );
    }

    // Main Content
    return (
        <PageContainer>
            <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-semibold">Framework Information Management</h1>
                    {/* Add Filters */}
                    {/* <Input
                        placeholder="Filter by BU Name..."
                        value={(table.getColumn("buName")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("buName")?.setFilterValue(event.target.value)
                        }
                        className="h-9 max-w-[150px]"
                        aria-label="Filter data by Business Unit Name"
                    />
                     <Input
                        placeholder="Filter by Framework..."
                        value={(table.getColumn("frameworkName")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("frameworkName")?.setFilterValue(event.target.value)
                        }
                        className="h-9 max-w-[150px]"
                        aria-label="Filter data by Framework Name"
                    /> */}
                    {/* Add more specific filters (Year, Month, Status, Severity) if needed using Select components */}
                </div>

                <div className="flex items-center gap-2">
                    {/* Bulk Delete Button */}
                    {Object.keys(rowSelection).length > 0 && (
                        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete ({Object.keys(rowSelection).length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the selected {Object.keys(rowSelection).length} Framework Info entries (including all their nested data).
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
                    {/* Add New Entry Button */}
                    <Button asChild size="sm">
                        {/* Link to a new entry page (needs to be created) */}
                        <Link href="/dashboard/cybersecurity-compliance-dashboard/framework-info/new">
                            Add New Entry
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="[&:has([role=checkbox])]:pl-3 whitespace-nowrap">
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
                                    key={row.id} // Use the unique _id from flattened data
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="[&:has([role=checkbox])]:pl-3 py-2">
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
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination */}
            {tableStyle.Pagination({ table })}
        </PageContainer>
    );
}
