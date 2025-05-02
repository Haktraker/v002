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
import { useGetThreatImpactOverviews } from '@/lib/api/endpoints/kill-chain/threat-impact-overview';
import type { ThreatImpactOverview, ThreatPhase } from '@/lib/api/types';

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// Define colors for phases
const PHASE_COLORS: Record<ThreatPhase, string> = {
    "Threats Blocked": '#22c55e',      // green-500
    "Active Critical Threats": '#ef4444', // red-500
    "Ongoing Investigations": '#eab308',   // yellow-500
    "Resolved Threats": '#3b82f6',     // blue-500
};

// Main Component
const ThreatImpactOverviewChart: React.FC = () => {
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
    const { data: threatImpactResponse, isLoading, error, isError } = useGetThreatImpactOverviews(queryParams);

    // Process data for chart
    const chartData = useMemo(() => {
        // Get data array from the response
        const dataArray = threatImpactResponse?.data;
        
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

        // For the threat impact overview, we'll group by phase and show score
        const phaseGroups: Record<ThreatPhase, number> = {
            "Threats Blocked": 0,
            "Active Critical Threats": 0,
            "Ongoing Investigations": 0,
            "Resolved Threats": 0
        };
        
        // Sum up scores for each phase
        filteredData.forEach(item => {
            phaseGroups[item.phase] += item.score;
        });
        
        // Convert to series format (array of objects with name and data properties)
        const series = Object.entries(phaseGroups).map(([phase, score]) => ({
            name: phase,
            data: [score]
        }));
        
        return {
            categories: ['Threat Impact'],
            series
        };
    }, [threatImpactResponse, month, year]);

    // Chart options
    const chartOptions: ApexOptions = useMemo(() => {
        const textColor = isDark ? '#e2e8f0' : '#475569';
        const gridBorderColor = isDark ? '#374151' : '#e5e7eb';
        const chartThemeMode = isDark ? 'dark' : 'light';

        return {
            chart: {
                type: 'bar',
                height: 350,
                stacked: true,
                toolbar: {
                    show: false,
                },
                background: 'transparent',
                foreColor: textColor
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 5,
                    columnWidth: '55%',
                    dataLabels: {
                        position: 'center',
                    },
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function(val: number) {
                    return val.toFixed(0);
                },
                style: {
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    colors: [isDark ? '#ffffff' : '#000000']
                },
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: chartData.categories,
                labels: {
                    style: {
                        colors: textColor,
                        fontFamily: 'inherit',
                    }
                },
                axisBorder: { color: gridBorderColor },
                axisTicks: { color: gridBorderColor },
            },
            yaxis: {
                title: {
                    text: 'Score',
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
                    formatter: (val) => val.toFixed(0)
                }
            },
            colors: Object.values(PHASE_COLORS),
            fill: {
                opacity: 1
            },
            tooltip: {
                theme: chartThemeMode,
                y: {
                    formatter: (val) => `Score: ${val}`
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
                        Failed to load threat impact data: {error instanceof Error ? error.message : 'Unknown error'}
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
                        There is no threat impact data to display for the selected period.
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

    // Return card structure
    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <CardTitle>Threat Impact Overview</CardTitle>
                <CardDescription>Distribution of threat impact scores by phase</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()} 
            </CardContent>
        </Card>
    );
};

export default ThreatImpactOverviewChart;
