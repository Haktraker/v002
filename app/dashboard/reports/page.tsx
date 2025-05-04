'use client'

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import ReportsSecurityPostureScoreChart from '@/components/dashboard/reports/security-posture-score-chart';
import { useGetReportsSecurityPostureScores } from '@/lib/api/endpoints/reports/security-posture-score';
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
       <div>
        <ReportsSecurityPostureScoreChart data={securityPostureScoreData?.data} isLoading={isSecurityPostureScoreLoading} error={securityPostureScoreError}/>
       </div>
        <div className="col-span-1 md:col-span-2 xl:col-span-3 p-8 border rounded-lg text-center bg-muted/20">
          <p className="text-muted-foreground">Report components will be added here.</p>
        </div>
      </div>
    </PageContainer>
  );
}
