'use client';

import { useMemo } from 'react';
import { useGetBehavioralPatterns } from '@/lib/api/endpoints/user-behavior-analytics/behavioral-pattern';
import { BehavioralPattern, BusinessUnitName } from '@/lib/api/types';
// import { useGlobalFilter } from '@/lib/context/GlobalFilterContext'; // Keep filter if needed later for period aggregation
import { MONTHS } from '@/lib/constants/months-list';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import ApexCharts
const ApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
});

// --- Constants ---
const METRIC_KEYS: (keyof Pick<BehavioralPattern, 'outsideHoursAccess' | 'multipleDevices' | 'unusualDataTransfer' | 'unusualApplications'>)[] = [
    'outsideHoursAccess',
    'multipleDevices',
    'unusualDataTransfer',
    'unusualApplications'
];

const METRIC_NAMES: Record<typeof METRIC_KEYS[number], string> = {
    outsideHoursAccess: 'Outside Hours Access',
    multipleDevices: 'Multiple Devices',
    unusualDataTransfer: 'Unusual Data Transfer',
    unusualApplications: 'Unusual Applications'
};

const METRIC_COLORS: Record<typeof METRIC_KEYS[number], string> = {
    outsideHoursAccess: '#a855f7',    // purple-500 (Matching screenshot)
    multipleDevices: '#22c55e',    // green-500 (Matching screenshot)
    unusualDataTransfer: '#facc15',  // yellow-400 (Matching screenshot)
    unusualApplications: '#f97316'    // orange-500 (Matching screenshot)
};

// Helper to convert month name to number for sorting (Might not be needed for BU aggregation)
// const monthNameToNumber = (monthName: string): number => { ... };

// --- Helper Functions ---

/**
 * Aggregates behavioral pattern data by Business Unit across all fetched records.
 */
const aggregateDataByBU = (data: BehavioralPattern[] | undefined) => {
    if (!data) return { aggregated: new Map(), sortedBUs: [] };

    const aggregated = new Map<BusinessUnitName, Record<typeof METRIC_KEYS[number], number>>();

    data.forEach(item => {
        const bu = item.businessUnit;
        if (!aggregated.has(bu)) {
            aggregated.set(bu, {
                outsideHoursAccess: 0,
                multipleDevices: 0,
                unusualDataTransfer: 0,
                unusualApplications: 0
            });
        }
        const currentBUData = aggregated.get(bu)!;
        currentBUData.outsideHoursAccess += item.outsideHoursAccess || 0;
        currentBUData.multipleDevices += item.multipleDevices || 0;
        currentBUData.unusualDataTransfer += item.unusualDataTransfer || 0;
        currentBUData.unusualApplications += item.unusualApplications || 0;
    });

    // Sort Business Units alphabetically for consistent category order
    const sortedBUs = Array.from(aggregated.keys()).sort((a, b) => a.localeCompare(b));

    return { aggregated, sortedBUs };
};

/**
 * Generates ApexCharts options for a stacked bar chart.
 */
const getChartOptions = (categories: string[], isDark: boolean): ApexOptions => {
    const textColor = isDark ? '#e2e8f0' : '#475569'; 
    const gridBorderColor = isDark ? '#374151' : '#e5e7eb';
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
        chart: {
            type: 'bar',
            height: 300,
            stacked: true, // Enable stacking
            zoom: { enabled: false },
            toolbar: { show: false },
            background: 'transparent',
            foreColor: textColor,
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%', // Adjust column width for stacked bars
            },
        },
        dataLabels: {
            enabled: false, 
        },
        stroke: {
            show: false, // No stroke needed for stacked bars
        },
        xaxis: {
            categories: categories, // Business Units
            title: {
                 text: 'Business Unit',
                 style: { color: textColor, fontFamily: 'inherit', fontWeight: 500 }
            },
            labels: { 
                 style: { colors: textColor, fontFamily: 'inherit' },
                 trim: false, // Prevent labels from being trimmed
                 // rotate: -45, // Rotate labels if they overlap
                 // rotateAlways: true,
            },
            axisBorder: { color: gridBorderColor },
            axisTicks: { color: gridBorderColor },
        },
        yaxis: {
            title: {
                text: 'Incident Count',
                style: { color: textColor, fontFamily: 'inherit', fontWeight: 500 }
            },
            labels: {
                style: { colors: textColor, fontFamily: 'inherit' },
                 formatter: function (val: number) {
                    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1); 
                }
            },
        },
        tooltip: {
            theme: chartThemeMode,
            shared: true, // Show tooltip per stack segment
            intersect: false,
             y: {
                 formatter: function (val: number, { seriesIndex, w }) {
                     const seriesName = w.globals.seriesNames[seriesIndex];
                     if (typeof val !== 'number') return 'N/A';
                     return `${val.toFixed(0)} (${seriesName})`; 
                 }
             },
            style: { fontFamily: 'inherit' },
        },
        legend: {
            position: 'bottom', // Position legend at the bottom like screenshot
            horizontalAlign: 'center', // Center legend
            fontFamily: 'inherit',
            labels: { colors: textColor },
            markers: { 
                size: 8, // Correct property for marker size
                shape: 'square', // Use square shape if needed (or keep default circle)
                offsetX: -4 // Adjust spacing
            },
            itemMargin: { // Adjust spacing between legend items
                horizontal: 10,
                vertical: 5
            }
        },
        grid: {
            borderColor: gridBorderColor,
            strokeDashArray: 3,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
        },
        colors: METRIC_KEYS.map(key => METRIC_COLORS[key]), // Use metric colors
         fill: {
             opacity: 1
         },
    };
};


// --- Main Component ---

export default function BehavioralPatternChart() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    // Keep global filters if you want to aggregate data for ONLY the selected month/year
    // const { selectedMonth, selectedYear } = useGlobalFilter();

    // Fetch all data for aggregation across time by BU
    const queryParams = useMemo(() => ({ limit: 10000 }), []); // No time filters

    const { data: paginatedData, isLoading, error, isError } = useGetBehavioralPatterns(queryParams);

    // Aggregate and transform data
    const { categories, series } = useMemo(() => {
        const { aggregated, sortedBUs } = aggregateDataByBU(paginatedData?.data);

        if (sortedBUs.length === 0) {
            return { categories: [], series: [] };
        }

        const cats = sortedBUs;
        
        const srs = METRIC_KEYS.map(metricKey => ({
            name: METRIC_NAMES[metricKey],
            data: sortedBUs.map(bu => aggregated.get(bu)?.[metricKey] || 0)
        }));

        return { categories: cats, series: srs };
    }, [paginatedData]);

    // Memoize chart options
    const chartOptions = useMemo(() => getChartOptions(categories, isDark), [categories, isDark]);

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[350px] w-full" />; // Adjust height if needed
        }

        if (isError) {
            return (
                <Alert variant="destructive" className="mx-auto my-4 max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Chart</AlertTitle>
                    <AlertDescription>
                        Failed to load behavioral pattern data: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            );
        }

        if (series.length === 0 || series.every(s => s.data.every(d => d === 0))) {
             return (
                <Alert className="max-w-md border-none text-center mx-auto my-4">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        There is no behavioral pattern data to display.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ApexChart
                options={chartOptions}
                series={series}
                type="bar"
                height={350} // Adjusted height for potentially rotated labels
                width="100%"
            />
        );
    };

    return (
        <Card className={cn("w-full")}> 
            <CardHeader>
                <CardTitle>Behavioral Patterns by Business Unit</CardTitle>
                <CardDescription>Total incidents aggregated by business unit.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
