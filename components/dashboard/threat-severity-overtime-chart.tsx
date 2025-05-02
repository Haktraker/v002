'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { useGetThreatSeverityOverTimes } from '@/lib/api/endpoints/kill-chain/threat-severity-overtime';
import type { ThreatSeverityItem, ThreatSeverityLevel, ThreatSeverityOverTime } from '@/lib/api/types';

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// Order for display
const SEVERITY_ORDER: ThreatSeverityLevel[] = [
    "Low", 
    "Medium", 
    "High", 
    "Critical"
];

// Color mapping for severities
const SEVERITY_COLORS: Record<ThreatSeverityLevel, string> = {
    "Low": "#22c55e",     // Green
    "Medium": "#f59e0b",  // Amber
    "High": "#f97316",    // Orange
    "Critical": "#ef4444" // Red
};

// Main Component
const ThreatSeverityOvertimeChart: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { selectedMonth, selectedYear } = useGlobalFilter();
    const [selectedSeverity, setSelectedSeverity] = useState<ThreatSeverityLevel | null>(null);

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
    const { data: severityResponse, isLoading, error, isError, refetch } = useGetThreatSeverityOverTimes(queryParams);

    // Process data for chart
    const chartData = useMemo(() => {
        // Get data array from the response
        const dataArray = severityResponse?.data;
        
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

        // Process the data into series format for stacked bar chart
        const series = SEVERITY_ORDER.map(severity => {
            return {
                name: severity,
                data: filteredData.map(item => {
                    const severityItem = item.severities.find(s => s.severity === severity);
                    return severityItem?.count || 0;
                })
            };
        }).filter(series => series.data.some(value => value > 0)); // Only include series with data

        // Create labels/categories from months and years
        const categories = filteredData.map(item => `${item.month} ${item.year}`);
        
        return { categories, series };
    }, [severityResponse, month, year]);

    // Handle chart click 
    const handleChartClick = (_: any, __: any, config: { seriesIndex: number }) => {
        const seriesIndex = config.seriesIndex;
        if (seriesIndex >= 0 && seriesIndex < chartData.series.length) {
            const severity = chartData.series[seriesIndex].name as ThreatSeverityLevel;
            setSelectedSeverity(selectedSeverity === severity ? null : severity);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        refetch();
        setSelectedSeverity(null);
    };

    // Chart options
    const chartOptions: ApexOptions = useMemo(() => {
        const textColor = isDark ? '#e2e8f0' : '#475569';
        const borderColor = isDark ? '#334155' : '#e5e7eb';
        const chartThemeMode = isDark ? 'dark' : 'light';
        
        return {
            chart: {
                type: 'bar',
                height: 350,
                stacked: true,
                toolbar: {
                    show: false
                },
                background: 'transparent',
                foreColor: textColor,
                events: {
                    dataPointSelection: handleChartClick
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 4,
                    columnWidth: '70%',
                    dataLabels: {
                        position: 'top',
                    },
                }
            },
            colors: SEVERITY_ORDER.map(severity => 
                selectedSeverity === severity 
                    ? SEVERITY_COLORS[severity] // Full opacity for selected
                    : selectedSeverity 
                        ? `${SEVERITY_COLORS[severity]}80` // 50% opacity for non-selected when something is selected  
                        : SEVERITY_COLORS[severity] // Full opacity when nothing is selected
            ),
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: 1,
                colors: ['transparent']
            },
            grid: {
                show: true,
                borderColor: borderColor,
                xaxis: {
                    lines: {
                        show: false
                    }
                }
            },
            xaxis: {
                categories: chartData.categories,
                labels: {
                    style: {
                        colors: Array(chartData.categories.length).fill(textColor),
                        fontSize: '12px',
                        fontFamily: 'inherit'
                    },
                    rotate: -45,
                    rotateAlways: false,
                    trim: true,
                    maxHeight: 120
                }
            },
            yaxis: {
                title: {
                    text: 'Threat Count',
                    style: {
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        color: textColor
                    }
                },
                labels: {
                    formatter: function(val) {
                        return val.toFixed(0);
                    },
                    style: {
                        colors: [textColor],
                        fontSize: '12px',
                        fontFamily: 'inherit'
                    }
                }
            },
            tooltip: {
                theme: chartThemeMode,
                y: {
                    formatter: function(val: number) {
                        return val.toString();
                    }
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '14px',
                fontFamily: 'inherit',
                offsetY: 10,
                labels: {
                    colors: textColor
                },
                markers: {
                    size: 12,
                    strokeWidth: 0,
                    fillColors: undefined,
                    offsetX: -3
                },
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                }
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        legend: {
                            position: 'bottom',
                            offsetY: 0
                        }
                    }
                }
            ],
            theme: {
                mode: chartThemeMode
            }
        };
    }, [chartData, isDark, selectedSeverity, handleChartClick]);

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
                        Failed to load threat severity data: {error instanceof Error ? error.message : 'Unknown error'}
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
                        There is no threat severity data to display for the selected period.
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

    // Return Card structure
    return (
        <Card className={`flex flex-col ${isDark ? 'bg-[#171727] border-0' : 'bg-white'}`}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col">
                    <CardTitle className="text-base font-medium">Threat Severity Over Time</CardTitle>
                    <CardDescription>Distribution of threat severity levels across time periods</CardDescription>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleRefresh} 
                    className="ml-auto" 
                    title="Refresh data"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center pt-4 min-h-[382px]">
                {renderContent()} 
                {selectedSeverity !== null && (
                    <div className="mt-4 text-center text-sm">
                        <p className="font-medium">
                            Selected: {selectedSeverity} Severity
                        </p>
                        <p className="text-muted-foreground">
                            Click on the same series again to reset view
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ThreatSeverityOvertimeChart;
