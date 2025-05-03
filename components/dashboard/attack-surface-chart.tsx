'use client';

import { useMemo } from 'react';
import { useGetAttackSurfaces } from '@/lib/api/endpoints/attack-surface/attack-surface';
import { AttackSurface, AttackSurfaceStatus } from '@/lib/api/types';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { MONTHS } from '@/lib/constants/months-list'; // Use abbreviated months
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO, format, getYear, getMonth } from 'date-fns';

// Dynamically import ApexCharts
const ApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
});

// --- Constants ---
const STATUS_KEYS: AttackSurfaceStatus[] = ['investigating', 'resolved', 'unresolved'];

const STATUS_NAMES: Record<AttackSurfaceStatus, string> = {
    investigating: 'Investigating',
    resolved: 'Resolved',
    unresolved: 'Unresolved'
};

// Define colors for each status (example colors, adjust as needed)
const STATUS_COLORS: Record<AttackSurfaceStatus, string> = {
    investigating: '#f97316', // orange-500
    resolved: '#22c55e',    // green-500
    unresolved: '#ef4444',   // red-500
};

// --- Helper Functions ---

/**
 * Aggregates attack surface data by month and status.
 */
const aggregateDataByMonthStatus = (data: AttackSurface[] | undefined) => {
    if (!data) return { aggregated: new Map(), sortedMonths: [] };

    const aggregated = new Map<string, Record<AttackSurfaceStatus, number>>(); // Key: "YYYY-MM"

    data.forEach(item => {
        if (!item.detectionTime) return; // Skip items without a detection time

        try {
            const date = parseISO(item.detectionTime);
            const year = getYear(date);
            const month = getMonth(date); // 0-indexed month
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // Format as YYYY-MM

            if (!aggregated.has(monthKey)) {
                aggregated.set(monthKey, {
                    investigating: 0,
                    resolved: 0,
                    unresolved: 0
                });
            }

            const currentMonthData = aggregated.get(monthKey)!;
            const status = item.status || 'unresolved'; // Default to unresolved if status is missing
            if (STATUS_KEYS.includes(status)) {
                currentMonthData[status]++;
            }
        } catch (e) {
            console.error("Error parsing detectionTime:", item.detectionTime, e);
            // Optionally handle invalid dates, e.g., group under "Invalid Date" key
        }
    });

    // Sort months chronologically
    const sortedMonths = Array.from(aggregated.keys()).sort();

    return { aggregated, sortedMonths };
};

/**
 * Generates ApexCharts options for a stacked bar chart.
 */
const getChartOptions = (categories: string[], isDark: boolean): ApexOptions => {
    const textColor = isDark ? '#e2e8f0' : '#475569';
    const gridBorderColor = isDark ? '#374151' : '#e5e7eb';
    const chartThemeMode = isDark ? 'dark' : 'light';

    // Format month keys (YYYY-MM) into readable labels (e.g., Jan 2023)
    const formattedCategories = categories.map(monthKey => {
        try {
            const [year, month] = monthKey.split('-').map(Number);
            return `${MONTHS[month - 1]} ${year}`;
        } catch {
            return monthKey; // Fallback to key if parsing fails
        }
    });

    return {
        chart: {
            type: 'bar',
            height: 300,
            stacked: true,
            zoom: { enabled: false },
            toolbar: { show: false },
            background: 'transparent',
            foreColor: textColor,
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: false,
        },
        xaxis: {
            categories: formattedCategories,
            title: {
                 text: 'Month',
                 style: { color: textColor, fontFamily: 'inherit', fontWeight: 500 }
            },
            labels: {
                 style: { colors: textColor, fontFamily: 'inherit' },
                 trim: true, // Allow trimming if labels overlap
            },
            axisBorder: { color: gridBorderColor },
            axisTicks: { color: gridBorderColor },
        },
        yaxis: {
            title: {
                text: 'Count',
                style: { color: textColor, fontFamily: 'inherit', fontWeight: 500 }
            },
            labels: {
                style: { colors: textColor, fontFamily: 'inherit' },
                 formatter: function (val: number) {
                    // Display only whole numbers for counts
                    return val.toFixed(0);
                }
            },
        },
        tooltip: {
            theme: chartThemeMode,
            shared: true,
            intersect: false,
            y: {
                formatter: function (val: number, { seriesIndex, w }) {
                    const seriesName = w.globals.seriesNames[seriesIndex];
                    if (typeof val !== 'number') return 'N/A';
                    // Show count and status name in tooltip
                    return `${val.toFixed(0)} (${seriesName})`;
                }
            },
            style: { fontFamily: 'inherit' },
        },
        legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            fontFamily: 'inherit',
            labels: { colors: textColor },
            markers: {
                size: 8,
                shape: 'square',
                offsetX: -4
            },
            itemMargin: {
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
        colors: STATUS_KEYS.map(key => STATUS_COLORS[key]), // Use status colors
         fill: {
             opacity: 1
         },
    };
};


// --- Main Component ---

export default function AttackSurfaceChart() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { selectedMonth, selectedYear } = useGlobalFilter();

    // Prepare query params based on global filters
    // Note: The API hook expects startDate and endDate, not month/year directly.
    // We fetch ALL data for now and let the aggregation function handle month grouping.
    // If the API supports filtering by month/year, adjust the hook and params.
     const queryParams = useMemo(() => ({
         // No date filters here for now, fetching all relevant data
         // Add startDate/endDate if needed based on selectedMonth/Year and API capability
         // status: undefined, // Filter by status if needed via UI
     }), [/* selectedMonth, selectedYear */]); // Remove dependency if fetching all

    const { data: attackSurfaceData, isLoading, error, isError } = useGetAttackSurfaces(queryParams);

    // Aggregate and transform data
    const { categories, series } = useMemo(() => {
        // Filter data based on selectedMonth and selectedYear *after* fetching
        const filteredData = attackSurfaceData?.filter(item => {
            if (!item.detectionTime) return false;
            if (selectedMonth === 'All' && selectedYear === 'All') return true;
            try {
                const date = parseISO(item.detectionTime);
                const itemYear = getYear(date);
                const itemMonth = getMonth(date) + 1; // 1-indexed month
                const yearMatch = selectedYear === 'All' || itemYear === Number(selectedYear);
                const monthMatch = selectedMonth === 'All' || MONTHS[itemMonth - 1] === selectedMonth;
                return yearMatch && monthMatch;
            } catch {
                return false; // Exclude if date parsing fails
            }
        });

        const { aggregated, sortedMonths } = aggregateDataByMonthStatus(filteredData);

        if (sortedMonths.length === 0) {
            return { categories: [], series: [] };
        }

        const cats = sortedMonths; // Use YYYY-MM keys for internal logic

        const srs = STATUS_KEYS.map(statusKey => ({
            name: STATUS_NAMES[statusKey],
            data: sortedMonths.map(monthKey => aggregated.get(monthKey)?.[statusKey] || 0)
        }));

        return { categories: cats, series: srs };
    }, [attackSurfaceData, selectedMonth, selectedYear]);

    // Memoize chart options
    const chartOptions = useMemo(() => getChartOptions(categories, isDark), [categories, isDark]);

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[350px] w-full" />;
        }

        if (isError) {
            return (
                <Alert variant="destructive" className="mx-auto my-4 max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Chart</AlertTitle>
                    <AlertDescription>
                        Failed to load attack surface data: {error instanceof Error ? error.message : 'Unknown error'}
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
                        There is no attack surface data to display for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ApexChart
                options={chartOptions}
                series={series}
                type="bar"
                height={350}
                width="100%"
            />
        );
    };

    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <CardTitle>Attack Surface Status Over Time</CardTitle>
                <CardDescription>Count of attack surfaces by status per month.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
