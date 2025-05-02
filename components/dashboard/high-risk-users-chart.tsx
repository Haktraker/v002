'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetHighRiskUsers } from '@/lib/api/endpoints/user-behavior-analytics/high-risk-users';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const HighRiskUsersChart = () => {
    const { selectedMonth, selectedYear } = useGlobalFilter();

    const queryParams = useMemo(() => ({
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    }), [selectedMonth, selectedYear]);
    const { data: highRiskUsersData, isLoading, isError, error } = useGetHighRiskUsers(queryParams);

    console.log(highRiskUsersData);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>High Risk Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[350px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>High Risk Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            Failed to load high risk users data: {error?.message || 'Unknown error'}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }



    if (!highRiskUsersData || highRiskUsersData.length === 0) {
         return (
            <Card>
                <CardHeader>
                    <CardTitle>High Risk Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[350px]">
                        <p className="text-muted-foreground">No high risk user data available for the selected period.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Sort users by risk score descending and take top 10
    const chartOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: true,
            },
            zoom: {
                enabled: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                // endingShape: 'rounded' // Optional: for rounded bars
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
            categories: highRiskUsersData.map((user: { userName: any; }) => user.userName),
            title: {
                text: 'User Name'
            },
            labels: {
                style: {
                    colors: '#888ea8' // Adjust label color if needed for theme
                }
            }
        },
        yaxis: {
            title: {
                text: 'Risk Score'
            },
            labels: {
                 style: {
                    colors: '#888ea8' // Adjust label color if needed for theme
                }
            }
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val) {
                    return val + " points"
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
            offsetX: 40
        },
        grid: {
            borderColor: '#e0e6ed', // Adjust grid color if needed
            strokeDashArray: 5,
        },
        colors: ['#dc2626'], // Red color for high risk
        // Responsive options can be added here if needed
    };

    const chartSeries = [
        {
            name: 'Risk Score',
            data: highRiskUsersData.map((user: { riskScore: any; }) => user.riskScore)
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 10 High Risk Users</CardTitle>
            </CardHeader>
            <CardContent>
                <ApexChart options={chartOptions} series={chartSeries} type="bar" height={350} />
            </CardContent>
        </Card>
    );
};

export default HighRiskUsersChart;
