'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplianceScore } from '@/lib/api/types';
// Remove Select imports as they are no longer needed here

// Define interfaces for component props and internal data structures
interface ChartData {
    labels: string[];
    series: number[];
}

interface AggregatedCompliance {
    complianceName: string;
    count: number;
    color: string;
}

interface ComplianceScoresChartProps {
    data: ComplianceScore[] | undefined; // Data is now expected to be pre-filtered by month/year
    isLoading: boolean;
    error: Error | null;
}

// Remove ALL_TYPES_VALUE constant

// --- COMPONENT START ---
const ComplianceScoresChart = ({ data, isLoading, error }: ComplianceScoresChartProps) => {
    const { theme } = useTheme();
    const [chartData, setChartData] = useState<ChartData>({ labels: [], series: [] });
    const [aggregatedCompliances, setAggregatedCompliances] = useState<AggregatedCompliance[]>([]);
    // Remove complianceList and selectedCompliance state

    // Define a color map for compliance types
    const complianceColorMap = useMemo(() => new Map<string, string>([
        ['ISO 27001', '#10B981'],
        ['HIPAA', '#3B82F6'],
        ['PCI DSS', '#F59E0B'],
        ['SOC 2', '#8B5CF6'],
        ['GDPR', '#EC4899'],
        ['NIST', '#6366F1'],
        ['SOX', '#06B6D4'],
        ['CCPA', '#F97316'],
        ['FedRAMP', '#14B8A6'],
    ]), []); // Use useMemo for the color map

    // --- Effect to process incoming data --- (Simplified)
    useEffect(() => {
        if (data && Array.isArray(data)) {
            const complianceMap = new Map<string, number>();
            const colorAssignments = new Map<string, string>();

            // Process all data entries (assuming data is already filtered by month/year)
            data.forEach(dataEntry => {
                if (dataEntry?.bu && Array.isArray(dataEntry.bu)) {
                    dataEntry.bu.forEach(bu => {
                        if (bu && Array.isArray(bu.compliances)) {
                            bu.compliances.forEach(comp => {
                                if (!comp || typeof comp !== 'object') {
                                    console.warn('Skipping invalid compliance entry:', comp);
                                    return;
                                }
                                let complianceName = typeof comp.complianceName === 'string' ? comp.complianceName.trim() : '';
                                if (!complianceName) {
                                    complianceName = 'Unspecified Compliance';
                                }
                                const count = (typeof comp.count === 'number' && Number.isFinite(comp.count)) ? comp.count : 0;

                                const currentCount = complianceMap.get(complianceName) || 0;
                                complianceMap.set(complianceName, currentCount + count);

                                if (!colorAssignments.has(complianceName)) {
                                    const predefinedColor = complianceColorMap.get(complianceName);
                                    colorAssignments.set(complianceName, predefinedColor || `hsl(${colorAssignments.size * 45}, 70%, 50%)`);
                                }
                            });
                        }
                    });
                }
            });

            const aggregated = Array.from(complianceMap.entries()).map(([complianceName, count]) => ({
                complianceName,
                count,
                color: colorAssignments.get(complianceName) || '#6B7280'
            }));
            aggregated.sort((a, b) => b.count - a.count);

            setAggregatedCompliances(aggregated);

            // Update chart data directly from aggregated data
            const labels = aggregated.map(comp => comp.complianceName || 'Unspecified');
            const series = aggregated.map(comp => comp.count);
            setChartData({ labels, series });

        } else {
            console.warn('Compliance data is empty or invalid:', data);
            setAggregatedCompliances([]);
            setChartData({ labels: [], series: [] });
        }
    }, [data, complianceColorMap]); // Depend on data and the memoized color map

    // Remove the effect that updated chart based on selectedCompliance

    // --- Chart Configuration ---
    const isDark = theme === 'dark';

    const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({ // Wrap options in useMemo
        chart: {
            type: 'donut',
            toolbar: { show: false },
            background: 'transparent',
            foreColor: isDark ? '#f8fafc' : '#334155',
            animations: { enabled: true, speed: 500, animateGradually: { enabled: true, delay: 150 }, dynamicAnimation: { enabled: true, speed: 350 } }
        },
        labels: chartData.labels,
        responsive: [{ breakpoint: 480, options: { chart: { width: 300 }, legend: { position: 'bottom' } } }],
        legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            fontSize: '14px',
            fontFamily: 'inherit',
            labels: {
                colors: isDark ? '#e5e7eb' : '#374151'
            },
            itemMargin: { horizontal: 10, vertical: 5 }
        },
        tooltip: {
            enabled: true,
            theme: isDark ? 'dark' : 'light',
            y: {
                formatter: function (value: number, { seriesIndex, w }: { seriesIndex: number; w: any }) {
                    const totals = w?.globals?.seriesTotals;
                    if (totals && Array.isArray(totals)) {
                        const total = totals.reduce((a: number, b: number) => (a || 0) + (b || 0), 0);
                        const numericValue = typeof value === 'number' ? value : 0;
                        const percentage = total > 0 ? ((numericValue / total) * 100).toFixed(1) : 0;
                        return `${numericValue} (${percentage}%)`;
                    }
                    return value?.toString() ?? '0';
                }
            },
            style: { fontFamily: 'inherit', fontSize: '14px' }
        },
        colors: chartData.labels.map(label => {
            const compliance = aggregatedCompliances.find(comp => comp.complianceName === label);
            return compliance?.color || '#6B7280';
        }),
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Score',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: isDark ? '#cbd5e1' : '#475569',
                            formatter: function (w: any) {
                                const totals = w?.globals?.seriesTotals;
                                if (totals && Array.isArray(totals)) {
                                    return totals.reduce((a: number, b: number) => (a || 0) + (b || 0), 0).toString();
                                }
                                return '0';
                            }
                        },
                        value: {
                            show: true,
                            fontSize: '1rem',
                            fontWeight: 400,
                            color: isDark ? '#94a3b8' : '#64748b',
                            offsetY: 8,
                            formatter: function (val: string) {
                                // The value passed here is already formatted by the tooltip formatter if enabled
                                // We just need to display it or potentially reformat if needed.
                                // If tooltip.y.formatter is complex, you might need simpler logic here.
                                return val; // Assuming 'val' is the direct series value
                            }
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false }, // Keep labels off the donut itself
        stroke: { show: false }, // No border around segments
    }), [isDark, chartData, aggregatedCompliances]); // Dependencies for useMemo

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-[350px] w-full" />;
        }

        if (error) {
            return (
                <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
                    Error loading compliance scores: {error.message}
                </div>
            );
        }

        if (!chartData || chartData.series.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-8">
                    No compliance data available for the selected period.
                </div>
            );
        }

        return (
            <ApexChart
                type="donut"
                height={350}
                options={chartOptions}
                series={chartData.series}
            />
        );
    };

    return (
        <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col space-y-1.5">
                    <CardTitle className="text-base font-medium">Compliance Scores</CardTitle>
                    <CardDescription>Distribution across compliance types</CardDescription>
                </div>
                {/* Remove the Select dropdown for filtering */}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
                {renderContent()}
            </CardContent>
            {/* Optional: Keep the footer link if relevant */}
            {/* <CardFooter className="flex justify-center pt-4">
                <Button variant="link" asChild>
                    <Link href="/dashboard/compliance-details">View Details</Link>
                </Button>
            </CardFooter> */}
        </Card>
    );
};

export default ComplianceScoresChart;