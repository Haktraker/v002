'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ApexChart from '@/components/ui/apex-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { useGetNetworkAnomalies } from '@/lib/api/endpoints/security-breach-indicators/network-anomalies/network-anomalies';
import { NetworkAnomaly, NetworkAnomalyDay } from '@/lib/api/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface NetworkAnomaliesChartProps {
  data: NetworkAnomaly[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const NetworkAnomaliesChart = ({ data: response, isLoading, error }: NetworkAnomaliesChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const currentYear = (new Date().getFullYear()).toString();
  const currentMonth = MONTHS[new Date().getMonth()];
// State for selected year and month for filtering the chart data
const [selectedYear, setSelectedYear] = useState("2025");
const [selectedMonth, setSelectedMonth] = useState("March");

const { data: responseData, isLoading : isLoadingData, error:errorData } = useGetNetworkAnomalies();

// Find the data for the selected year and month
const selectedAnomalyData = responseData?.find((item: NetworkAnomaly) => 
  item.year === selectedYear && 
item.month === selectedMonth
);
console.log(selectedAnomalyData,"selectedAnomalyData" );

  // Format the data for ApexCharts: [{ x: dayNumber, y: score }, ...]
  const chartSeriesData = selectedAnomalyData?.days.map(day => ({ x: day.dayNumber, y: day.score })) || [];

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {

      toolbar: { show: false },
      background: 'transparent',
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      foreColor: isDark ? '#f8fafc' : '#334155' // Added theme-dependent text color
    },
    dataLabels: { enabled:false },
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
      title: { text: 'Day of Month', style: { color: isDark ? '#94a3b8' : '#64748b' } }, // Added theme-dependent title color
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#64748b' },
        formatter: (value: string) => {
          // Convert the string value back to a number for rounding
          const numValue = parseFloat(value);
          return !isNaN(numValue) ? Math.round(numValue).toString() : value;
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: 'Score', style: { color: isDark ? '#94a3b8' : '#64748b' } }, // Added theme-dependent title color
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#64748b' },
        formatter: (val:number) => Math.round(val).toString()
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      x: { formatter: (val: number) => `Day ${Math.round(val)}` },
      y: { formatter: (val: number) => val.toString() }
    }
  };

  const renderContent = () => {
    if (isLoadingData) {
      return <Skeleton className="h-[350px] w-full" />;
    }

    if (errorData) {
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
        <div className="flex items-center space-x-2">
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => (
                <SelectItem
                  key={+currentYear - i}
                  value={(+currentYear - i).toString()}
                >
                  {+currentYear - i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default NetworkAnomaliesChart;