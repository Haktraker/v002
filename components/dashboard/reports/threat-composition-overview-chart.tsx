'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { 
  useGetThreatCompositionOverviews 
} from '@/lib/api/endpoints/reports/threat-composition-overview';
import { 
  ReportsThreatCompositionOverview, 
  ReportsThreatCompositionOverviewQueryParams,
  ReportsThreatType
} from '@/lib/api/reports-types/types';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MONTHS } from '@/lib/constants/months-list'; // Import MONTHS for sorting

const THREAT_TYPE_COLORS: { [key in ReportsThreatType]?: string } = {
  [ReportsThreatType.PHISHING_ATTEMPTS]: '#FF6384',
  [ReportsThreatType.INTRUSION_ATTEMPTS]: '#36A2EB',
  [ReportsThreatType.INSIDER_THREATS]: '#FFCE56',
  [ReportsThreatType.ATO]: '#4BC0C0',
  [ReportsThreatType.TROJAN_MALWARE]: '#9966FF',
  [ReportsThreatType.THIRD_PARTY_LEAKS]: '#FF9F40',
  [ReportsThreatType.ATTACK_SURFACES]: '#C9CBCF',
};

const getDefaultColors = (count: number, theme: string | undefined) => {
  const isDark = theme === 'dark';
  const baseColors = [
    isDark ? '#1E88E5' : '#42A5F5', // Blue
    isDark ? '#D81B60' : '#EC407A', // Pink
    isDark ? '#00ACC1' : '#26C6DA', // Cyan
    isDark ? '#FDD835' : '#FFEE58', // Yellow
    isDark ? '#FB8C00' : '#FFA726', // Orange
    isDark ? '#43A047' : '#66BB6A', // Green
    isDark ? '#8E24AA' : '#AB47BC', // Purple
    isDark ? '#5E35B1' : '#7E57C2', // Deep Purple
    isDark ? '#039BE5' : '#29B6F6', // Light Blue
    isDark ? '#E53935' : '#EF5350', // Red
  ];
  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
};


const ThreatCompositionOverviewChart = () => {
  const { theme } = useTheme();
  const { selectedMonth, selectedYear } = useGlobalFilter();
  const isDark = theme === 'dark';

  const queryParams: ReportsThreatCompositionOverviewQueryParams = useMemo(() => ({
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
  }), [selectedMonth, selectedYear]);

  // The hook now directly returns ReportsThreatCompositionOverview[] | undefined
  const { data: records, isLoading, error } = useGetThreatCompositionOverviews(queryParams);

  const chartData = useMemo(() => {
    // `records` is now directly the array of data or undefined
    if (!records || !Array.isArray(records) || records.length === 0) {
      return { series: [], categories: [], colors: [] };
    }
    // No need for: const records: ReportsThreatCompositionOverview[] | undefined = apiResult?.data;

    const timePeriods = Array.from(
      new Set(records.map((r: ReportsThreatCompositionOverview) => `${r.month} ${r.year}`))
    ).sort((a: string, b: string) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const yearComparison = parseInt(yearA) - parseInt(yearB);
      if (yearComparison !== 0) return yearComparison;
      return MONTHS.indexOf(monthA) - MONTHS.indexOf(monthB);
    });

    const categories = timePeriods.map((tp: string) => {
        const [month, year] = tp.split(' ');
        return `${month.substring(0,3)} ${year.slice(-2)}`;
    });

    const aggregatedData: { 
      [key in ReportsThreatType]?: { [timePeriod: string]: number } 
    } = {};

    records.forEach((item: ReportsThreatCompositionOverview) => {
      if (item.threatType && typeof item.incidentCount === 'number') {
        const timePeriod = `${item.month} ${item.year}`;
        if (!aggregatedData[item.threatType]) {
          aggregatedData[item.threatType] = {};
        }
        aggregatedData[item.threatType]![timePeriod] = 
          (aggregatedData[item.threatType]![timePeriod] || 0) + item.incidentCount;
      }
    });

    const uniqueThreatTypes = Object.keys(aggregatedData) as ReportsThreatType[];
    
    const series = uniqueThreatTypes.map((threatType: ReportsThreatType) => ({
      name: threatType,
      data: timePeriods.map((tp: string) => aggregatedData[threatType]?.[tp] || 0)
    }));

    const colors = uniqueThreatTypes.map((tt: ReportsThreatType) => THREAT_TYPE_COLORS[tt] || '#808080');

    return { series, categories, colors };
  }, [records, isDark]); // Dependency is now `records`

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'line',
      height: 350,
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      zoom: { enabled: false },
      toolbar: { show: false, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
    },
    colors: chartData.colors.length > 0 ? chartData.colors : getDefaultColors(chartData.series.length, theme),
    stroke: {
      curve: 'smooth',
      width: 2.5,
    },
    grid: {
      show: false,
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontFamily: 'inherit',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        color: isDark ? '#374151' : '#e5e7eb',
      },
    },
    yaxis: {
      title: {
        text: 'Incident Count',
        style: {
          color: isDark ? '#9ca3af' : '#6b7280',
          fontFamily: 'inherit',
          fontWeight: 500,
        }
      },
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontFamily: 'inherit',
        },
        formatter: (value) => Math.round(value).toString(),
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'inherit',
      offsetY: -5,
      labels: {
        colors: isDark ? '#cbd5e1' : '#475569',
      },
      itemMargin: {
        vertical: 5,
        horizontal: 10,
      }
    },
    dataLabels: {
      enabled: false, 
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: {
        format: 'MMM yy',
      },
      y: {
        formatter: function(value: number) {
          return value + " incidents";
        }
      },
      style: { fontFamily: 'inherit' }
    },
    responsive: [{
        breakpoint: 768, 
        options: {
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                offsetY: 5,
            }
        }
    }]
  }), [isDark, chartData, theme]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full rounded-lg" />;
    }

    if (error) {
      return (
        <div className={cn(
          "flex flex-col items-center justify-center h-[350px] text-center p-4 rounded-lg",
          isDark ? "bg-destructive/20 text-destructive-foreground" : "bg-destructive/10 text-destructive"
        )}>
          <AlertCircle className="h-12 w-12 mb-4 opacity-80" />
          <p className="text-lg font-semibold">Error Loading Chart</p>
          <p className="text-sm opacity-90">
            Could not load data for Threat Composition: {error.message}
          </p>
        </div>
      );
    }
    
    // Correctly check `records` (the direct array from the hook) for emptiness
    if (!records || !Array.isArray(records) || records.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[350px] text-center text-muted-foreground p-4">
          <AlertCircle className="h-12 w-12 mb-4 opacity-70" />
          <p className="text-lg font-semibold">No Data Available</p>
          <p className="text-sm">
            There is no threat composition data to display for the selected period.
          </p>
        </div>
      );
    }

    return (
      <ApexChart
        type="line" 
        height={380} 
        options={chartOptions}
        series={chartData.series}
      />
    );
  };

  return (
    <Card className={cn(isDark ? "bg-card" : "bg-card")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-lg font-medium">Threat Composition Overview</CardTitle>
          <CardDescription className="text-sm">
            Incident count trend by threat type
          </CardDescription>
        </div>
        <Link href="/dashboard/reports/threat-composition-overview" passHref>
          <Button variant="outline" size="sm">Manage Data</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ThreatCompositionOverviewChart;
