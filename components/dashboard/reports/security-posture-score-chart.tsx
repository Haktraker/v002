'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsSecurityPostureScore } from '@/lib/api/reports-types/types'; // Updated type import
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define interfaces for component props
interface ReportsSecurityPostureScoreChartProps {
  data: ReportsSecurityPostureScore[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Helper function to determine letter grade (adjust ranges as needed)
const getLetterGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

// --- COMPONENT START ---
const ReportsSecurityPostureScoreChart = ({ data, isLoading, error }: ReportsSecurityPostureScoreChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [latestScore, setLatestScore] = useState<ReportsSecurityPostureScore | null>(null);
  const [percentageValue, setPercentageValue] = useState<number>(0);
  const [letterGrade, setLetterGradeState] = useState<string>('-');

  useEffect(() => {
    if (!isLoading && !error && data && data.length > 0) {
      const scoreData = data[0]; // Assuming latest is first
      setLatestScore(scoreData);

      const percentageStr = scoreData.percentage?.replace('%', '');
      const numericPercentage = percentageStr ? parseFloat(percentageStr) : 0;
      setPercentageValue(isNaN(numericPercentage) ? 0 : numericPercentage);

      setLetterGradeState(getLetterGrade(numericPercentage));

    } else if (!isLoading) {
      setLatestScore(null);
      setPercentageValue(0);
      setLetterGradeState('-');
    }
  }, [data, isLoading, error]);

  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      height: 300,
      type: 'radialBar',
      offsetY: -10,
      sparkline: {
          enabled: true
      },
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          margin: 0,
          size: '70%',
          background: isDark ? '#171727' : '#fff',
          image: undefined,
          imageOffsetX: 0,
          imageOffsetY: 0,
          position: 'front',
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.24
          }
        },
        track: {
          background: isDark ? '#374151' : '#e5e7eb',
          strokeWidth: '67%',
          margin: 0,
          dropShadow: {
            enabled: true,
            top: -3,
            left: 0,
            blur: 4,
            opacity: 0.15
          }
        },
        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: false,
            color: isDark ? '#9ca3af' : '#6b7280',
            fontSize: '17px'
          },
          value: {
            formatter: function (val) {
              return letterGrade;
            },
            color: isDark ? '#f9fafb' : '#111827',
            fontSize: '36px',
            show: true,
            offsetY: 10,
          }
        }
      }
    },
    fill: {
        type: 'solid',
        colors: ['#FF6384'] // Example color, adjust as needed
    },
    series: [percentageValue],
    stroke: {
      lineCap: 'round'
    },
    labels: ['Score'],
    tooltip: {
        enabled: true,
        y: {
            formatter: (val: number) => `${val.toFixed(0)}%`
        },
        theme: isDark ? 'dark' : 'light'
    }
  }), [isDark, percentageValue, letterGrade]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[300px] w-full rounded-lg" />;
    }

    if (error) {
      return (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          Error loading report score: {error.message}
        </div>
      );
    }

    if (!latestScore) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No report score data available for the selected period.
        </div>
      );
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <ApexChart
                type="radialBar"
                height={300}
                options={chartOptions}
                series={chartOptions.series}
                className="-mt-4"
            />
            <p className="text-2xl font-semibold mt-2" style={{ color: '#FF6384' }}>
                Score {percentageValue.toFixed(0)}%
            </p>
        </div>
    );
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${isDark ? "bg-[#171727] border-0" : "bg-white"}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle className="text-base font-medium">Security Posture Score (Report)</CardTitle> {/* Title updated */}
          <CardDescription>Latest assessment for report</CardDescription> {/* Description updated */}
        </div>
        <Link href="/dashboard/reports/security-posture-score"> {/* Link updated */}
          <Button variant="outline" size="sm">Manage All</Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default ReportsSecurityPostureScoreChart;
