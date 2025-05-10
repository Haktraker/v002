'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReportsDigitalRiskIntelligence } from '@/lib/api/reports-types/types'; 
import { useGetReportsDigitalRiskIntelligence } from '@/lib/api/endpoints/reports/digital-risk-intelligence';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { MONTHS } from '@/lib/constants/months-list';

// Helper function to sort data chronologically
const sortData = (data: ReportsDigitalRiskIntelligence[]): ReportsDigitalRiskIntelligence[] => {
    return data.sort((a, b) => {
      const yearComparison = parseInt(a.year) - parseInt(b.year);
      if (yearComparison !== 0) return yearComparison;
      // Ensure month names are consistently cased for indexOf to work reliably
      const monthA = typeof a.month === 'string' ? a.month.toLowerCase() : '';
      const monthB = typeof b.month === 'string' ? b.month.toLowerCase() : '';
      const monthsOrder = MONTHS.map(m => m.toLowerCase());
      return monthsOrder.indexOf(monthA) - monthsOrder.indexOf(monthB);
    });
  };

const ReportsDigitalRiskIntelligenceChart = () => {
  const { theme } = useTheme();
  const { selectedMonth, selectedYear } = useGlobalFilter(); // Assuming these filters are available
  const isDark = theme === 'dark';

  const queryParams = {
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  };

  const { data: apiResponse, isLoading, error } = useGetReportsDigitalRiskIntelligence(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return { categories: [], seriesData: [] };
    }
    const sortedData = sortData(apiResponse.data);
    const categories = sortedData.map(item => `${item.month.substring(0, 3)} ${item.year}`);
    // For this chart, we'll count the number of reports as the 'volume'
    const seriesData = sortedData.map(() => 1); // This will create a bar for each entry
    // A more meaningful aggregation might be needed depending on desired visualization
    // For example, grouping by month and counting:
    const aggregatedData: { [key: string]: number } = {};
    sortedData.forEach(item => {
        const category = `${item.month.substring(0,3)} ${item.year}`;
        if(aggregatedData[category]) {
            aggregatedData[category]++;
        } else {
            aggregatedData[category] = 1;
        }
    });

    const distinctCategories = [...new Set(categories)].sort((a,b) => {
        const [monA, yearA] = a.split(' ');
        const [monB, yearB] = b.split(' ');
        if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
        return MONTHS.map(m => m.substring(0,3).toLowerCase()).indexOf(monA.toLowerCase()) - MONTHS.map(m => m.substring(0,3).toLowerCase()).indexOf(monB.toLowerCase());
    });
    
    return {
         categories: distinctCategories,
         seriesData: distinctCategories.map(cat => aggregatedData[cat] || 0)
    };
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
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.categories,
      labels: { style: { colors: isDark ? '#9ca3af' : '#6b7280' } },
    },
    yaxis: {
      title: { text: 'Count of Reports', style: { color: isDark ? '#9ca3af' : '#6b7280' } },
      labels: { style: { colors: isDark ? '#9ca3af' : '#6b7280' } },
    },
    fill: {
      opacity: 1,
      colors: [isDark ? '#38bdf8' : '#0ea5e9'],
    },
    tooltip: { shared: true, intersect: false },
    grid: { show: false },  
    theme: { mode: isDark ? 'dark' : 'light' },
  }), [isDark, chartData]);

  const series = useMemo(() => [
    {
      name: 'Reports Count',
      data: chartData.seriesData,
    },
  ], [chartData]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full rounded-lg" />;
    }
    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          Error loading Digital Risk Intelligence data: {error.message}
        </div>
      );
    }
    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No Digital Risk Intelligence data available for the selected period.
        </div>
      );
    }
    return <ApexChart type="bar" height={350} options={chartOptions} series={series} />;
  };

  return (
    <Card className={isDark ? "bg-card border" : "bg-card"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Digital Risk Intelligence (Report)</CardTitle>
          <CardDescription>Monthly count of intelligence reports</CardDescription>
        </div>
        <Link href="/dashboard/reports/digital-risk-intelligence">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
};

export default ReportsDigitalRiskIntelligenceChart;
