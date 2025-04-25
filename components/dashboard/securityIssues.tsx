'use client';

import React, { useState } from 'react'; // Import useState
import { SecurityIssue, SecurityIssueBu } from '@/lib/api/types'; // Adjust import path if needed, assume BuItem type exists
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ChevronRight, ChevronDown } from 'lucide-react'; // Import icons
import { cn } from '@/lib/utils'; // Import cn utility
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Import Collapsible components

// Define an interface for the flattened issue structure
interface FlattenedIssue extends SecurityIssueBu {
    month: string;
    year: string;
    _id: string; // Ensure _id is string for unique key
    description: string;
    affectedSystems: string[];
    recommendedAction: string;
    lastUpdated: string;
    buName: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    vendor: string; 
    issue: string;
    daysOpen: number
}


interface SecurityIssuesProps {
    data: SecurityIssue[] | undefined;
    isLoading: boolean;
    error: Error | null;
}

export const SecurityIssues: React.FC<SecurityIssuesProps> = ({ data, isLoading, error }) => {
    const [openRowKey, setOpenRowKey] = useState<string | null>(null); // State to track the open row

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Security Issues</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Security Issues</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            Failed to load security issues: {error.message}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Security Issues</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No active security issues found for the selected period.</p>
                </CardContent>
            </Card>
        );
    }

    // Flatten the data for table display
    const flattenedIssues: FlattenedIssue[] = data.flatMap((issue, issueIndex) =>
        issue.bu.map((buItem, buIndex) => ({
            ...buItem,
            month: issue.month,
            year: issue.year,
            _id: `${issue._id}-${issueIndex}-${buIndex}`, // Create a unique key for each row
            // Assuming details are here - adjust if structure is different
            description: buItem.description || 'No description available.',
            affectedSystems: buItem.affectedSystems || ['N/A'],
            recommendedAction: buItem.recommendedAction || 'No specific action recommended.',
            lastUpdated: buItem.lastUpdated || new Date().toISOString() // Add lastUpdated, provide default
        }))
    );

    // Function to get severity color class
    const getSeverityClass = (severity: string): string => {
        switch (severity?.toLowerCase()) {
            case 'critical':
                return 'text-red-600 font-semibold';
            case 'high':
                return 'text-orange-500 font-semibold';
            case 'medium':
                return 'text-yellow-500';
            case 'low':
                return 'text-green-500';
            default:
                return ''; // Default or unknown severity
        }
    };

    const handleRowToggle = (key: string) => {
        setOpenRowKey(prevKey => (prevKey === key ? null : key));
    };

    return (
        <Card className="col-span-1 md:col-span-2"> {/* Span across columns */}
            <CardHeader>
                <CardTitle>Active Security Issues</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>BU Name</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Days Open</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flattenedIssues.map((item) => {
                            const isRowOpen = openRowKey === item._id;
                            return (
                                <React.Fragment key={item._id}>
                                    <TableRow className="cursor-pointer hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
                                        <TableCell>
                                            <Collapsible asChild open={isRowOpen} onOpenChange={() => handleRowToggle(item._id)}>
                                                <CollapsibleTrigger asChild>
                                                    <button className="p-1 rounded-md hover:bg-muted">
                                                        {isRowOpen ? <ChevronDown className="h-4 w-4 transition-transform duration-200 rotate-180" /> : <ChevronRight className="h-4 w-4 transition-transform duration-200" />}
                                                    </button>
                                                </CollapsibleTrigger>
                                            </Collapsible>
                                        </TableCell>
                                        <TableCell>{item.buName}</TableCell>
                                        <TableCell className={cn(getSeverityClass(item.severity))}>{item.severity}</TableCell>
                                        <TableCell>{item.vendor}</TableCell>
                                        <TableCell>{item.issue}</TableCell>
                                        <TableCell>{item.daysOpen}</TableCell>
                                        <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                    <Collapsible asChild open={isRowOpen} onOpenChange={() => handleRowToggle(item._id)}>
                                        <CollapsibleContent asChild>
                                            <TableRow className="bg-muted/30">
                                                <TableCell></TableCell>
                                                <TableCell colSpan={6} className="p-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-1">Description:</h4>
                                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-1">Affected Systems:</h4>
                                                            <ul className="list-disc list-inside text-sm text-muted-foreground pl-4">
                                                                {item.affectedSystems?.map((system, idx) => <li key={idx}>{system}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-1">Recommended Action:</h4>
                                                            <p className="text-sm text-muted-foreground">{item.recommendedAction}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default SecurityIssues;