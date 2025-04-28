'use client';

import { useMemo } from 'react';
import { useGetUserRiskTimelines } from '@/lib/api/endpoints/user-behavior-analytics/user-risk-timeline';
import { UserRiskTimeline, UserRiskSeverity } from '@/lib/api/types';
import { MONTHS } from '@/lib/constants/months-list';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
const SEVERITY_LEVELS: UserRiskSeverity[] = ["low", "medium", "high", "critical"];

const SEVERITY_COLORS: Record<UserRiskSeverity, string> = {
    low: '#22c55e',    // green-500
    medium: '#facc15',  // yellow-400
    high: '#f97316',    // orange-500
    critical: '#ef4444', // red-500
};

// Helper to convert month name to number for sorting
const monthNameToNumber = (monthName: string): number => {
    return MONTHS.indexOf(monthName);
};

// --- Helper Functions ---

/**
 * Aggregates raw timeline data by month/year and severity.
 */
const aggregateTimelineData = (data: UserRiskTimeline[] | undefined) => {
    if (!data) return { aggregated: new Map(), sortedKeys: [] };

    const aggregated = new Map<string, Record<UserRiskSeverity, number>>();

    data.forEach(item => {
        const { month, year, day, severity, count } = item.risk;
        const key = `${year}-${monthNameToNumber(month).toString().padStart(2, '0')}`; // Key for sorting (YYYY-MM)

        if (!aggregated.has(key)) {
            aggregated.set(key, { low: 0, medium: 0, high: 0, critical: 0 });
        }

        const currentMonthData = aggregated.get(key)!;
        currentMonthData[severity] = (currentMonthData[severity] || 0) + count;
    });

    // Sort keys chronologically
    const sortedKeys = Array.from(aggregated.keys()).sort();

    return { aggregated, sortedKeys };
};

/**
 * Generates ApexCharts options based on theme and categories.
 */
const getChartOptions = (categories: string[], isDark: boolean): ApexOptions => {
    const textColor = isDark ? '#e2e8f0' : '#475569'; // slate-200 / slate-600
    const gridBorderColor = isDark ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
        chart: {
            type: 'line',
            height: 300,
            zoom: { enabled: false },
            toolbar: { show: false },
            background: 'transparent',
            foreColor: textColor,
        },
        stroke: {
            curve: 'smooth',
            width: 3, // Slightly thicker line for visibility
        },
        markers: {
            size: 0, // Hide markers by default
             hover: {
                size: 5 // Show marker on hover
            }
        },
        xaxis: {
            categories: categories,
            title: {
                // text: 'Month & Year', // Optional X-axis title
                style: { color: textColor, fontFamily: 'inherit' }
            },
            labels: { style: { colors: textColor, fontFamily: 'inherit' } },
            axisBorder: { color: gridBorderColor },
            axisTicks: { color: gridBorderColor },
        },
        yaxis: {
            title: {
                text: 'Risk Event Count',
                style: { color: textColor, fontFamily: 'inherit', fontWeight: 500 }
            },
            labels: {
                style: { colors: textColor, fontFamily: 'inherit' },
                 formatter: function (val: number) {
                    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1); // Integer counts
                }
            },
        },
        tooltip: {
            theme: chartThemeMode,
            shared: true, // Show tooltip for all series at a point
            intersect: false,
            y: {
                formatter: function (val: number) {
                    if (typeof val !== 'number') return 'N/A';
                    return val.toFixed(0) + " Events"; // Tooltip formatting
                }
            },
            style: { fontFamily: 'inherit' },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontFamily: 'inherit',
            labels: { colors: textColor },
            markers: { 
                size: 10 // Use size for markers
            }
        },
        grid: {
            borderColor: gridBorderColor,
            strokeDashArray: 3,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
        },
        colors: SEVERITY_LEVELS.map(level => SEVERITY_COLORS[level]), // Use defined colors
        fill: { // Gradient Configuration
            type: 'gradient',
            gradient: {
                shade: isDark ? 'dark' : 'light',
                type: "vertical", // Or "horizontal"
                shadeIntensity: 0.5,
                gradientToColors: undefined, // Let ApexCharts calculate end color based on `colors`
                inverseColors: true,
                opacityFrom: 0.6, // Start opacity for gradient
                opacityTo: 0.1, // End opacity for gradient
                stops: [0, 90, 100], // Control gradient stops
            }
        },
         dataLabels: {
            enabled: false // Usually looks cleaner without labels on lines
        },
    };
};


// --- Main Component ---

export default function UserRiskTimelineChart() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Prepare query params - Remove month/year filters, keep high limit
    const queryParams = useMemo(() => ({
        limit: 10000, 
    }), []);

    // Fetch data - Pass only the limit param (or no params if limit isn't strictly needed)
    const {
        data: paginatedData,
        isLoading,
        error,
        isError
    } = useGetUserRiskTimelines(queryParams); // Fetch without month/year filters

    // console.log(paginatedData,"paginatedData"); // Keep console log if needed for debugging

    // Process and aggregate data
    const { categories, series } = useMemo(() => {
        const { aggregated, sortedKeys } = aggregateTimelineData(paginatedData?.data);

        if (sortedKeys.length === 0) {
            return { categories: [], series: [] };
        }

        const cats = sortedKeys.map(key => {
            const [year, monthNum] = key.split('-');
            return `${MONTHS[parseInt(monthNum)].substring(0, 3)} ${year}`;
        });

        const srs = SEVERITY_LEVELS.map(level => ({
            name: level.charAt(0).toUpperCase() + level.slice(1), // Capitalize severity name
            data: sortedKeys.map(key => aggregated.get(key)![level] || 0),
        }));

        return { categories: cats, series: srs };
    }, [paginatedData]);

    // Memoize chart options
    const chartOptions = useMemo(() => getChartOptions(categories, isDark), [categories, isDark]);

    // --- Render Logic ---

    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[300px] w-full" />;
        }

        if (isError) {
            return (
                <Alert variant="destructive" className="mx-auto my-4 max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Chart</AlertTitle>
                    <AlertDescription>
                        Failed to load user risk timeline data: {error instanceof Error ? error.message : 'Unknown error'}
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
                        There is no user risk timeline data to display.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ApexChart
                options={chartOptions}
                series={series}
                type="line"
                height={300} // Height from options
                width="100%"
            />
        );
    };

    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <CardTitle>User Risk Timeline</CardTitle>
                 {/* <CardDescription>Timeline of aggregated user risk events.</CardDescription> */}
            </CardHeader>
            <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
