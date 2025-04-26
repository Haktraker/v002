'use client';

import { useGetFrameworkInfos } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/framework-info';
import {
    FrameworkInfo,
    FrameworkDetail,
    FrameworkBuDetail,
    FrameworkSeverity,
    FrameworkBuStatus,
    FrameworkName
} from '@/lib/api/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils"; // Import cn utility for conditional classes
import Link from 'next/link';
import { Button } from '../ui/button';

// --- Grouping Logic ---
interface GroupedFrameworks {
    [frameworkName: string]: {
        [frameworkHeader: string]: {
            subtitle: string;
            buDetails: FrameworkBuDetail[];
        };
    };
}

const groupData = (data: FrameworkInfo[] | undefined): GroupedFrameworks => {
    const grouped: GroupedFrameworks = {};
    if (!data) return grouped;

    data.forEach(info => {
        info.frameWorks?.forEach(framework => {
            const fwName = framework.frame_work_name;
            const fwHeader = framework.frame_work_header;

            if (!grouped[fwName]) {
                grouped[fwName] = {};
            }
            if (!grouped[fwName][fwHeader]) {
                grouped[fwName][fwHeader] = {
                    subtitle: framework.frame_work_subtitle,
                    buDetails: [],
                };
            }
            // Append BU details for the specific framework/header combination
            grouped[fwName][fwHeader].buDetails.push(...framework.bu);

            // Optional: Deduplicate BU details if the same BU appears under the same header from different data entries
            // grouped[fwName][fwHeader].buDetails = Array.from(new Map(grouped[fwName][fwHeader].buDetails.map(bu => [bu.bu_id, bu])).values());
        });
    });
    return grouped;
};

// --- Badge Styling Helpers ---
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

// --- Skeleton Component ---
const SkeletonDisplay = () => (
    <div className="space-y-4 p-4">
        {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-1/3" />
                <div className="space-y-2 pl-4">
                    <Skeleton className="h-6 w-2/5" />
                    <Skeleton className="h-4 w-3/5 mb-3" />
                    <div className="border border-border/30 rounded-lg p-4 space-y-2 bg-muted/20">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// --- Main Component ---
export const FrameWorkInfoDisplay = () => {
    const { selectedMonth, selectedYear } = useGlobalFilter();

    const queryParams = {
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    };

    const { data: frameworkInfoData, isLoading, error } = useGetFrameworkInfos(queryParams);

    const groupedData = groupData(frameworkInfoData);

    const renderError = () => (
        <Alert variant="destructive" className="m-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Framework Data</AlertTitle>
            <AlertDescription>
                Failed to load framework information. Please try again later.
                {error instanceof Error && <p className="text-xs mt-1">{error.message}</p>}
            </AlertDescription>
        </Alert>
    );

    return (
        <Card className="col-span-1 lg:col-span-2 xl:col-span-2 bg-background text-foreground border-border/40 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4 flex justify-between items-center flex-row">
                <CardTitle className="text-lg">Compliance Frameworks Details</CardTitle>
                <Link href="/dashboard/cybersecurity-compliance-dashboard/framework-info">
                    <Button variant="outline" size="sm">Manage All</Button>
                </Link>
                {/* Add dropdown filter here if needed */}
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <SkeletonDisplay />
                ) : error ? (
                    renderError()
                ) : Object.keys(groupedData).length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No framework information available for the selected period.</p>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {Object.entries(groupedData).map(([frameworkName, headers], frameworkIndex) => (
                            <AccordionItem value={`framework-${frameworkIndex}`} key={frameworkName} className="border-b border-border/30 last:border-b-0">
                                <AccordionTrigger className="bg-muted/40 hover:bg-muted/60 px-4 py-3 text-base font-semibold rounded-t-md data-[state=closed]:rounded-b-md transition-all">
                                    {frameworkName}
                                </AccordionTrigger>
                                <AccordionContent className="bg-background p-0">
                                    {Object.entries(headers).map(([header, { subtitle, buDetails }], headerIndex) => (
                                        <div key={headerIndex} className="px-4 py-4 border-t border-border/20">
                                            <h4 className="text-base font-medium mb-1">{header}</h4>
                                            <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
                                            <div className="space-y-4">
                                                {buDetails.map((bu, buIndex) => (
                                                    <div key={buIndex} className="bg-muted/30 p-4 rounded-lg border border-border/30 shadow-inner">
                                                        <div className="flex justify-between items-start mb-3 gap-2">
                                                            <h5 className="text-[0.95rem] font-medium leading-tight">{bu.bu_name}</h5>
                                                            <Badge
                                                                className={cn("text-xs px-2.5 py-0.5 shrink-0", getStatusBadgeClass(bu.bu_status))}
                                                            >
                                                                {bu.bu_status}
                                                            </Badge>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                                            {/* Left Column */}
                                                            <div className="space-y-1.5">
                                                                <p><span className="font-semibold text-foreground">ID:</span> {bu.bu_id}</p>
                                                                <p><span className="font-semibold text-foreground">Gap Description:</span> {bu.gap_discription}</p>
                                                                <p><span className="font-semibold text-foreground">Affected Systems:</span> {bu.affected_systems.join(', ')}</p>
                                                                <div className="flex items-center">
                                                                    <span className="font-semibold text-foreground mr-2">Severity:</span>
                                                                    <Badge
                                                                        className={cn("text-xs px-2 py-0.5", getSeverityBadgeClass(bu.severity))}
                                                                    >
                                                                        {/* Explicitly cast to string for ReactNode */}
                                                                        {`${bu.severity}`}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            {/* Right Column */}
                                                            <div className="space-y-1.5">
                                                                <p><span className="font-semibold text-foreground">Short-term Actions:</span> {bu.mitigation_plan.short_term_actions}</p>
                                                                <p><span className="font-semibold text-foreground">Long-term Strategy:</span> {bu.mitigation_plan.long_term_strategy}</p>
                                                                <p><span className="font-semibold text-foreground">Timeline:</span> {bu.mitigation_plan.time_line}</p>
                                                                <p><span className="font-semibold text-foreground">Budget:</span> {bu.mitigation_plan.budget}</p>
                                                                <p><span className="font-semibold text-foreground">Required Resources:</span> {bu.mitigation_plan.required_resources}</p>
                                                                <div>
                                                                    <span className="font-semibold text-foreground">Progress:</span>
                                                                    <Progress value={bu.mitigation_plan.progress} className="h-2 mt-1 bg-muted" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}; 