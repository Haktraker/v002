'use client';

import { ComplianceOverviewByFrameworkChart } from '@/components/dashboard/compliance-overview-by-framework-chart';
import { useGetComplianceFrameworks } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compliance-overview-by-framework';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import useBreadcrumb from '@/hooks/use-breadCrumb';
import ComplianceTrendChart from '@/components/dashboard/compliance-trend-chart';
import { useGetComplianceTrends } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compliance-trend';

export default function CybersecurityComplianceDashboard() {
    const { selectedMonth, selectedYear } = useGlobalFilter(); // Get filter values
    const { BreadcrumbComponent } = useBreadcrumb(); // Get BreadcrumbComponent

    // Prepare parameters for hooks, omitting 'All'
    const queryParams = {
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    };

    const { data: complianceData, isLoading: complianceLoading, error: complianceError } = useGetComplianceFrameworks(queryParams);
    const { data: complianceTrendsData, isLoading: complianceTrendsLoading, error: complianceTrendsErro } = useGetComplianceTrends(queryParams);

console.log(complianceTrendsData,"complianceTrendsData")
    // Render components with the conditional parameters
    return (
        <PageContainer>
            <PageHeader title="Cybersecurity Compliance Dashboard" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4">
                    <ComplianceOverviewByFrameworkChart
                        data={complianceData}
                        isLoading={complianceLoading}
                        error={complianceError}
                    />
                </div>
                <div className="bg-background rounded-lg p-4">
                    <ComplianceTrendChart
                        data={complianceTrendsData}
                        isLoading={complianceLoading}
                        error={complianceError}
                    />
                </div>
            </div>
        </PageContainer>
    );
}