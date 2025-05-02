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
import { useGetLockHeadPhases } from '@/lib/api/endpoints/kill-chain/lock-head-phases';
import type { LockHeadPhases, PhaseSeverity, LockHeadPhase } from '@/lib/api/types';

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// Define colors for severity levels
const SEVERITY_COLORS: Record<PhaseSeverity, string> = {
    'Low': '#22c55e',      // green-500
    'Medium': '#f59e0b',   // amber-500
    'High': '#f97316',     // orange-500
    'Critical': '#ef4444'  // red-500
};

// Main component
const LockHeadPhasesChart: React.FC = () => {
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
    const { data: lockHeadPhasesResponse, isLoading, error, isError } = useGetLockHeadPhases(queryParams);

    // Process data for the chart
    const chartData = useMemo(() => {
        // Get data array from the response
        const dataArray = lockHeadPhasesResponse?.data;
        
        // Ensure we have valid data
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return { phases: [], series: [] };
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
            return { phases: [], series: [] };
        }

        // Extract unique phases and order them according to the kill chain sequence
        const phaseOrder: LockHeadPhase[] = [
            "Reconnaissance",
            "Weaponization",
            "Delivery",
            "Exploitation",
            "Installation",
            "Command and Control (C&C)",
            "Actions on Objectives"
        ];
        
        // Extract phases present in the filtered data
        const phasesInData = new Set(filteredData.map(item => item.phase));
        const phases = phaseOrder.filter(phase => phasesInData.has(phase));
        
        // Prepare series data for each severity
        const severities: PhaseSeverity[] = ["Critical", "High", "Medium", "Low"];
        
        // Create a map to store scores by phase and severity
        const scoresByPhaseAndSeverity: Record<string, Record<PhaseSeverity, number>> = {};
        
        // Initialize all phases with zero scores
        phases.forEach(phase => {
            scoresByPhaseAndSeverity[phase] = {
                'Low': 0,
                'Medium': 0,
                'High': 0,
                'Critical': 0
            };
        });
        
        // Populate scores from filtered data
        filteredData.forEach(item => {
            item.severities.forEach(severityItem => {
                scoresByPhaseAndSeverity[item.phase][severityItem.severity] += severityItem.score;
            });
        });
        
        // Convert to series format for ApexCharts
        const series = severities.map(severity => ({
            name: severity,
            data: phases.map(phase => scoresByPhaseAndSeverity[phase][severity] || 0)
        }));
        
        return { phases, series };
    }, [lockHeadPhasesResponse, month, year]);

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
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: chartData.phases,
                labels: {
                    style: {
                        colors: textColor,
                        fontFamily: 'inherit',
                    },
                    rotate: -45,
                    trim: false
                },
                title: {
                    text: 'Kill Chain Phases',
                    style: {
                        color: textColor,
                        fontFamily: 'inherit',
                        fontWeight: 400,
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
                        fontWeight: 400,
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
            colors: [
                SEVERITY_COLORS.Critical,
                SEVERITY_COLORS.High,
                SEVERITY_COLORS.Medium,
                SEVERITY_COLORS.Low
            ],
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

    // Render content logic
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
                        Failed to load Lock Head Phases data: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            );
        }

        if (chartData.phases.length === 0 || chartData.series.length === 0) {
            return (
                <Alert className="max-w-md border-none text-center mx-auto my-4">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        There is no Lock Head Phases data to display for the selected period.
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
                <CardTitle>Kill Chain Phase Analysis</CardTitle>
                <CardDescription>Distribution of scores by severity across kill chain phases</CardDescription>
            </CardHeader>
            <CardContent className="">
                {renderContent()} 
            </CardContent>
        </Card>
    );
};

export default LockHeadPhasesChart;
