'use client'

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import SecurityPostureScoreChart from '@/components/dashboard/security-posture-score-chart';
import ThreatCompositionOverviewChart from '@/components/dashboard/threat-composition-overview-chart';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { useGetSecurityPostureScores } from '@/lib/api/endpoints/executive-dashboard/security-posture-score'; // Import the hook

// Import other necessary charts and components for the executive dashboard here

export default function ExecutiveDashboard() {
  const { selectedMonth, selectedYear } = useGlobalFilter(); // Get filter values

  // Prepare parameters for hooks, omitting 'All'
  const queryParams = {
    month: selectedMonth === 'All' ? undefined : selectedMonth,
    year: selectedYear === 'All' ? undefined : selectedYear,
    // Add other specific filters for this dashboard if needed
  };

  // Fetch data for the Security Posture Score chart
  const { data: securityScoreData, isLoading: isSecurityScoreLoading, error: securityScoreError } = useGetSecurityPostureScores(queryParams);

  // Data for ThreatCompositionOverviewChart is fetched internally using global filters

  return (
    <PageContainer>
      <PageHeader title="Executive Dashboard" />
      {/* Add Global Filters component */}
      <GlobalFilterComponent />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"> {/* Added mt-4 for spacing */}
        {/* Security Posture Score Chart */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1 flex justify-center items-start">
          <SecurityPostureScoreChart
            data={securityScoreData?.data}
            isLoading={isSecurityScoreLoading}
            error={securityScoreError}
          />
        </div>

        {/* Threat Composition Overview Chart */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <ThreatCompositionOverviewChart />
        </div>

        {/* Placeholder for other charts/components */}
        {/* <div className="col-span-1 md:col-span-1 lg:col-span-1"><YourChartComponent3 filters={queryParams} /></div> */}
        {/* <div className="col-span-1 md:col-span-2 lg:col-span-3"><YourTableComponent filters={queryParams} /></div> */}
      </div>
    </PageContainer>
  );
}

