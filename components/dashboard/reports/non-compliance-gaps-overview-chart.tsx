'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ReportNonComplianceGapsOverview,
  COMPLIANCE_TYPES,
  ComplianceType
} from '@/lib/api/endpoints/reports/non-compliance-gaps-overview';
import { useGetReportNonComplianceGapsOverviews } from '@/lib/api/endpoints/reports/non-compliance-gaps-overview';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Helper to calculate average score for a compliance type
const getAverageScoreForCompliance = (data: ReportNonComplianceGapsOverview[], complianceType: ComplianceType): number => {
  let totalScore = 0;
  let count = 0;
  data.forEach(record => {
    if (record.compliance === complianceType && record.score) {
      // Assuming score is a string like "85%" or just "85". We need to parse the number.
      const numericScore = parseFloat(record.score.replace('%', ''));
      if (!isNaN(numericScore)) {
        totalScore += numericScore;
        count++;
      }
    }
  });
  return count > 0 ? totalScore / count : 0;
};

const NonComplianceGapsOverviewChart = () => {
  const { theme } = useTheme();
  const { selectedMonth, selectedYear } = useGlobalFilter();
  const isDark = theme === 'dark';

  const queryParams = {
    month: selectedMonth === 'All' || selectedMonth === '' ? undefined : selectedMonth,
    year: selectedYear === 'All' || selectedYear === '' ? undefined : selectedYear,
  };

  const { data: apiResponse, isLoading, error } = useGetReportNonComplianceGapsOverviews(queryParams);

  const chartData = useMemo(() => {
    const categories = COMPLIANCE_TYPES as unknown as string[];
    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return { categories, seriesData: categories.map(() => 0) };
    }
    const seriesData = COMPLIANCE_TYPES.map(type => 
      getAverageScoreForCompliance(apiResponse.data, type)
    );
    return { categories, seriesData };
  }, [apiResponse?.data]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        distributed: true, // Color each bar differently
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => Number(val).toFixed(1) + '%', // Assuming scores are percentages
      offsetY: -20,
      style: { fontSize: '12px', colors: [isDark ? "#D1D5DB" : "#374151"] },
    },
    xaxis: {
      categories: chartData.categories,
      labels: { style: { colors: chartData.categories.map(() => isDark ? '#9ca3af' : '#6b7280') } },
    },
    yaxis: {
      title: { text: 'Average Score (%)', style: { color: isDark ? '#9ca3af' : '#6b7280' } },
      labels: {
        style: { colors: [isDark ? '#9ca3af' : '#6b7280'] },
        formatter: (val) => val.toFixed(0) + '%',
      },
      min: 0, // Optional: set min for y-axis
      max: 100, // Optional: set max for y-axis if scores are percentages
    },
    fill: { opacity: 1 },
    tooltip: {
      shared: true,
      intersect: false,
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => val.toFixed(1) + "%" },
    },
    grid: {
      show: false,
    },
    legend: { show: false },
    theme: { mode: isDark ? 'dark' : 'light' },
  }), [isDark, chartData]);

  const series = useMemo(() => [
    { name: 'Average Score', data: chartData.seriesData },
  ], [chartData]);

  const renderContent = () => {
    if (isLoading) return <Skeleton className="h-[350px] w-full rounded-lg" />;
    if (error) return <div className="text-destructive-foreground bg-destructive p-4 rounded-md">Error: {error.message}</div>;
    if ((queryParams.month || queryParams.year) && (!apiResponse?.data || apiResponse.data.length === 0)) {
      return <div className="text-center text-muted-foreground py-8">No Non-Compliance Gap data for selected period.</div>;
    }
    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return <div className="text-center text-muted-foreground py-8">No Non-Compliance Gap data available.</div>;
    }
    return <ApexChart type="bar" height={350} options={chartOptions} series={series} />;
  };

  return (
    <Card className={isDark ? "bg-card border" : "bg-card"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Non-Compliance Gaps Overview</CardTitle>
          <CardDescription>
            {queryParams.month && queryParams.year ? `Avg Scores for ${queryParams.month}, ${queryParams.year}`
              : queryParams.year ? `Avg Scores for ${queryParams.year}`
              : queryParams.month ? `Avg Scores for ${queryParams.month}`
              : 'Overall Avg Scores by Compliance'}
          </CardDescription>
        </div>
        <Link href="/dashboard/reports/non-compliance-gaps-overview">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

export default NonComplianceGapsOverviewChart;
