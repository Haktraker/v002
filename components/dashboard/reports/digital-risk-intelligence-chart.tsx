'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReportsDigitalRiskIntelligence, ReportLevel, ReportIndicator } from '@/lib/api/reports-types/types';
import { useGetReportsDigitalRiskIntelligence } from '@/lib/api/endpoints/reports/digital-risk-intelligence';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';

// Define colors for risk levels - from reference
const riskLevelColors: Record<ReportLevel, string> = {
  "no risk": '#22c55e',  // Green
  medium: '#f59e0b',  // Amber
  high: '#ef4444',    // Red
  critical: '#8b5cf6' // Violet
};

// Order for stacking and legend - from reference
const riskLevelOrder: ReportLevel[] = ['no risk', 'medium', 'high', 'critical'];
// Define indicator order based on ReportIndicator type
const reportIndicatorOrder: ReportIndicator[] = ["executive protection", "situational awareness", "impersonations", "social media"];


// Helper to format indicator labels - from reference
const formatIndicatorLabel = (indicator: ReportIndicator): string => {
    return indicator.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};


// Helper function to sort data chronologically - THIS MIGHT NOT BE NEEDED if we are not displaying time series.
// const sortData = (data: ReportsDigitalRiskIntelligence[]): ReportsDigitalRiskIntelligence[] => {
//     return data.sort((a, b) => {
//       const yearComparison = parseInt(a.year) - parseInt(b.year);
//       if (yearComparison !== 0) return yearComparison;
//       const monthA = typeof a.month === 'string' ? a.month.toLowerCase() : '';
//       const monthB = typeof b.month === 'string' ? b.month.toLowerCase() : '';
//       const monthsOrder = MONTHS.map(m => m.toLowerCase());
//       return monthsOrder.indexOf(monthA) - monthsOrder.indexOf(monthB);
//     });
//   };

const ReportsDigitalRiskIntelligenceChart = () => {
  const { theme } = useTheme();
  // SelectedMonth and SelectedYear might still be used for filtering the source data
  const { selectedMonth, selectedYear } = useGlobalFilter(); 
  const isDark = theme === 'dark';

  const queryParams = {
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
    // Potentially add level and indicator filters if available and desired
    // level: selectedLevel === 'All' ? undefined : selectedLevel,
    // indicator: selectedIndicator === 'All' ? undefined : selectedIndicator,
  };

  const { data: apiResponse, isLoading, error } = useGetReportsDigitalRiskIntelligence(queryParams);

  const chartData = useMemo(() => {
    if (!apiResponse?.data || apiResponse.data.length === 0) {
      return { categories: [], series: [], colors: [] };
    }
    // const sortedData = sortData(apiResponse.data); // Sorting by date might not be relevant for indicator/level aggregation

    // Initialize counts for each indicator and risk level - from reference
    const risksByIndicator: Record<ReportIndicator, Record<ReportLevel, number>> = 
        reportIndicatorOrder.reduce((acc, indicator) => {
            acc[indicator] = riskLevelOrder.reduce((lvlAcc, level) => {
                lvlAcc[level] = 0;
                return lvlAcc;
            }, {} as Record<ReportLevel, number>);
            return acc;
        }, {} as Record<ReportIndicator, Record<ReportLevel, number>>);

    // Group risks by indicator and count levels - from reference
    apiResponse.data.forEach(item => {
        if (reportIndicatorOrder.includes(item.indicator) && riskLevelOrder.includes(item.level)) {
             risksByIndicator[item.indicator][item.level]++;
        }
    });
    
    // Prepare series for stacked bar chart - from reference
    const series = riskLevelOrder.map(level => ({
      name: level.charAt(0).toUpperCase() + level.slice(1), // Capitalize level name for legend
      data: reportIndicatorOrder.map(indicator => risksByIndicator[indicator][level])
    }));

    const colors = riskLevelOrder.map(level => riskLevelColors[level]);
    const categories = reportIndicatorOrder.map(formatIndicatorLabel); // Use formatted labels for X-axis
    
    return {
         categories: categories,
         series: series,
         colors: colors
    };
  }, [apiResponse?.data]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 350,
      stacked: true, // Enable stacked chart - from reference
      toolbar: { show: false },
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155', // from reference
      zoom: { enabled: false }, // from reference
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%', // from reference
        borderRadius: 4, // from reference
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'], // Standard for stacked bars
    },
    xaxis: {
      categories: chartData.categories,
      labels: { 
        style: { 
            colors: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '12px', // from reference
            fontFamily: 'inherit', // from reference
        },
        trim: true, // from reference
      },
      axisBorder: { color: isDark ? '#374151' : '#e5e7eb' }, // from reference
      axisTicks: { color: isDark ? '#374151' : '#e5e7eb' }, // from reference
    },
    yaxis: {
      title: { 
        text: 'Risk Count', // from reference
        style: { 
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '12px', // from reference
            fontWeight: 500, // from reference
            fontFamily: 'inherit', // from reference
        } 
      },
      labels: { 
        style: { 
            colors: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '12px', // from reference
            fontFamily: 'inherit', // from reference
        },
        formatter: (val) => val.toFixed(0) // from reference
      },
    },
    fill: {
      opacity: 1, // Standard for stacked bars
      // colors are set directly in the options now
    },
    colors: chartData.colors, // Assign colors based on risk level order - from reference
    tooltip: { 
      shared: true, // Usually false for stacked, but reference has true. Let's try true first.
      intersect: false,
      theme: isDark ? 'dark' : 'light', // from reference
      y: { // from reference
        formatter: function (val, { seriesIndex, dataPointIndex, w }) {
          const riskLevelName = w.globals.seriesNames[seriesIndex];
          return `${val} ${riskLevelName} risk(s)`;
        }
      },
      style: { fontFamily: 'inherit', fontSize: '12px' } // from reference
    },
    grid: { show: false },  
    legend: { // from reference
        show: true, 
        position: 'top',
        horizontalAlign: 'left',
        fontFamily: 'inherit',
        fontSize: '12px',
        markers: {
            size: 6,
        },
        itemMargin: {
            horizontal: 10,
        }
    }
    // theme: { mode: isDark ? 'dark' : 'light' }, // Not needed if foreColor is set
  }), [isDark, chartData]);

  const series = useMemo(() => chartData.series, [chartData.series]);


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
    // Updated no-data checks from reference
    if (!chartData || chartData.categories.length === 0) {
        return <div className="text-center text-muted-foreground py-8">No digital risk data available.</div>;
    }
    const totalRisks = chartData.series.reduce((sum, s) => sum + s.data.reduce((dSum, val) => dSum + val, 0), 0);
    if (totalRisks === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No digital risks found for the selected period.
        </div>
      );
    }
    return <ApexChart type="bar" height={350} options={chartOptions} series={series} />;
  };

  return (
    <Card className={`flex-1 ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Digital Risk Intelligence</CardTitle>
          <CardDescription>Risk count by indicator and level</CardDescription>
        </div>
        <Link href="/dashboard/reports/digital-risk-intelligence">
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">{renderContent()}</CardContent>
    </Card>
  );
};

export default ReportsDigitalRiskIntelligenceChart;
