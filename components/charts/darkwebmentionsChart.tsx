"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { DarkWebMention } from "@/lib/api/types";

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

interface DarkWebMentionsChartProps {
  data: DarkWebMention[] | undefined;
  isLoading: boolean;
  className?: string;
}

export function DarkWebMentionsChart({ data: allMentions, isLoading, className = "" }: DarkWebMentionsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  console.log(isDark);

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
      },
      background: 'transparent'
    },
    theme: {
      mode: isDark ? 'dark' : 'light'
    },
    colors: ['#ef4444', '#f97316', '#6b7280'],
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
        fontWeight: 600,
        color: isDark ? '#fff' : '#000'
      }
    },
    grid: {
      borderColor: isDark ? '#333' : '#f1f1f1',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        title: {
          formatter: (seriesName: string) => seriesName
        }
      }
    },
    xaxis: {
      categories: chartData?.months || [],
      title: {
        text: 'Month',
        style: {
          color: isDark ? '#fff' : '#000'
        }
      },
      labels: {
        rotate: -45,
        trim: false,
        style: {
          colors: isDark ? '#fff' : '#000'
        }
      },
      axisBorder: {
        color: isDark ? '#333' : '#f1f1f1'
      },
      axisTicks: {
        color: isDark ? '#333' : '#f1f1f1'
      }
    },
    yaxis: {
      title: {
        text: 'Number of Mentions',
        style: {
          color: isDark ? '#fff' : '#000'
        }
      },
      min: 0,
      labels: {
        style: {
          colors: isDark ? '#fff' : '#000'
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: isDark ? '#fff' : '#000'
      }
    }
  };

  return (
    <Card className={className}>
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
  );
}