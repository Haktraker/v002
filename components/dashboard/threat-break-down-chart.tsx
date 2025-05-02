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
import { useGetThreatBreakDowns } from '@/lib/api/endpoints/kill-chain/threat-break-down';
import type { ThreatBreakDown, ThreatBreakDownType } from '@/lib/api/types';

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// Define colors for threat types
const THREAT_TYPE_COLORS: Record<ThreatBreakDownType, string> = {
    'Threat Type Distribution': '#3b82f6',     // blue-500
    'Kill Chain Phase Distribution': '#8b5cf6', // violet-500
    'Mitigation Status': '#10b981',            // emerald-500
    'Attack Vector Breakdown': '#f97316'       // orange-500
};

// Main Component
const ThreatBreakDownChart: React.FC = () => {
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
    const { data: threatBreakDownResponse, isLoading, error, isError } = useGetThreatBreakDowns(queryParams);

    // Process data for chart
    const chartData = useMemo(() => {
        // Get data array from the response
        const dataArray = threatBreakDownResponse?.data;
        
        // Ensure we have valid data
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return { threatTypes: [], series: [] };
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
            return { threatTypes: [], series: [] };
        }

        // Group data by threat type and sum scores
        const threatTypeGroups: Record<ThreatBreakDownType, number> = {
            'Threat Type Distribution': 0,
            'Kill Chain Phase Distribution': 0,
            'Mitigation Status': 0,
            'Attack Vector Breakdown': 0
        };
        
        // Sum scores for each threat type
        filteredData.forEach(item => {
            threatTypeGroups[item.threatType] += item.score;
        });

        // Convert data for pie chart format
        const threatTypes = Object.keys(threatTypeGroups).filter(key => threatTypeGroups[key as ThreatBreakDownType] > 0) as ThreatBreakDownType[];
        const series = threatTypes.map(type => threatTypeGroups[type]);
        
        return { threatTypes, series };
    }, [threatBreakDownResponse, month, year]);

    // Chart options
    const chartOptions: ApexOptions = useMemo(() => {
        const textColor = isDark ? '#e2e8f0' : '#475569';
        const chartThemeMode = isDark ? 'dark' : 'light';
        
        return {
            chart: {
                type: 'pie',
                height: 350,
                toolbar: {
                    show: false
                },
                background: 'transparent',
                foreColor: textColor
            },
            labels: chartData.threatTypes,
            colors: chartData.threatTypes.map(type => THREAT_TYPE_COLORS[type]),
            dataLabels: {
                enabled: true,
                formatter: function(val, opts) {
                    return `${Math.round(Number(val))}%`;
                },
                style: {
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    fontWeight: 'bold'
                },
                dropShadow: {
                    enabled: false
                }
            },
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '14px',
                fontFamily: 'inherit',
                labels: {
                    colors: textColor
                },
                markers: {
                    offsetX: -3
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                }
            },
            tooltip: {
                theme: chartThemeMode,
                y: {
                    formatter: function(val) {
                        return val.toString();
                    }
                }
            },
            stroke: {
                width: 2
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            height: 280
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            ],
            theme: {
                mode: chartThemeMode
            }
        };
    }, [chartData, isDark]);

    // Render content
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
                        Failed to load threat breakdown data: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            );
        }

        if (chartData.threatTypes.length === 0 || chartData.series.length === 0) {
            return (
                <Alert className="max-w-md border-none text-center mx-auto my-4">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        There is no threat breakdown data to display for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ReactApexChart
                options={chartOptions}
                series={chartData.series}
                type="pie"
                height={350}
                width="100%"
            />
        );
    };

    // Return Card structure
    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <CardTitle>Threat Breakdown</CardTitle>
                <CardDescription>Distribution of security threats by category</CardDescription>
            </CardHeader>
            <CardContent className="">
                {renderContent()} 
            </CardContent>
        </Card>
    );
};

export default ThreatBreakDownChart;
