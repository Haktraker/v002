'use client';
import React, { useMemo, useState } from 'react';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SecurityIncidentTrend } from '@/lib/api/types';
// Remove Select imports

type SecurityIncidentTrendsChartProps = {
    data?: SecurityIncidentTrend[]; // Data is now expected to be pre-filtered by month/year
    isLoading?: boolean;
    error?: Error | string | null;
};

// Remove MONTHS constant

export function SecurityIncidentTrendsChart({
    data,
    isLoading = false,
    error = null
}: SecurityIncidentTrendsChartProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    // Remove currentYear, currentMonth, selectedYear, selectedMonth state

    // Transform data for ApexCharts - Simplified
    const series = useMemo(() => {
        if (!data) return [];

        // Data is assumed to be pre-filtered by month/year
        const filteredData = data;

        const allIncidents = filteredData.flatMap(trend =>
            trend.bu.flatMap(bu =>
                bu.incidents.map(incident => ({
                    month: trend.month, // Keep month for potential category grouping if needed
                    year: trend.year, // Keep year for potential category grouping if needed
                    incidentType: incident.incident_name,
                    count: incident.incident_score
                }))
            )
        );

        if (allIncidents.length === 0) return [];

        // Group by incident type
        const incidentTypes = Array.from(new Set(allIncidents.map(item => item.incidentType)));

        // Determine categories (e.g., Business Units if data represents a single month/year)
        // Or keep months if data spans multiple months (though filtering should handle this)
        // For simplicity, let's assume the data passed is for ONE month/year and group by BU
        const businessUnits = Array.from(new Set(filteredData.flatMap(trend => trend.bu.map(b => b.bu_name))));

        return incidentTypes.map(type => {
            return {
                name: type,
                data: businessUnits.map(buName => {
                    const buTotal = allIncidents
                        .filter(item => item.incidentType === type && filteredData.some(t => t.bu.some(b => b.bu_name === buName)))
                        .reduce((sum, item) => sum + item.count, 0); // This logic might need adjustment based on how data is structured post-filtering
                    return buTotal;
                })
            };
        });
        // --- OR --- If keeping monthly trend within the filtered data:
        /*
        const months = Array.from(new Set(allIncidents.map(item => item.month)))
                         .sort((a, b) => +new Date(`01 ${a} ${filteredData[0]?.year || new Date().getFullYear()}`) - +new Date(`01 ${b} ${filteredData[0]?.year || new Date().getFullYear()}`));
    
        return incidentTypes.map(type => {
          return {
            name: type,
            data: months.map(month => {
              const monthlyTotal = allIncidents
                .filter(item => item.month === month && item.incidentType === type)
                .reduce((sum, item) => sum + item.count, 0);
              return monthlyTotal;
            })
          };
        });
        */
    }, [data]);

    const options = useMemo(() => {
        // Determine categories based on how 'series' was calculated
        const categories = data ? Array.from(new Set(data.flatMap(trend => trend.bu.map(b => b.bu_name)))) : [];
        // OR if using months: 
        // const categories = data ? Array.from(new Set(data.flatMap(trend => trend.month))).sort(...) : [];

        return {
            chart: {
                type: 'line', // Or 'bar' if grouping by BU makes more sense
                height: 350,
                stacked: false,
                toolbar: { show: false },
                zoom: { enabled: true },
                foreColor: isDark ? '#f8fafc' : '#334155',
                background: 'transparent',
            },
            stroke: {
                width: 3,
                curve: 'smooth'
            },
            markers: {
                size: 5,
                hover: { size: 7 }
            },
            xaxis: {
                categories: categories,
                // title: { text: '', style: { color: isDark ? '#e5e7eb' : '#374151' } }, // Remove month title or adjust
                labels: {
                    style: { colors: isDark ? '#e5e7eb' : '#374151' }, rotate: -45,
                    show: true,
                },

            },
            yaxis: {
                title: { text: 'Incident Count', style: { color: isDark ? '#e5e7eb' : '#374151' } },
                labels: { style: { colors: isDark ? '#e5e7eb' : '#374151' } }
            },
            tooltip: {
                theme: isDark ? 'dark' : 'light',
                shared: true,
                intersect: false
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                labels: { colors: isDark ? '#e5e7eb' : '#374151' }
            },
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'], // Keep or adjust colors
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: { height: 300 },
                    legend: { position: 'bottom' }
                }
            }]
        };
    }, [data, isDark]);

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
                        There is no security incident trend data to display for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
            <ApexChart
                type="line" // Or 'bar'
                height={350}
                options={options}
                series={series}
            />
        );
    };

    return (
        <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                    Security Incident Trends
                </CardTitle>
                {/* Remove the Select components for month and year */}
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}