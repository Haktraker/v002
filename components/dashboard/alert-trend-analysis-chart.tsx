'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { useGetAlertTrendAnalyses } from '@/lib/api/endpoints/user-behavior-analytics/alert-trend-analysis';
import type { AlertTrendAnalysis, AlertTrendSeverity } from '@/lib/api/types';

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// Define colors for severity levels
const SEVERITY_COLORS: Record<AlertTrendSeverity, string> = {
    low: '#22c55e',      // green-500
    medium: '#eab308',   // yellow-500
    high: '#f97316',     // orange-500
    critical: '#ef4444' // red-500
};

// Main Component - Following HighRiskUsersChart structure
const AlertTrendAnalysisChart: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { selectedMonth, selectedYear } = useGlobalFilter();

    // Convert 'All' value to undefined and directly work with specific values only
    const month = selectedMonth === 'All' ? undefined : selectedMonth;
    const year = selectedYear === 'All' ? undefined : selectedYear;

    // Explicitly log the filter values for debugging

    // Fetch all data - we'll filter on the client side
    const { data: alertTrendAnalysisResponse, isLoading, error, isError } = useGetAlertTrendAnalyses();

    // Log the response for debugging

    // Process data exactly like HighRiskUsersChart does, following its pattern closely
    const chartData = useMemo(() => {
        // First, get the actual data array from the response, similar to how HighRiskUsersChart does it
        const dataArray = alertTrendAnalysisResponse?.data;
        
        // Log the extracted data array
        
        // Ensure we have valid data
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return { series: [], categories: [], colors: [] };
        }

        // Apply client-side filtering since backend filtering isn't working
        const filteredData = dataArray.filter(item => {
            // If both month and year are undefined (All selected), return all data
            if (!month && !year) return true;
            
            // If only month is defined, filter by month only
            if (month && !year) return item.risk.month === month;
            
            // If only year is defined, filter by year only
            if (!month && year) return item.risk.year === year;
            
            // If both are defined, filter by both
            return item.risk.month === month && item.risk.year === year;
        });
        
        
        // If no data after filtering, return empty dataset
        if (filteredData.length === 0) {
            return { series: [], categories: [], colors: [] };
        }

        // Group data by category and severity (time period and alert level)
        const groupedData: Record<string, Record<AlertTrendSeverity, number>> = {};
        const categoriesSet = new Set<string>();
        
        filteredData.forEach(item => {
            const category = `${item.risk.year}-${item.risk.month}-W${item.risk.week}`;
            categoriesSet.add(category);
            
            if (!groupedData[category]) {
                groupedData[category] = { low: 0, medium: 0, high: 0, critical: 0 };
            }
            
            groupedData[category][item.risk.severity] += item.risk.count;
        });
        
        // Sort categories chronologically
        const sortedCategories = Array.from(categoriesSet).sort();
        
        // Create series data for each severity level
        const severities: AlertTrendSeverity[] = ['critical', 'high', 'medium', 'low'];
        const series = severities.map(severity => ({
            name: severity,
            data: sortedCategories.map(category => 
                groupedData[category]?.[severity] || 0
            )
        }));
        
        
        return {
            series,
            categories: sortedCategories,
            colors: severities.map(severity => SEVERITY_COLORS[severity])
        };
    }, [alertTrendAnalysisResponse, month, year]); // Add month and year as dependencies

    // Generate chart options (Depends on processed chartData)
    const chartOptions: ApexOptions = useMemo(() => {
        const textColor = isDark ? '#e2e8f0' : '#475569';
        const gridBorderColor = isDark ? '#374151' : '#e5e7eb';
        const chartThemeMode = isDark ? 'dark' : 'light';

        return {
            chart: {
                type: 'line',
                height: 350,
                stacked: false, 
                toolbar: {
                    show: false,
                    tools: { download: true, selection: false, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true }
                },
                zoom: { enabled: true },
                background: 'transparent',
                foreColor: textColor
            },
            colors: chartData.colors,
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            markers: {
                size: 4,
                hover: {
                    size: 6
                }
            },
            xaxis: {
                categories: chartData.categories,
                labels: {
                    style: {
                        colors: textColor,
                        fontFamily: 'inherit'
                    },
                    rotate: -45,
                    trim: false,
                    hideOverlappingLabels: true,
                },
                title: {
                    text: 'Time Period (Year-Month-Week)',
                    style: {
                        color: textColor,
                        fontFamily: 'inherit',
                        fontWeight: 500,
                    }
                },
                axisBorder: { color: gridBorderColor },
                axisTicks: { color: gridBorderColor },
            },
            yaxis: {
                title: {
                    text: 'Alert Count',
                    style: {
                        color: textColor,
                        fontFamily: 'inherit',
                        fontWeight: 500,
                    }
                },
                labels: {
                    style: {
                        colors: textColor,
                        fontFamily: 'inherit'
                    },
                    formatter: (val) => val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)
                }
            },
            tooltip: {
                theme: chartThemeMode,
                shared: true,
                intersect: false,
                style: { fontFamily: 'inherit' },
                y: {
                    formatter: (val, { seriesIndex, w }) => {
                        const seriesName = w.globals.seriesNames[seriesIndex];
                        const formattedName = seriesName.charAt(0).toUpperCase() + seriesName.slice(1);
                        return `${val} ${formattedName} Alerts`;
                    }
                }
            },
            grid: {
                borderColor: gridBorderColor,
                strokeDashArray: 3,
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                fontFamily: 'inherit',
                markers: {
                    offsetX: -5,
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                },
                labels: { colors: textColor },
            },
            theme: {
                mode: chartThemeMode
            }
        };
    }, [chartData, isDark]);

    // Render logic function (Follow HighRiskUsersChart pattern)
    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[350px] w-full" />;
        }

        if (isError) {
            return (
                <Alert variant="destructive" className="mx-auto my-4 max-w-lg">
                    <Terminal className="h-4 w-4" /> 
                    <AlertTitle>Error Loading Chart</AlertTitle>
                    <AlertDescription>
                        Failed to load alert trend data: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            );
        }

        if (chartData.series.length === 0 || chartData.categories.length === 0) {
            return (
                <Alert className="max-w-md border-none text-center mx-auto my-4">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        There is no alert trend data to display for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ReactApexChart
                options={chartOptions}
                series={chartData.series}
                type="line"
                height={350}
                width="100%"
            />
        );
    };

    // Return Card structure - Follow HighRiskUsersChart pattern
    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <CardTitle>Alert Trend Analysis</CardTitle>
                <CardDescription>Trend of alert counts by severity over time.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()} 
            </CardContent>
        </Card>
    );
};

export default AlertTrendAnalysisChart;
