'use client';

import React, { useMemo } from 'react';
import { SocTeamPerformanceTeam } from '@/lib/api/types';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SocTeamPerformanceChartProps {
  data?: SocTeamPerformanceTeam[];
  isLoading?: boolean;
  error?: Error | string | null;
}

const SocTeamPerformanceChart: React.FC<SocTeamPerformanceChartProps> = ({
  data,
  isLoading = false,
  error = null
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // --- Data Transformation for Grouped Bar Chart (Team-BU focus) ---
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { series: [], categories: [] };
    }

    const categoriesSet = new Set<string>();
    const resRateData: { x: string; y: number }[] = [];
    const accuracyData: { x: string; y: number }[] = [];
    const incidentsData: { x: string; y: number }[] = [];

    data.forEach(team => {
      if (team.bu && Array.isArray(team.bu) && team.bu.length > 0) {
        team.bu.forEach(buDetail => {
          const category = `${team.teamName || 'Team?'} - ${buDetail.buName || 'BU?'}`;
          categoriesSet.add(category);

          // Validate numeric values before push
          const resRate = buDetail.resolutionRate;
          const acc = buDetail.accuracy;
          const incidents = buDetail.incidentsHandled;

          const validResRate = typeof resRate === 'number' && !isNaN(resRate) ? Math.round(resRate * 100) : 0;
          const validAccuracy = typeof acc === 'number' && !isNaN(acc) ? Math.round(acc * 100) : 0;
          const validIncidents = typeof incidents === 'number' && !isNaN(incidents) ? incidents : 0;

          // --- DEBUG LOGS ---
          console.log('Processing Category:', category);
          console.log('--- Values:', { validResRate, validAccuracy, validIncidents });
          console.log('--- Arrays before push:', { 
              resRateData_isArray: Array.isArray(resRateData),
              accuracyData_isArray: Array.isArray(accuracyData),
              incidentsData_isArray: Array.isArray(incidentsData) 
          });
          // --- END DEBUG LOGS ---

          resRateData.push({ 
            x: category,
            y: validResRate 
          });
          accuracyData.push({
            x: category,
            y: validAccuracy 
          });
          incidentsData.push({
            x: category,
            y: validIncidents
          });
        });
      }
    });

    const categories = Array.from(categoriesSet).sort(); // Sort categories alphabetically

    const series = [
      {
        name: 'Resolution Rate (%)',
        type: 'column',
        data: categories.map(cat => resRateData.find(d => d.x === cat)?.y ?? 0),
        // yaxisIndex: 0 // Assign to first y-axis (implied)
      },
      {
        name: 'Accuracy (%)',
        type: 'column',
        data: categories.map(cat => accuracyData.find(d => d.x === cat)?.y ?? 0),
        // yaxisIndex: 0 // Assign to first y-axis (implied)
      },
      {
        name: 'Incidents Handled',
        type: 'column',
        data: categories.map(cat => incidentsData.find(d => d.x === cat)?.y ?? 0),
        // yaxisIndex: 1 // Assign to second y-axis (implied by order)
      }
    ];

    return { series, categories };

  }, [data]);

  // --- Chart Options for Grouped Bar Chart with Dual Y-Axis ---
  const options = useMemo(() => {
    const primaryColor = isDark ? '#a7a7a7' : '#334155'; // Adjusted for better contrast
    const secondaryColor = isDark ? '#a7a7a7' : '#334155';

    return {
      chart: {
        type: 'bar', // Keep as bar for grouped
        height: 400,
        stacked: false,
        toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: true } },
        foreColor: primaryColor,
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%', // Adjust for group spacing
          endingShape: 'rounded'
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
        categories: chartData.categories,
        title: { text: 'Team - Business Unit', style: { color: primaryColor } },
        labels: {
          style: { colors: primaryColor },
          rotate: -45,
          trim: true,
          hideOverlappingLabels: true,
        },
        tickPlacement: 'on'
      },
      yaxis: [
        {
          // First Y-axis (Percentages)
          seriesName: 'Resolution Rate (%)', // Link series by name
          axisTicks: { show: true },
          axisBorder: { show: true, color: '#3B82F6' }, // Color matches first series
          labels: {
            style: { colors: ['#3B82F6'] },
            formatter: (val: number) => `${val.toFixed(0)}%`
          },
          title: {
            text: "Rate / Accuracy (%)",
            style: { color: '#3B82F6' }
          },
          min: 0,
          max: 100,
          tooltip: {
             enabled: true
           }
        },
        {
           // Second Y-axis (Counts)
           seriesName: 'Incidents Handled', // Link series by name
           opposite: true,
           axisTicks: { show: true },
           axisBorder: { show: true, color: '#F59E0B' }, // Color matches third series
           labels: {
             style: { colors: ['#F59E0B'] },
             formatter: (val: number) => `${val}`
           },
           title: {
             text: "Incidents Handled (Count)",
             style: { color: '#F59E0B' }
           },
            // Let max be determined automatically for counts
            // min: 0, 
            tooltip: {
             enabled: true
           }
        }
      ],
      fill: {
        opacity: 1
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        shared: true, // Keep shared to show all values on hover
        intersect: false,
        y: {
           formatter: function (val: number, { seriesIndex, w }: any) {
               // Use seriesIndex to determine the unit
               if (seriesIndex === 0 || seriesIndex === 1) { // Resolution Rate or Accuracy
                 return val.toFixed(0) + "%";
               } else if (seriesIndex === 2) { // Incidents Handled
                 return val + " incidents";
               }
               return val; // Fallback
           }
         }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: primaryColor }
      },
      colors: ['#3B82F6', '#10B981', '#F59E0B'], // Blue (Res Rate), Green (Accuracy), Orange (Incidents)
      responsive: [{
        breakpoint: 1200,
        options: {
           xaxis: {
             labels: {
               rotate: -65,
             }
           },
        }
      },{
         breakpoint: 768,
         options: {
             chart: { height: 350 },
             xaxis: {
               labels: {
                 rotate: -90,
                 style: { fontSize: '10px' }
               }
             },
            legend: { position: 'bottom' }
         }
      }]
    };
  }, [chartData.categories, isDark]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[400px] w-full" />;
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Chart</AlertTitle>
          <AlertDescription>
            {typeof error === 'string' ? error : error.message || "An unknown error occurred."}
          </AlertDescription>
        </Alert>
      );
    }

    if (!chartData.series || chartData.series.length === 0 || chartData.categories.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no SOC team performance data to display.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <ApexChart
        type="bar"
        height={400}
        options={options}
        series={chartData.series}
      />
    );
  };

  // --- Component Structure ---
  return (
    <Card className={`flex-1 flex flex-col ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          SOC Performance by Team & Business Unit
        </CardTitle>
        {/* Placeholder for potential filters or actions */}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default SocTeamPerformanceChart;
