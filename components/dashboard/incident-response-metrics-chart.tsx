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
import { useGetIncidentResponseMetrics } from '@/lib/api/endpoints/kill-chain/incident-response-metrics';
import type { IncidentResponseMetrics, IncidentResponsePhase } from '@/lib/api/types';

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

// The order in which we want to display phases (following the kill chain sequence)
const PHASE_ORDER: IncidentResponsePhase[] = [
    "Reconnaissance",
    "Weaponization",
    "Delivery",
    "Exploitation",
    "Installation",
    "Command and Control (C&C)",
    "Actions on Objectives"
];

// Define colors for the chart
const CHART_COLORS = {
    primary: '#008FFB', // Blue color from the screenshot
    secondary: '#00E396', // Green for highlighting
    fill: {
        light: 'rgba(0, 143, 251, 0.2)', // Light blue fill from screenshot
        dark: 'rgba(0, 143, 251, 0.3)'   // Slightly more visible for dark mode
    }
};

// Main Component
const IncidentResponseMetricsChart: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { selectedMonth, selectedYear } = useGlobalFilter();
    const [selectedPhase, setSelectedPhase] = useState<IncidentResponsePhase | null>(null);

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
    const { data: metricsResponse, isLoading, error, isError, refetch } = useGetIncidentResponseMetrics(queryParams);

    // Process data for chart
    const chartData = useMemo(() => {
        // Get data array from the response
        const dataArray = metricsResponse?.data;
        
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

        // Initialize phase scores with all possible phases
        const phaseScores: Record<IncidentResponsePhase, number> = {} as Record<IncidentResponsePhase, number>;
        
        // Initialize all phases with 0
        PHASE_ORDER.forEach(phase => {
            phaseScores[phase] = 0;
        });
        
        // Sum scores for each phase
        filteredData.forEach(item => {
            item.phases.forEach(phaseItem => {
                if (phaseScores.hasOwnProperty(phaseItem.phase)) {
                    phaseScores[phaseItem.phase] += phaseItem.score;
                }
            });
        });

        // Prepare data for the radar chart, following the PHASE_ORDER sequence
        const categories = PHASE_ORDER.filter(phase => phaseScores[phase] > 0);
        const series = [{
            name: 'Response Score',
            data: categories.map(phase => phaseScores[phase])
        }];
        
        return { categories, series };
    }, [metricsResponse, month, year]);

    // Handle chart click 
    const handleChartClick = (_: any, chartContext: any, config: { dataPointIndex: number }) => {
        const index = config.dataPointIndex;
        if (index >= 0 && index < chartData.categories.length) {
            const phase = chartData.categories[index];
            setSelectedPhase(selectedPhase === phase ? null : phase);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        refetch();
        setSelectedPhase(null);
    };

    // Chart options
    const chartOptions: ApexOptions = useMemo(() => {
        const textColor = isDark ? '#e2e8f0' : '#6b7280'; // slate-200 for dark, gray-500 for light
        const gridColor = isDark ? '#4b5563' : '#e5e7eb'; // Matching business unit chart
        const chartThemeMode = isDark ? 'dark' : 'light';
        const fillColor = isDark ? CHART_COLORS.fill.dark : CHART_COLORS.fill.light;
        
        return {
            chart: {
                height: 350,
                type: 'radar',
                toolbar: {
                    show: false
                },
                background: 'transparent',
                foreColor: textColor,
                events: {
                    dataPointSelection: handleChartClick
                },
                dropShadow: {
                    enabled: true,
                    blur: 1,
                    left: 1,
                    top: 1
                }
            },
            colors: [selectedPhase ? CHART_COLORS.secondary : CHART_COLORS.primary],
            series: chartData.series,
            labels: chartData.categories,
            xaxis: {
                categories: chartData.categories,
                labels: {
                    show: true,
                    style: {
                        colors: Array(chartData.categories.length).fill(textColor),
                        fontSize: '12px',
                        fontFamily: 'inherit'
                    }
                }
            },
            yaxis: {
                show: true,
                max: Math.max(...(chartData.series[0]?.data || [0])) * 1.2 || 100, // Set max to 20% above highest value or 100 if no data
                tickAmount: 5,
                labels: {
                    formatter: function(val) {
                        return val.toFixed(0);
                    },
                    style: {
                        colors: [textColor],
                        fontSize: '11px',
                        fontFamily: 'inherit'
                    }
                }
            },
            fill: {
                opacity: 0.2,
                colors: [fillColor]
            },
            stroke: {
                width: 2,
                colors: [selectedPhase ? CHART_COLORS.secondary : CHART_COLORS.primary]
            },
            markers: {
                size: 5,
                colors: [selectedPhase ? CHART_COLORS.secondary : CHART_COLORS.primary],
                strokeWidth: 0,
                hover: {
                    size: 7
                }
            },
            grid: {
                show: false,
            },
            dataLabels: {
                enabled: false // Turn off data labels for cleaner look like in screenshot
            },
            tooltip: {
                theme: chartThemeMode,
                y: {
                    formatter: function(val: number) {
                        return val.toString();
                    }
                }
            },
            plotOptions: {
                radar: {
                    size: 140,
                    polygons: {
                        strokeColors: gridColor,
                        strokeWidth: '1',
                        connectorColors: gridColor,
                        fill: {
                            colors: isDark ? ['#374151', '#4b5563'] : ['#f9fafb', '#f3f4f6']
                        }
                    }
                }
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            height: 300
                        },
                        plotOptions: {
                            radar: {
                                size: 100
                            }
                        }
                    }
                }
            ],
            theme: {
                mode: chartThemeMode
            }
        };
    }, [chartData, isDark, selectedPhase, handleChartClick]);

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
                        Failed to load incident response metrics: {error instanceof Error ? error.message : 'Unknown error'}
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
                        There is no incident response metrics data to display for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        // Apply transformation for highlighted section if needed
        const seriesData = [...chartData.series];
        
        if (selectedPhase !== null) {
            // Find the index of the selected phase
            const phaseIndex = chartData.categories.indexOf(selectedPhase);
            
            if (phaseIndex !== -1 && seriesData[0]) {
                // Create a copy of the data for the highlighted series
                const highlightedData = [...seriesData[0].data];
                
                // Increase the highlighted point's value by 10% for visual emphasis
                highlightedData[phaseIndex] = Math.round(highlightedData[phaseIndex] * 1.1);
                
                // Return chart with highlighted data
                return (
                    <ReactApexChart
                        options={chartOptions}
                        series={[{ name: seriesData[0].name, data: highlightedData }]}
                        type="radar"
                        height={350}
                        width="100%"
                    />
                );
            }
        }

        return (
            <ReactApexChart
                options={chartOptions}
                series={seriesData}
                type="radar"
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
                    <CardTitle className="text-base font-medium">Incident Response Metrics</CardTitle>
                    <CardDescription>Kill chain phase response effectiveness</CardDescription>
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
                {selectedPhase !== null && (
                    <div className="mt-4 text-center text-sm">
                        <p className="font-medium">
                            Selected: {selectedPhase}
                        </p>
                        <p className="text-muted-foreground">
                            Click on the same point again to reset view
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default IncidentResponseMetricsChart;
