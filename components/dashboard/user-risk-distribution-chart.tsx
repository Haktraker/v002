"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"
import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info, Pencil } from "lucide-react"
import Link from "next/link"
import { Button } from "../ui/button"

// Dynamically import ApexChart to avoid SSR issues
const ApexChart = dynamic(() => import("@/components/ui/apex-chart"), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" /> // Show skeleton while loading chart component itself
})

// --- Constants ---
const SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low"] as const;
type SeverityLevel = typeof SEVERITY_LEVELS[number];

// Map severity levels to data keys for easier access
const SEVERITY_KEYS: Record<SeverityLevel, keyof Omit<RiskDataPoint, 'businessUnit'>> = {
    Critical: 'critical',
    High: 'high',
    Medium: 'medium',
    Low: 'low'
};

// Define severity colors (optional, ApexCharts will assign defaults if not provided per series)
// We will assign colors per Business Unit now, so this might not be directly used in series config
// but can be kept for reference or potential future use.
const SEVERITY_COLORS: Record<SeverityLevel, string> = {
    Critical: '#FF4444',
    High: '#FFA500',
    Medium: '#FFD700',
    Low: '#4CAF50'
};

// --- Interfaces ---
interface RiskDataPoint {
    businessUnit: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
}

interface TransformedSeriesData {
    name: string; // Business Unit name
    data: number[]; // Counts corresponding to SEVERITY_LEVELS order
}

interface UserRiskDistributionChartProps {
    data: any[] | null | undefined; // Raw user risk distribution data from API
    isLoading?: boolean;
    error?: Error | string | null; // Allow string errors too
}

// --- Helper Functions ---

/**
 * Transforms the raw risk data into the format required by ApexCharts
 * for a grouped bar chart (Series = Business Unit, Categories = Severity).
 * @param data Raw RiskDataPoint array
 * @returns Array of series data for ApexCharts
 */
const transformDataForChart = (data: RiskDataPoint[] | null | undefined): TransformedSeriesData[] => {
    if (!data || data.length === 0) {
        return [];
    }

    // Map each business unit to a series
    return data.map(item => ({
        name: item.businessUnit,
        // Extract counts in the order defined by SEVERITY_LEVELS
        data: SEVERITY_LEVELS.map(level => item[SEVERITY_KEYS[level]])
    }));
};

/**
 * Generates ApexCharts options based on theme and categories.
 * @param categories X-axis categories (Severity Levels)
 * @param isDark Current theme state
 * @returns ApexCharts options object
 */
const getChartOptions = (categories: readonly string[], isDark: boolean): ApexCharts.ApexOptions => {
    const labelColor = isDark ? '#A1A1AA' : '#71717A';
    const gridBorderColor = isDark ? '#27272A' : '#E4E4E7';
    const legendColor = isDark ? '#FFFFFF' : '#000000';

    return {
        chart: {
            type: 'bar',
            height: 300,
            background: 'transparent',
            toolbar: {
                show: false, // Enable toolbar for zoom, pan, download etc.
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
            animations: {
                enabled: true,
                speed: 400 // Slightly faster animation
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '65%', // Adjust width for grouped bars
                borderRadius: 4,
                // Grouped bars - dataLabels might overlap, consider enabling only if needed
                // dataLabels: {
                //   position: 'top', // Display value on top of the bar
                // },
            }
        },
        dataLabels: {
            enabled: false, // Keep disabled for grouped bars unless essential
            // formatter: function (val) {
            //   return val + ""; // Basic formatter if enabled
            // },
            // offsetY: -20,
            // style: {
            //   fontSize: '12px',
            //   colors: [legendColor]
            // }
        },
        xaxis: {
            categories: [...categories], // Ensure it's a mutable array if needed downstream
            labels: {
                style: {
                    colors: labelColor,
                    fontSize: '12px'
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            title: {
                text: 'Count', // Add Y-axis title
                style: {
                    color: labelColor,
                    fontWeight: 500,
                }
            },
            labels: {
                style: {
                    colors: labelColor,
                    fontSize: '12px'
                },
                formatter: function (val: number) {
                    // Format Y-axis labels as integers
                    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(2);
                }
            }
        },
        grid: {
            borderColor: gridBorderColor,
            xaxis: {
                lines: {
                    show: false // Hide vertical grid lines
                }
            },
            yaxis: {
                lines: {
                    show: true // Show horizontal grid lines
                }
            },
            padding: {
                top: 10,
                right: 10,
                bottom: 0,
                left: 10 // Add some left padding for Y-axis labels
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            offsetY: -10, // Adjust vertical offset
            labels: {
                colors: legendColor
            },
            markers: {
                size: 12, // Make legend markers circular
            },
            itemMargin: {
                horizontal: 10,
            },
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: function (val: number) {
                    return val + " Users"; // Customize tooltip value
                }
            }
        },
        // Optionally define a color palette for Business Units
        // colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', ...],
        responsive: [ // Make chart responsive
            {
                breakpoint: 768, // Example breakpoint (adjust as needed)
                options: {
                    plotOptions: {
                        bar: {
                            columnWidth: '80%'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        horizontalAlign: 'center',
                        offsetY: 5,
                    },
                    yaxis: {
                        title: {
                            text: undefined // Hide Y-axis title on smaller screens
                        }
                    }
                }
            }
        ]
    };
};


// --- Main Component ---

export function UserRiskDistributionChart({ data, isLoading = false, error = null }: UserRiskDistributionChartProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Transform the raw data into the format needed for the chart
    const transformedRiskData = useMemo(() => {
        if (!data) return [];

        // Create a map to store aggregated data by business unit
        const buAggregateMap = new Map<string, {
            businessUnit: string;
            critical: number;
            high: number;
            medium: number;
            low: number;
        }>();

        // Process all distributions and aggregate by business unit
        data.forEach(distribution => {
            // Process each business unit in the distribution
            distribution.bu.forEach((businessUnit: { buName: string; severities: Array<{ severity: string; count: number }> }) => {
                const buName = businessUnit.buName;

                // Get or initialize the aggregate for this business unit
                const aggregate = buAggregateMap.get(buName) || {
                    businessUnit: buName,
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0
                };

                // Add severity counts to the aggregate
                businessUnit.severities.forEach((severity: { severity: string; count: number }) => {
                    switch (severity.severity) {
                        case "Critical":
                            aggregate.critical += severity.count;
                            break;
                        case "High":
                            aggregate.high += severity.count;
                            break;
                        case "Medium":
                            aggregate.medium += severity.count;
                            break;
                        case "Low":
                            aggregate.low += severity.count;
                            break;
                    }
                });

                // Update the map with the new aggregate
                buAggregateMap.set(buName, aggregate);
            });
        });

        // Convert the map to an array
        return Array.from(buAggregateMap.values());
    }, [data]);

    // Memoize transformed data and options to prevent unnecessary recalculations
    const series = useMemo(() => transformDataForChart(transformedRiskData), [transformedRiskData]);
    const options = useMemo(() => getChartOptions(SEVERITY_LEVELS, isDark), [isDark]);

    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[300px] w-full" />;
        }

        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertCircle className="" />
                    <AlertTitle>Error Loading Chart</AlertTitle>
                    <AlertDescription>
                        {typeof error === 'string' ? error : error.message || "An unknown error occurred."}
                    </AlertDescription>
                </Alert>
            );
        }

        if (!series || series.length === 0) {
            return (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        There is no user risk distribution data to display for the selected criteria.
                    </AlertDescription>
                </Alert>
            );
        }

        // Render the chart if data is available
        return (
            <ApexChart
                type="bar"
                height={450} // Use height from options
                options={options}
                series={series}
            />
        );
    };

    return (
        <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Risk Distribution</CardTitle> {/* Updated Title */}
                <Link href="/dashboard/security-breach-indicators/user-risk-distribution">
                    <Button variant="outline" size="sm">Manage All</Button>
                </Link>
            </CardHeader>
            <CardContent className="p-6">
                {renderContent()}
            </CardContent>
        </Card>
    );
}