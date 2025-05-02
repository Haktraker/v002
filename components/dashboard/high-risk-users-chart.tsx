'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetHighRiskUsers } from '@/lib/api/endpoints/user-behavior-analytics/high-risk-users';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info } from 'lucide-react';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { HighRiskUser } from '@/lib/api/types';

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import('react-apexcharts'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full" />
});

const HighRiskUsersChart = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { selectedMonth, selectedYear } = useGlobalFilter();

    const queryParams = useMemo(() => ({
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    }), [selectedMonth, selectedYear]);

    const { data: highRiskUsersResponse, isLoading, isError, error } = useGetHighRiskUsers(queryParams);

    const usersArray = highRiskUsersResponse;

    const sortedUsers = useMemo(() => {
        if (!Array.isArray(usersArray)) {
            const dataFromArray = usersArray?.data;
            if (!Array.isArray(dataFromArray) || dataFromArray.length === 0) {
                 return [];
            }
             return [...dataFromArray]
                .sort((a: HighRiskUser, b: HighRiskUser) => b.riskScore - a.riskScore)
                .slice(0, 10);
        }
        if (usersArray.length === 0) {
             return [];
        }
        return [...usersArray]
            .sort((a: HighRiskUser, b: HighRiskUser) => b.riskScore - a.riskScore)
            .slice(0, 10);
    }, [usersArray]);

    const chartOptions: ApexOptions = useMemo(() => {
        const textColor = isDark ? '#e2e8f0' : '#475569';
        const gridBorderColor = isDark ? '#374151' : '#e5e7eb';
        const chartThemeMode = isDark ? 'dark' : 'light';

        return {
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false
                },
                background: 'transparent',
                foreColor: textColor
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 5,
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
                categories: sortedUsers.map((user: HighRiskUser) => user.userName),
                labels: {
                    style: {
                        colors: textColor,
                        fontFamily: 'inherit',
                    },
                     trim: false,
                },
                title: {
                    text: 'User Name',
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
                    text: 'Risk Score',
                    style: {
                        color: textColor,
                        fontFamily: 'inherit',
                        fontWeight: 500,
                    }
                },
                labels: {
                    style: {
                        colors: textColor,
                        fontFamily: 'inherit',
                    },
                     formatter: function (val: number) {
                         return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
                    }
                }
            },
            fill: {
                opacity: 1
            },
            tooltip: {
                enabled: true,
                shared: true,
                intersect: false,
                theme: chartThemeMode,
                style: { fontFamily: 'inherit' },
                y: {
                    formatter: (val) => `${val} points`
                }
            },
            legend: {
                show: false
            },
            grid: {
                show: true,
                borderColor: gridBorderColor,
                strokeDashArray: 3,
                yaxis: { lines: { show: true } },
                xaxis: { lines: { show: false } },
            },
            colors: ['#dc2626'],
            theme: {
                mode: chartThemeMode
            }
        };
    }, [sortedUsers, isDark]);

    const chartSeries = useMemo(() => [
        {
            name: 'Risk Score',
            data: sortedUsers.map((user: HighRiskUser) => user.riskScore)
        }
    ], [sortedUsers]);

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
                        Failed to load high risk users data: {error instanceof Error ? error.message : 'Unknown error'}
                    </AlertDescription>
                </Alert>
            );
        }

        if (!sortedUsers || sortedUsers.length === 0) {
            return (
                <Alert className="max-w-md border-none text-center mx-auto my-4">
                    <Info className="h-4 w-4 mx-auto mb-2" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        No high risk user data available for the selected period.
                    </AlertDescription>
                </Alert>
            );
        }

        return (
             <ApexChart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={350}
                width="100%"
            />
        );
    }

    return (
         <Card className={cn("w-full")}>
             <CardHeader>
                 <CardTitle>Top High Risk Users</CardTitle>
             </CardHeader>
             <CardContent className="pt-4 pr-2 pb-2 pl-2">
                {renderContent()}
             </CardContent>
        </Card>
    );
};

export default HighRiskUsersChart;
