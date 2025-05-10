'use client'

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import ReportsSecurityPostureScoreChart from '@/components/dashboard/reports/security-posture-score-chart';
import { useGetReportsSecurityPostureScores } from '@/lib/api/endpoints/reports/security-posture-score';
import ReportsIncidentAlertVolumeChart from '@/components/dashboard/reports/incident-alert-volume-chart';
import ThreatCompositionOverviewChart from '@/components/dashboard/reports/threat-composition-overview-chart';
import ReportsSecurityBreachIndicatorsChart from '@/components/dashboard/reports/security-breach-indicators-chart';
// Import other necessary components for the reports page here

export default function ReportsPage() {
  const { selectedMonth, selectedYear } = useGlobalFilter();

  const { data: securityPostureScoreData, isLoading: isSecurityPostureScoreLoading, error: securityPostureScoreError } = useGetReportsSecurityPostureScores({
    month: selectedMonth,
    year: selectedYear,
  });

  return (
    <PageContainer>
      <PageHeader title="Reports" />
      {/* Add Global Filters component */}
      <GlobalFilterComponent />
      
      {/* Grid layout for report components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
       <div>
        <ReportsSecurityPostureScoreChart data={securityPostureScoreData?.data} isLoading={isSecurityPostureScoreLoading} error={securityPostureScoreError}/>
       </div>
       <div>
        <ReportsIncidentAlertVolumeChart />
       </div>
       <div>
        <ReportsSecurityBreachIndicatorsChart />
       </div>
       <div className="col-span-full">
        <ThreatCompositionOverviewChart />
       </div>
      </div>
    </PageContainer>
  );
}
