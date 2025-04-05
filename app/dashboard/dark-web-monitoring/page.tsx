"use client";

import { useGetDarkWebMentions } from "@/lib/api/endpoints/dark-web-monitoring/dark-web-mention";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield, FileSearch } from "lucide-react";
import Link from "next/link";
import { PageContainer } from '@/components/layout/page-container';
import { DarkWebMentionType } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Month order for sorting
const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

type Month = typeof MONTH_ORDER[number];

// Type guard for Month type
function isValidMonth(month: string): month is Month {
  return MONTH_ORDER.includes(month as Month);
}

export default function DarkWebMonitoringPage() {
  const { data: allMentions, isLoading } = useGetDarkWebMentions();
  const credentialsCount = allMentions?.filter(m => m.type === "credentials").length || 0;
  const assetsCount = allMentions?.filter(m => m.type === "corporate assets").length || 0;
  const brandCount = allMentions?.filter(m => m.type === "brand mentions").length || 0;
  const totalCount = allMentions?.length || 0;

  // Process data for the timeline chart
  const processChartData = () => {
    if (!allMentions) return null;

    // Group mentions by month and year
    const groupedData = allMentions.reduce((acc, mention) => {
      // Validate month format
      if (!isValidMonth(mention.month)) {
        console.warn(`Invalid month format: ${mention.month}`);
        return acc;
      }

      const key = `${mention.month}-${mention.year}`;
      
      if (!acc[key]) {
        acc[key] = {
          month: mention.month,
          year: mention.year,
          credentials: 0,
          assets: 0,
          brand: 0
        };
      }

      if (mention.type === "credentials") acc[key].credentials++;
      if (mention.type === "corporate assets") acc[key].assets++;
      if (mention.type === "brand mentions") acc[key].brand++;

      return acc;
    }, {} as Record<string, { month: Month; year: string; credentials: number; assets: number; brand: number; }>);

    // Sort months chronologically
    const sortedKeys = Object.keys(groupedData).sort((a, b) => {
      const [monthA, yearA] = a.split("-") as [Month, string];
      const [monthB, yearB] = b.split("-") as [Month, string];
      
      // Compare years first
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      
      // If same year, compare months
      return MONTH_ORDER.indexOf(monthA) - MONTH_ORDER.indexOf(monthB);
    });

    // Format x-axis labels as "Month Year"
    const formattedLabels = sortedKeys.map(key => {
      const { month, year } = groupedData[key];
      return `${month} ${year}`;
    });

    return {
      months: formattedLabels,
      series: [
        {
          name: "Credentials",
          data: sortedKeys.map(key => groupedData[key].credentials)
        },
        {
          name: "Corporate Assets",
          data: sortedKeys.map(key => groupedData[key].assets)
        },
        {
          name: "Brand Mentions",
          data: sortedKeys.map(key => groupedData[key].brand)
        }
      ]
    };
  };

  const chartData = processChartData();

  const chartOptions: ApexOptions = {
    chart: {
      type: 'line' as const,
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      }
    },
    colors: ['#ef4444', '#ef4444', '#6b7280'],
    stroke: {
      width: [3, 2, 2],
      curve: 'smooth',
      dashArray: [0, 5, 5]
    },
    title: {
      text: 'Mentions Tracking Timeline',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600
      }
    },
    grid: {
      borderColor: '#f1f1f1',
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    tooltip: {
      y: {
        title: {
          formatter: (seriesName: string) => seriesName
        }
      }
    },
    xaxis: {
      categories: chartData?.months || [],
      title: {
        text: 'Month'
      },
      labels: {
        rotate: -45,
        trim: false
      }
    },
    yaxis: {
      title: {
        text: 'Number of Mentions'
      },
      min: 0
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dark Web Monitoring</h1>
      </div>

      <div className="grid gap-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-md font-medium">Dark Web Mentions</CardTitle>
            </div>
            <Link href="/dashboard/dark-web-monitoring/dark-web-mentions" className="text-sm text-muted-foreground hover:underline">
              Manage All
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-16" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold">{totalCount}</div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">total mentions</p>
                    <div className="flex gap-2">
                      <Badge variant={credentialsCount > 0 ? "destructive" : "outline"} className="text-xs">
                        {credentialsCount} credentials
                      </Badge>
                      <Badge variant={assetsCount > 0 ? "destructive" : "outline"} className="text-xs">
                        {assetsCount} assets
                      </Badge>
                      <Badge variant={brandCount > 0 ? "secondary" : "outline"} className="text-xs">
                        {brandCount} brand
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : chartData && (
              <Chart
                options={chartOptions}
                series={chartData.series}
                type="line"
                height={400}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}