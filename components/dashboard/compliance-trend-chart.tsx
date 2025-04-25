import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplianceTrend } from '@/lib/api/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { FRAMEWORKS_LIST } from '@/lib/constants/framworks-list';

const ApexChart = dynamic(() => import('@/components/ui/apex-chart'), { ssr: false });

interface ComplianceTrendChartProps {
  data?: ComplianceTrend[];
  isLoading?: boolean;
  error?: any;
}

const ComplianceTrendChart = ({ data, isLoading, error }: ComplianceTrendChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const trendData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], series: [] };

    const labels = data.map(item => `${item.month.substring(0, 3)}`); // Use month abbreviation

    // Group scores by framework across all BUs for each month
    const series = FRAMEWORKS_LIST.map(framework => {
      const scores = data.map(item => {
        // Sum scores for the current framework across all BUs in this month
        const totalScore = item.bu?.reduce((sum, bu) => {
          const compliance = bu.compliance.find(c => c.complianceName === framework);
          return sum + (compliance?.complianceScore ?? 0);
        }, 0) ?? 0;
        return totalScore;
      });

      return { name: framework, data: scores };
    });

    return { labels, series };
  }, [data]);

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'line',
      height: 350,
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155',
      toolbar: { show: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: trendData.labels,
      labels: {
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '13px',
          fontFamily: 'inherit',
        },
      },
      axisBorder: { color: 'hsl(var(--border))' },
      axisTicks: { color: 'hsl(var(--border))' },
    },
    yaxis: {
      // Remove title as it's not in the screenshot
      // title: {
      //   text: 'Score',
      //   style: {
      //     color: 'hsl(var(--muted-foreground))',
      //     fontFamily: 'inherit',
      //   },
      // },
      labels: {
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontFamily: 'inherit',
        },
      },
      min: 0,
      // Adjust max based on screenshot y-axis
      max: 400, // Adjusted from 500 based on screenshot
      tickAmount: 4, // Match screenshot ticks (0, 95, 190, 285, 380)
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: isDark ? 'dark' : 'light',
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: undefined, // optional, uses shades of same color
        inverseColors: true,
        opacityFrom: 0.8,
        opacityTo: 0.8,
        stops: [0, 100]
      }
    },
    colors: [
      '#00E396', // ISO 27001 (Green)
      '#008FFB', // NIST CSF (Blue)
      '#775DD0', // PDPL (Purple)
      '#FEB019', // CIS Controls (Orange)
    ],
    legend: {
      position: 'bottom', // Match screenshot
      horizontalAlign: 'center',
      fontSize: '13px',
      fontFamily: 'inherit',
      labels: { colors: 'hsl(var(--foreground))' },
      itemMargin: { horizontal: 15, vertical: 5 }, // Increased spacing
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        radius: 12,
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true, // Show tooltip for all series at the same point
      intersect: false, // Show tooltip even when not directly hovering over a point
      style: {
        fontFamily: 'inherit',
        fontSize: '13px',
      },
      x: {
        formatter: function (val: string | number, { dataPointIndex }: { dataPointIndex: number }) {
          // Get month name from original data if possible, otherwise use label
          const monthYear = data?.[dataPointIndex] ? `${data[dataPointIndex].month}` : trendData.labels[dataPointIndex];
          return `Month: ${monthYear}`;
        }
      },
      y: {
        formatter: (val: number | null) => (val !== null ? val.toFixed(0) : 'N/A'), // Format as integer
        title: {
          formatter: (seriesName: string) => `${seriesName}:`
        }
      },
      marker: {
        show: true,
      },
    },
    grid: {
      show: true, // Show grid lines like in screenshot
      borderColor: 'hsl(var(--border))',
      strokeDashArray: 3,
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
    },
    markers: { // Add markers to points like in screenshot
      size: 5,
      hover: {
        size: 7
      }
    }
  }), [isDark, trendData, data]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md text-sm">
          Error loading compliance trend data: {error.message || 'Unknown error'}
        </div>
      );
    }

    if (!trendData || trendData.labels.length === 0 || trendData.series.every(s => s.data.every(d => d === null || d === 0))) {
      return (
        <div className="text-center text-muted-foreground py-8 text-sm">
          No compliance trend data available.
        </div>
      );
    }

    return (
      <ApexChart
        options={chartOptions}
        series={trendData.series}
        type="line"
        height={350}
      />
    );
  };

  return (
    <Card className={`flex-1 flex flex-col ${isDark ? 'bg-[#171727] border-0' : 'bg-white'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Compliance Trend</CardTitle>
          <CardDescription>Scores over time</CardDescription>
        </div>
        <Link href="/dashboard/cybersecurity-compliance-dashboard/compliance-trends">
          <Button variant="outline" >
            Manage All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pt-4"> {/* Added padding top */}
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ComplianceTrendChart;
