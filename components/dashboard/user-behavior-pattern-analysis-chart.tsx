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
import { useGetUserBehaviorPatternAnalyses } from '@/lib/api/endpoints/user-behavior-analytics/user-behavior-pattern-analysis';
import type { UserBehaviorPatternAnalysis } from '@/lib/api/types';

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// Main Component
const UserBehaviorPatternAnalysisChart: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { selectedMonth, selectedYear } = useGlobalFilter();

    // Convert 'All' value to undefined and directly work with specific values only
    const month = selectedMonth === 'All' ? undefined : selectedMonth;
    const year = selectedYear === 'All' ? undefined : selectedYear;

    // Define query parameters
    const queryParams = useMemo(() => {
        const params: any = {};
        if (month) params.month = month;
        if (year) params.year = year;
        return params;
    }, [month, year]);

    // Fetch data
    const { data: behaviorPatternResponse, isLoading, error, isError } = useGetUserBehaviorPatternAnalyses(queryParams);

    // Process data for the radar chart
    const chartData = useMemo(() => {
        // Get data array from the response
        const dataArray = behaviorPatternResponse?.data;
        
        // Ensure we have valid data
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return { categories: [], series: [] };
        }
        
        // Client-side filtering if necessary
        const filteredData = dataArray.filter(item => {
            // If both month and year are undefined (All selected), return all data
            if (!month && !year) return true;
            
            // If only month is defined, filter by month only
            if (month && !year) return item.month === month;
            
            // If only year is defined, filter by year only
            if (!month && year) return item.year === year;
            
            // If both are defined, filter by both
            return item.month === month && item.year === year;
        });
        
        // If no data after filtering, return empty dataset
        if (filteredData.length === 0) {
            return { categories: [], series: [] };
        }

        // Extract unique categories for radar chart labels
        const categories = [...new Set(filteredData.map(item => item.category))];
        
        // Prepare series data for Normal and Suspicious
        const normalData = categories.map(category => {
            const matchingItem = filteredData.find(item => item.category === category);
            return matchingItem ? matchingItem.Normal : 0;
        });
        
        const suspiciousData = categories.map(category => {
            const matchingItem = filteredData.find(item => item.category === category);
            return matchingItem ? matchingItem.Suspicious : 0;
        });
        
        // Return processed data
        return {
            categories,
            series: [
                { name: 'Normal', data: normalData },
                { name: 'Suspicious', data: suspiciousData }
            ]
        };
    }, [behaviorPatternResponse, month, year]);

    // Chart options
    const chartOptions: ApexOptions = useMemo(() => {
        const textColor = isDark ? '#e2e8f0' : '#475569';
        const gridBorderColor = isDark ? '#374151' : '#e5e7eb';
        const chartThemeMode = isDark ? 'dark' : 'light';

        return {
            chart: {
                type: 'radar',
                height: 350,
                toolbar: {
                    show: false,
                },
                background: 'transparent',
                foreColor: textColor
            },
            xaxis: {
                categories: chartData.categories,
                labels: {
                    style: {
                        colors: Array(chartData.categories.length).fill(textColor),
                        fontFamily: 'inherit',
                    }
                }
            },
            yaxis: {
                show: true,
                labels: {
                    style: {
                        colors: textColor,
                        fontFamily: 'inherit'
                    },
                    formatter: (val) => val.toFixed(0)
                }
            },
            colors: ['#22c55e', '#ef4444'], // Green for Normal, Red for Suspicious
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: 2
            },
            fill: {
                opacity: 0.4
            },
            markers: {
                size: 4,
                hover: {
                    size: 6
                }
            },
            tooltip: {
                theme: chartThemeMode,
                y: {
                    formatter: (val) => val.toString()
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                labels: {
                    colors: textColor
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                },
                fontFamily: 'inherit'
            },
            grid: {
                borderColor: gridBorderColor,
                strokeDashArray: 3,
            },
            plotOptions: {
                radar: {
                    size: undefined,
                    polygons: {
                        strokeColors: gridBorderColor,
                        connectorColors: gridBorderColor,
                        fill: {
                            colors: ['transparent']
                        }
                    }
                }
            },
            theme: {
                mode: chartThemeMode
            }
        };
    }, [chartData, isDark]);

    // Render logic
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
                        Failed to load behavior pattern data: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            );
        }

        if (chartData.categories.length === 0 || chartData.series.length === 0) {
            return (
                <Alert className="max-w-md border-none text-center mx-auto my-4">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        There is no behavior pattern data to display for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ReactApexChart
                options={chartOptions}
                series={chartData.series}
                type="radar"
                height={350}
                width="100%"
            />
        );
    };

    // Return card structure
    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <CardTitle>User Behavior Pattern Analysis</CardTitle>
                <CardDescription>Normal vs. Suspicious behavior patterns by category</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()} 
            </CardContent>
        </Card>
    );
};

export default UserBehaviorPatternAnalysisChart;
