'use client';

import { ComplianceOverviewByFrameworkChart } from '@/components/dashboard/compliance-overview-by-framework-chart';
import { useGetComplianceFrameworks } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compliance-overview-by-framework';
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import ComplianceTrendChart from '@/components/dashboard/compliance-trend-chart';
import { useGetComplianceTrends } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compliance-trend';
import ControlCategoryPerformanceChart from '@/components/dashboard/control-category-performance-chart';
import { useGetControlCategoryPerformances } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/control-category-performance';
import ComplianceRiskDistributionChart from '@/components/dashboard/compilance-risk-distribution-chart';
import { useGetComplianceRiskDistributions } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compilance-risk-distribution';

export default function CybersecurityComplianceDashboard() {
    const { selectedMonth, selectedYear } = useGlobalFilter();

    const queryParams = {
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    };

    const { data: complianceData, isLoading: complianceLoading, error: complianceError } = useGetComplianceFrameworks(queryParams);
    const { data: complianceTrendsData, isLoading: complianceTrendsLoading, error: complianceTrendsError } = useGetComplianceTrends(queryParams);
    
    const { 
        data: categoryPerformanceData, 
        isLoading: categoryPerformanceLoading, 
        error: categoryPerformanceError 
    } = useGetControlCategoryPerformances(queryParams);

    const {
        data: riskDistributionData,
        isLoading: riskDistributionLoading,
        error: riskDistributionError
    } = useGetComplianceRiskDistributions(queryParams);

    return (
        <PageContainer>
            <PageHeader title="Cybersecurity Compliance Dashboard" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <ComplianceOverviewByFrameworkChart
                    data={complianceData}
                    isLoading={complianceLoading}
                    error={complianceError}
                />
                <ComplianceRiskDistributionChart 
                    data={riskDistributionData}
                    isLoading={riskDistributionLoading}
                    error={riskDistributionError}
                />
                <ComplianceTrendChart
                    data={complianceTrendsData}
                    isLoading={complianceTrendsLoading}
                    error={complianceTrendsError}
                />
                <ControlCategoryPerformanceChart 
                    data={categoryPerformanceData}
                    isLoading={categoryPerformanceLoading}
                    error={categoryPerformanceError}
                />
            </div>
        </PageContainer>
    );
}