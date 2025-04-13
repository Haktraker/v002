'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import ApexChart from '@/components/ui/apex-chart'; // Assuming correct path
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplianceScore } from '@/lib/api/types'; // Assuming this type definition is correct and path is valid
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define interfaces for component props and internal data structures
interface ChartData {
  labels: string[];
  series: number[];
}

interface AggregatedCompliance {
  complianceName: string;
  count: number;
  color: string;
}

interface ComplianceScoresChartProps {
  data: ComplianceScore[] | undefined; // Use the specific type from your API definitions
  isLoading: boolean;
  error: Error | null;
}

// Define a unique, non-empty value for the "All" option in the Select dropdown
const ALL_TYPES_VALUE = "__ALL_COMPLIANCE_TYPES__";

// --- COMPONENT START ---
const ComplianceScoresChart = ({ data, isLoading, error }: ComplianceScoresChartProps) => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<ChartData>({ labels: [], series: [] });
  const [aggregatedCompliances, setAggregatedCompliances] = useState<AggregatedCompliance[]>([]);
  const [complianceList, setComplianceList] = useState<string[]>([]);
  // Initial state remains '' to signify "All" internally
  const [selectedCompliance, setSelectedCompliance] = useState<string>('');

  // Define a color map for compliance types
  const complianceColorMap = new Map<string, string>([
    ['ISO 27001', '#10B981'],  // Emerald
    ['HIPAA', '#3B82F6'],      // Blue
    ['PCI DSS', '#F59E0B'],    // Amber
    ['SOC 2', '#8B5CF6'],      // Violet
    ['GDPR', '#EC4899'],       // Pink
    ['NIST', '#6366F1'],       // Indigo
    ['SOX', '#06B6D4'],        // Cyan
    ['CCPA', '#F97316'],       // Orange
    ['FedRAMP', '#14B8A6'],    // Teal
  ]);

  // --- Effect to process incoming data ---
  useEffect(() => {
    // Check if data is valid and has the expected structure
    if (data && data.length > 0 && data[0]?.bu && Array.isArray(data[0].bu)) {
      const complianceMap = new Map<string, number>();
      const colorAssignments = new Map<string, string>();

      data[0].bu.forEach(bu => {
        // Ensure bu.compliances is an array before iterating
        if (bu && Array.isArray(bu.compliances)) {
          bu.compliances.forEach(comp => {
            // Basic validation for compliance entry
            if (!comp || typeof comp !== 'object') {
                console.warn('Skipping invalid compliance entry (not an object):', comp);
                return;
            }

            // Handle potentially missing or non-string complianceName
            let complianceName = typeof comp.complianceName === 'string' ? comp.complianceName.trim() : '';
            if (!complianceName) {
              complianceName = 'Unspecified Compliance'; // Assign a default name for empty/missing ones
            }

            // Handle potentially missing, null, or non-finite counts, defaulting to 0
            const count = (typeof comp.count === 'number' && Number.isFinite(comp.count)) ? comp.count : 0;

            // Aggregate counts
            const currentCount = complianceMap.get(complianceName) || 0;
            complianceMap.set(complianceName, currentCount + count);

            // Assign color if not already assigned
            if (!colorAssignments.has(complianceName)) {
              const predefinedColor = complianceColorMap.get(complianceName);
              colorAssignments.set(complianceName, predefinedColor || `hsl(${colorAssignments.size * 45}, 70%, 50%)`);
            }
          });
        } else {
            // Log if a business unit doesn't have a valid compliances array
            console.warn('Business unit missing or has invalid compliances array:', bu);
        }
      });

      // Convert map to array, sort by count descending
      const aggregated = Array.from(complianceMap.entries()).map(([complianceName, count]) => ({
        complianceName,
        count,
        color: colorAssignments.get(complianceName) || '#6B7280' // Default gray color
      }));
      aggregated.sort((a, b) => b.count - a.count);

      // Update state with aggregated data
      setAggregatedCompliances(aggregated);

      // Extract unique, non-empty compliance names for the filter dropdown list
      const allCompliances = aggregated
        .map(comp => comp.complianceName) // Already handled empty names above
        .filter(name => name && name.trim() !== ''); // Ensure not null/empty again

      // Use Set for efficient uniqueness guarantee
      setComplianceList(Array.from(new Set(allCompliances)));

      // Reset filter to 'All' (represented by empty string state) when data changes
      setSelectedCompliance('');

    } else {
      // Handle cases where data is empty, undefined, null, or malformed
      console.warn('Compliance data is empty or has unexpected structure:', data);
      setAggregatedCompliances([]);
      setComplianceList([]);
      setChartData({ labels: [], series: [] }); // Clear chart
      setSelectedCompliance(''); // Reset filter
    }
  }, [data]); // Re-run this effect only when the input 'data' prop changes

  // --- Effect to update chart when filter or aggregated data changes ---
  useEffect(() => {
    // Prepare data for the chart based on the current filter and aggregated list
    let filteredData = aggregatedCompliances;

    // Apply filter only if a specific compliance type (non-empty string) is selected
    if (selectedCompliance && selectedCompliance !== '') {
      filteredData = aggregatedCompliances.filter(comp => comp.complianceName === selectedCompliance);
    }

    // Map filtered data to chart labels and series
    const labels = filteredData.map(comp => comp.complianceName || 'Unspecified'); // Fallback for safety
    const series = filteredData.map(comp => comp.count);

    // Update the chart data state
    setChartData({ labels, series });

  }, [selectedCompliance, aggregatedCompliances]); // Re-run when filter or base data changes

  // --- Chart Configuration ---
  const isDark = theme === 'dark';

  const chartOptions: ApexCharts.ApexOptions = { // Use ApexCharts.ApexOptions for better type checking if available
    chart: {
      type: 'donut',
      toolbar: { show: true },
      background: 'transparent',
      foreColor: isDark ? '#f8fafc' : '#334155', // Text color for labels etc.
      animations: { enabled: true, speed: 500, animateGradually: { enabled: true, delay: 150 }, dynamicAnimation: { enabled: true, speed: 350 } }
    },
    labels: chartData.labels, // Use state directly, ApexCharts updates dynamically
    responsive: [{ breakpoint: 480, options: { chart: { width: 300 }, legend: { position: 'bottom' } } }],
    legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '14px',
        fontFamily: 'inherit',
        labels: {
          colors: isDark ? '#e5e7eb' : '#374151' // Legend text color
        },
        itemMargin: { horizontal: 10, vertical: 5 }
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function(value: number, { seriesIndex, w }: { seriesIndex: number; w: any }) {
          // Added safety checks for w, w.globals, w.globals.seriesTotals
          const totals = w?.globals?.seriesTotals;
          if (totals && Array.isArray(totals)) {
              const total = totals.reduce((a: number, b: number) => (a || 0) + (b || 0), 0);
              // Ensure value is a number before division
              const numericValue = typeof value === 'number' ? value : 0;
              const percentage = total > 0 ? ((numericValue / total) * 100).toFixed(1) : 0;
              return `${numericValue} (${percentage}%)`;
          }
          return value?.toString() ?? '0'; // Fallback if totals are not available
        }
      },
      style: { fontFamily: 'inherit', fontSize: '14px' }
    },
    // --- Updated Colors ---
    colors: chartData.labels.map(label => {
      const compliance = aggregatedCompliances.find(comp => comp.complianceName === label);
      return compliance?.color || '#6B7280'; // Default to gray if no color assigned
    }),
    // --- Updated Fill ---
    fill: {
      type: 'solid', // Use solid colors for clarity
      opacity: 1,
    },
    // --- Optional Stroke ---
    stroke: {
      width: 1, // Add a small border between segments
      colors: [isDark ? '#171727' : '#ffffff'] // Match card background for seamless look
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
      // palette: 'palette1' // Explicitly defining colors above is generally preferred over palettes
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%', // Adjust donut thickness
          labels: {
            show: true,
            name: {
                show: true,
                fontSize: '14px',
                fontFamily: 'inherit',
                color: isDark ? '#e5e7eb' : '#374151'
            },
            value: {
                show: true,
                fontSize: '16px',
                fontFamily: 'inherit',
                fontWeight: 'bold',
                color: isDark ? '#ffffff' : '#111827', // Make value more prominent
                formatter: function(val: any) { return val?.toString() ?? '0'; }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontFamily: 'inherit',
              color: isDark ? '#e5e7eb' : '#374151',
              formatter: function(w: any) {
                 // Added safety checks for totals calculation
                 const totals = w?.globals?.seriesTotals;
                 if (totals && Array.isArray(totals)) {
                     // Ensure elements are numbers before reducing
                     const validTotals = totals.filter(t => typeof t === 'number');
                     return validTotals.reduce((a: number, b: number) => a + b, 0).toString();
                 }
                 return '0'; // Fallback if totals aren't available or valid
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false // Keep disabled for donut clarity; tooltip/legend provide details
    }
  };

  // --- Render Logic ---

  // 1. Loading State
  if (isLoading) {
    return (
      <Card className={isDark ? "bg-[#171727] border-0" : "bg-white"}>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  // 2. Error State
  if (error) {
     return (
      <Card className={isDark ? "bg-[#171727] border-0" : "bg-white"}>
        <CardHeader>
          <CardTitle className={isDark ? "text-white" : "text-gray-900"}>Error Loading Data</CardTitle>
          <CardDescription className="text-destructive">
            {error.message || 'Failed to load compliance score data.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={isDark ? "text-gray-400" : "text-muted-foreground" + " text-sm"}>
            Please try refreshing the page. If the problem persists, contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 3. Success State (with data or no data message)
  return (
    <Card className={isDark ? "bg-[#171727] border-0" : "bg-white"}>
      <CardHeader>
        <CardTitle className={isDark ? "text-white" : "text-gray-900"}>Compliance Scores Distribution</CardTitle>
        <CardDescription className={isDark ? "text-gray-400" : ""}>
          Visualization of compliance scores across business units
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Conditionally render Select only if there are actual compliance types to filter */}
        {complianceList.length > 1 && ( // Show filter only if there's more than one type (or "Unspecified")
          <div className="mb-6">
            <Select
              // Use the placeholder value if state is '', otherwise use the state
              value={selectedCompliance === '' ? ALL_TYPES_VALUE : selectedCompliance}
              onValueChange={(value) => {
                 // If the placeholder value is selected, set state to '', otherwise set to the actual value
                 setSelectedCompliance(value === ALL_TYPES_VALUE ? '' : value);
              }}
            >
              <SelectTrigger className={`w-full md:w-[280px] ${isDark ? 'bg-[#2a2a3e] border-gray-600 text-white' : 'bg-white'}`}>
                <SelectValue placeholder="Filter by compliance type..." />
              </SelectTrigger>
              <SelectContent className={isDark ? 'bg-[#2a2a3e] border-gray-600 text-white' : ''}>
                 {/* Use the placeholder value for the "All" item */}
                 <SelectItem value={ALL_TYPES_VALUE}>All Compliance Types</SelectItem>
                 {/* Map over the actual compliance names */}
                 {complianceList.map((compliance) => (
                  // Ensure key and value are valid, non-empty strings
                  <SelectItem key={compliance} value={compliance}>
                    {compliance}
                  </SelectItem>
                 ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Chart Area */}
        <div className="h-[400px] w-full">
          {chartData.series.length > 0 ? (
            <ApexChart
              options={chartOptions} // Pass the configured options
              series={chartData.series} // Pass the data series
              type="donut"
              height="100%"
              width="100%"
            />
          ) : (
            // Message when there's no data to display (after loading/error checks)
            <div className="flex h-full w-full items-center justify-center">
              <p className={isDark ? "text-gray-500" : "text-muted-foreground"}>
                  No compliance data available{selectedCompliance ? ` for "${selectedCompliance}"` : ''}.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
// --- COMPONENT END ---

export default ComplianceScoresChart;