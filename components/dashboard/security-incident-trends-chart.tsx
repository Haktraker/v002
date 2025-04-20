'use client';
import React, { useMemo, useState } from 'react';
import  ApexChart  from '@/components/ui/apex-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SecurityIncidentTrend } from '@/lib/api/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SecurityIncidentTrendsChartProps = {
  data?: SecurityIncidentTrend[]; // Changed prop type
  isLoading?: boolean;
  error?: Error | string | null;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function SecurityIncidentTrendsChart({ 
  data, 
  isLoading = false, 
  error = null 
}: SecurityIncidentTrendsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentYear = (new Date().getFullYear()).toString();
  const currentMonth = MONTHS[new Date().getMonth()];
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Transform data for ApexCharts
  const series = useMemo(() => {
    if (!data) return [];

    // Filter data by selected year and month
    const filteredData = selectedYear === 'All' && selectedMonth === 'All' 
      ? data 
      : data.filter(trend => 
          (selectedYear === 'All' || trend.year === selectedYear) && 
          (selectedMonth === 'All' || trend.month === selectedMonth)
        );

    const allIncidents = filteredData.flatMap(trend =>
      trend.bu.flatMap(bu =>
        bu.incidents.map(incident => ({
          month: trend.month,
          year: trend.year,
          incidentType: incident.incident_name,
          count: incident.incident_score
        }))
      )
    );

    if (allIncidents.length === 0) return [];

    // Group by incident type and aggregate counts by month
    const incidentTypes = Array.from(new Set(allIncidents.map(item => item.incidentType)));
    // Sort months chronologically (assuming 'Month Year' format or similar)
    const months = Array.from(new Set(allIncidents.map(item => item.month)))
                     .sort((a, b) => +new Date(`01 ${a} ${data[0]?.year || new Date().getFullYear()}`) - +new Date(`01 ${b} ${data[0]?.year || new Date().getFullYear()}`)); // Basic sort, might need refinement based on actual month/year format

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
  }, [data, selectedYear, selectedMonth]);

  const options = useMemo(() => ({
    chart: {
      type: 'line',
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
      // Use the sorted months derived in the 'series' memo
      categories: data ? Array.from(new Set(data.flatMap(trend => trend.month)))
                      .sort((a, b) => +new Date(`01 ${a} ${data[0]?.year || new Date().getFullYear()}`) - +new Date(`01 ${b} ${data[0]?.year || new Date().getFullYear()}`)) : [], // Ensure consistent sorting
      title: { text: selectedMonth, style: { color: isDark ? '#e5e7eb' : '#374151' } },
      labels: { style: { colors: isDark ? '#e5e7eb' : '#374151' } }
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
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
    responsive: [{
      breakpoint: 768,
      options: {
        chart: { height: 300 },
        legend: { position: 'bottom' }
      }
    }]
  }), [data, isDark]);

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
            There is no security incident trend data to display.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <ApexChart
        type="line"
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
        <div className="flex items-center space-x-2">
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="All" value="All">
                All
              </SelectItem>
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
              <SelectItem key="All" value="All">
                All
              </SelectItem>
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
}