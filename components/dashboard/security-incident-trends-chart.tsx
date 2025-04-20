'use client';
import React, { useMemo } from 'react';
import  ApexChart  from '@/components/ui/apex-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SecurityIncidentTrend } from '@/lib/api/types';

type SecurityIncidentTrendsChartProps = {
  data?: SecurityIncidentTrend[]; // Changed prop type
  isLoading?: boolean;
  error?: Error | string | null;
};

export function SecurityIncidentTrendsChart({ 
  data, 
  isLoading = false, 
  error = null 
}: SecurityIncidentTrendsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Transform data for ApexCharts
  const series = useMemo(() => {
    if (!data) return [];

    const allIncidents = data.flatMap(trend =>
      trend.bu.flatMap(bu =>
        bu.incidents.map(incident => ({
          month: trend.month,
          year: trend.year, // Keep year if needed for sorting/filtering
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
  }, [data]);

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
      <CardHeader>
        <CardTitle>Security Incident Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}