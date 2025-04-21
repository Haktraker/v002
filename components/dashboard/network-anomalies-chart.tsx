'use client';

import { useMemo } from 'react'; // Import useMemo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Remove Select imports as they are no longer needed here
import ApexChart from '@/components/ui/apex-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
// Remove useGetNetworkAnomalies import
import { NetworkAnomaly, NetworkAnomalyDay } from '@/lib/api/types';

// Remove MONTHS constant

interface NetworkAnomaliesChartProps {
  data: NetworkAnomaly[] | undefined; // Data is now expected to be pre-filtered
  isLoading: boolean;
  error: Error | null;
}

const NetworkAnomaliesChart = ({ data: response, isLoading, error }: NetworkAnomaliesChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Remove currentYear and currentMonth calculation
  // Remove useState for selectedYear and selectedMonth

  // Remove the internal useGetNetworkAnomalies call

  // Process the data passed via props directly
  // Assuming the 'response' prop now contains only the data for the selected month/year
  const selectedAnomalyData = response?.[0]; // Get the first (and likely only) item

  // Format the data for ApexCharts: [{ x: dayNumber, y: score }, ...]
  const chartSeriesData = useMemo(() => 
    selectedAnomalyData?.days.map(day => ({ x: day.dayNumber, y: day.score })) || [],
    [selectedAnomalyData]
  ); // Use useMemo for performance

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      toolbar: { show: false },
      background: 'transparent',
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      foreColor: isDark ? '#f8fafc' : '#334155'
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 5,
      colors: ['#6366f1']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [50, 100],
        colorStops: [{
          offset: 0,
          color: '#6366f1',
          opacity: 1
        }]
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      type: 'numeric',
      title: { text: 'Day of Month', style: { color: isDark ? '#94a3b8' : '#64748b' } },
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#64748b' },
        formatter: (value: string) => {
          const numValue = parseFloat(value);
          return !isNaN(numValue) ? Math.round(numValue).toString() : value;
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: 'Score', style: { color: isDark ? '#94a3b8' : '#64748b' } },
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#64748b' },
        formatter: (val: number) => Math.round(val).toString()
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: { formatter: (val: number) => `Day ${Math.round(val)}` },
      y: { formatter: (val: number) => val.toString() }
    }
  };

  const renderContent = () => {
    if (isLoading) { // Use the isLoading prop
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (error) { // Use the error prop
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load network anomalies data.
          </AlertDescription>
        </Alert>
      );
    }

    // Ensure there's data to display
    if (!chartSeriesData || chartSeriesData.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No network anomaly data available for the selected period.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <ApexChart
        type="area"
        height={350}
        options={chartOptions}
        series={[{ name: 'Score', data: chartSeriesData }]} // Use the formatted data
      />
    );
  };

  return (
    <Card className={isDark ? 'bg-[#171727] border-0' : 'bg-white'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Network Anomalies
        </CardTitle>
        {/* Remove the Select components for month and year */}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default NetworkAnomaliesChart;