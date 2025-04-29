'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAnomalyCategoryDistributions } from '@/lib/api/endpoints/user-behavior-analytics/anomaly-category-distribution';
import type { AnomalyCategoryDistribution, AnomalyCategoryName } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// --- Color Palette --- Define a palette for categories
const COLOR_PALETTE = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#14b8a6', // teal-500
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
];

interface ChartData {
    series: { name: string; data: number[] }[];
    categories: AnomalyCategoryName[];
    colors: string[]; // Add colors array
}

// Helper function to process data for the chart
const processChartData = (data: AnomalyCategoryDistribution[] | undefined): ChartData => {
    if (!data || data.length === 0) {
        return { series: [], categories: [], colors: [] };
    }

    const aggregatedData: { [key in AnomalyCategoryName]?: number } = {};

    data.forEach(item => {
        aggregatedData[item.name] = (aggregatedData[item.name] || 0) + item.value;
    });

    // Sort categories alphabetically for consistency
    const categories = Object.keys(aggregatedData).sort() as AnomalyCategoryName[];
    const seriesData = categories.map(cat => aggregatedData[cat] || 0);

    // Assign colors from the palette based on sorted category order
    const colors = categories.map((_, index) => COLOR_PALETTE[index % COLOR_PALETTE.length]);

    return {
        series: [{ name: 'Count', data: seriesData }],
        categories: categories,
        colors: colors,
    };
};

// --- Chart Options --- Function to generate options based on theme and data
const getChartOptions = (categories: string[], colors: string[], isDark: boolean): ApexOptions => {
    const textColor = isDark ? '#e2e8f0' : '#475569'; // Consistent text color logic
    const gridBorderColor = isDark ? '#374151' : '#e5e7eb'; // Consistent grid color logic
    const chartThemeMode = isDark ? 'dark' : 'light';

    return {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: false,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                },
            },
            background: 'transparent',
            foreColor: textColor // Use theme-based text color
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 5,
                distributed: true, // Important for applying different colors to each bar
            },
        },
        colors: colors, // Use dynamically assigned colors
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: false, // Often not needed for distributed bars
        },
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    colors: textColor, // Use theme-based text color
                    fontFamily: 'inherit',
                },
                trim: false,
            },
            title: {
                text: 'Anomaly Category',
                style: {
                    color: textColor, // Use theme-based text color
                    fontFamily: 'inherit',
                    fontWeight: 500,
                }
            },
            axisBorder: { color: gridBorderColor },
            axisTicks: { color: gridBorderColor },
        },
        yaxis: {
            title: {
                text: 'Count',
                style: {
                    color: textColor, // Use theme-based text color
                    fontFamily: 'inherit',
                    fontWeight: 500,
                }
            },
            labels: {
                style: {
                    colors: textColor, // Use theme-based text color
                    fontFamily: 'inherit',
                },
                 formatter: function (val: number) {
                     // Ensure whole numbers are displayed without decimals
                    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
                }
            },
        },
        fill: {
            opacity: 1,
        },
        tooltip: {
            theme: chartThemeMode, // Use theme-based tooltip
            shared: true,
            intersect: false,
            style: { fontFamily: 'inherit' },
            y: {
                formatter: (val) => `${val} occurrences`,
            },
        },
        grid: {
            borderColor: gridBorderColor, // Use theme-based grid color
            strokeDashArray: 3,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
        },
        legend: {
             show: false // Hide legend as colors are directly on bars (distributed: true)
        },
        theme: {
            mode: chartThemeMode // Set overall theme mode
        }
    };
};

// --- Main Component ---
export const AnomalyCategoryDistributionChart: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { selectedMonth, selectedYear } = useGlobalFilter(); // Use global filter

    // Prepare query params based on global filter
    const queryParams = useMemo(() => ({
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    }), [selectedMonth, selectedYear]);

    const { data: apiResponse, isLoading, error, isError } = useGetAnomalyCategoryDistributions(queryParams);

    // Process data using the updated helper
    const chartData = useMemo(() => processChartData(apiResponse?.data), [apiResponse]);

    // Generate chart options using the updated function
    const chartOptions = useMemo(() => getChartOptions(chartData.categories, chartData.colors, isDark), [chartData, isDark]);

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[350px] w-full" />; // Standard loading skeleton
        }

        if (isError) {
            return (
                <Alert variant="destructive" className="mx-auto my-4 max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Chart</AlertTitle>
                    <AlertDescription>
                        Failed to load anomaly category data: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            );
        }

        if (chartData.series.length === 0 || chartData.series[0].data.every(d => d === 0)) {
             return (
                <Alert className="max-w-md border-none text-center mx-auto my-4">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        There is no anomaly category distribution data to display for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ReactApexChart
                options={chartOptions}
                series={chartData.series}
                type="bar"
                height={350}
                width="100%"
            />
        );
    };

    return (
        <Card className={cn("w-full")}>
             <CardHeader>
                 <CardTitle>Anomaly Category Distribution</CardTitle>
                 <CardDescription>Distribution of detected anomaly categories.</CardDescription>
             </CardHeader>
             <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()}
             </CardContent>
        </Card>
    );
};
