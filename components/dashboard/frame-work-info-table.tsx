'use client';

import { useGetFrameworkInfos } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/framework-info';
import { FrameworkInfo, FrameworkDetail, FrameworkBuDetail, FrameworkSeverity, FrameworkBuStatus, FrameworkName } from '@/lib/api/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

interface FlattenedFrameworkData {
    _id: string;
    month: string;
    year: string;
    frameworkName: FrameworkName;
    frameworkHeader: string;
    frameworkSubtitle: string;
    buName: string;
    buId: string;
    buStatus: FrameworkBuStatus;
    gapDescription: string;
    severity: FrameworkSeverity;
    // Add other relevant fields if needed
}

// Helper function to flatten the nested data structure
const flattenData = (data: FrameworkInfo[]): FlattenedFrameworkData[] => {
    const flattened: FlattenedFrameworkData[] = [];
    data?.forEach(info => {
        info.frameWorks?.forEach((framework: FrameworkDetail) => {
            framework.bu?.forEach((bu: FrameworkBuDetail) => {
                flattened.push({
                    _id: `${info._id}-${framework.frame_work_name}-${bu.bu_id}`, // Create a unique key for table row
                    month: info.month,
                    year: info.year,
                    frameworkName: framework.frame_work_name,
                    frameworkHeader: framework.frame_work_header,
                    frameworkSubtitle: framework.frame_work_subtitle,
                    buName: bu.bu_name,
                    buId: bu.bu_id,
                    buStatus: bu.bu_status,
                    gapDescription: bu.gap_discription,
                    severity: bu.severity,
                });
            });
        });
    });
    return flattened;
};

export const FrameWorkInfoTable = () => {
    const { selectedMonth, selectedYear } = useGlobalFilter();

    const queryParams = {
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    };

    const { data: frameworkInfoData, isLoading, error } = useGetFrameworkInfos(queryParams);

    const flattenedTableData = flattenData(frameworkInfoData || []);

    const renderSkeleton = () => (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4 p-2">
                    <Skeleton className="h-4 w-1/12" />
                    <Skeleton className="h-4 w-1/12" />
                    <Skeleton className="h-4 w-2/12" />
                    <Skeleton className="h-4 w-2/12" />
                    <Skeleton className="h-4 w-1/12" />
                    <Skeleton className="h-4 w-1/12" />
                    <Skeleton className="h-4 w-4/12" />
                </div>
            ))}
        </div>
    );

    const renderError = () => (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                Failed to load framework information. Please try again later.
                {error instanceof Error && <p className="text-xs">{error.message}</p>}
            </AlertDescription>
        </Alert>
    );

    return (
        <Card className="col-span-1 lg:col-span-2 xl:col-span-2"> {/* Span across columns */} 
            <CardHeader>
                <CardTitle>Framework Information Details</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    renderSkeleton()
                ) : error ? (
                    renderError()
                ) : flattenedTableData.length === 0 ? (
                    <p className="text-center text-gray-500">No framework information available for the selected period.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>Framework</TableHead>
                                <TableHead>BU Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Gap Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {flattenedTableData.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell>{item.month}</TableCell>
                                    <TableCell>{item.year}</TableCell>
                                    <TableCell>{item.frameworkName}</TableCell>
                                    <TableCell>{item.buName}</TableCell>
                                    <TableCell>{item.buStatus}</TableCell>
                                    <TableCell>{`${item.severity}`}</TableCell>
                                    <TableCell className="text-xs">{item.gapDescription}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};
