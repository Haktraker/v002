'use client';

import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import NetworkSecurityChart from '@/components/dashboard/network-security-chart';
import BusinessUnitsAlertsChart from '@/components/dashboard/business-units-alerts-chart';
import AlertSeverityTrendChart from '@/components/dashboard/alert-severity-trend-chart';
import CompanyRiskScoresChart from '@/components/dashboard/company-risk-scores-chart';
import RiskAssessmentByBuChart from '@/components/dashboard/risk-assessment-by-bu-chart';
import { useGetNetworkSecurities } from '@/lib/api/endpoints/business-units-security/network-security';
import { useGetBuAlerts } from '@/lib/api/endpoints/business-units-security/business-units-alerts';
import { useGetAlertSeverityTrends } from '@/lib/api/endpoints/business-units-security/alert-severity-trend';
import { useGetCompanyRiskScores } from '@/lib/api/endpoints/business-units-security/company-risk-scores';
import { useGetRiskAssessmentsByBu } from '@/lib/api/endpoints/business-units-security/risk-assessment-by-bu';
import { NetworkSecurity, BuAlerts, AlertSeverityTrend, CompanyRiskScore, RiskAssessmentByBu } from '@/lib/api/types';

export default function BusinessUnitsSecurityPage() {
    const { selectedMonth, selectedYear } = useGlobalFilter();

    // Prepare query params based on global filters
    const queryParams = {
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    };

    // Fetch data for Network Security Chart
    const {
        data: networkSecurityData,
        isLoading: networkSecurityLoading,
        error: networkSecurityError
    } = useGetNetworkSecurities(queryParams);

    // Fetch data for BU Alerts Chart
    const {
        data: buAlertsData,
        isLoading: buAlertsLoading,
        error: buAlertsError
    } = useGetBuAlerts(queryParams);

    const { 
        data: alertTrendData, 
        isLoading: alertTrendLoading, 
        error: alertTrendError 
    } = useGetAlertSeverityTrends(queryParams);

    // Fetch data for Company Risk Scores Chart
    const {
        data: companyRiskScoresData,
        isLoading: companyRiskScoresLoading,
        error: companyRiskScoresError
    } = useGetCompanyRiskScores(queryParams);

    // Fetch data for Risk Assessment by BU Chart
    const {
        data: riskAssessmentData,
        isLoading: riskAssessmentLoading,
        error: riskAssessmentError
    } = useGetRiskAssessmentsByBu(queryParams);

    console.log(companyRiskScoresData);

    return (
        <PageContainer>
            <PageHeader title="Business Units Security" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 mt-6">
                <div className='lg:col-span-2 xl:col-span-2'>
                    <NetworkSecurityChart
                        data={networkSecurityData}
                        isLoading={networkSecurityLoading}
                        error={networkSecurityError}
                    />
                </div>
                <div>
                    <BusinessUnitsAlertsChart
                        data={buAlertsData}
                        isLoading={buAlertsLoading}
                        error={buAlertsError}
                    />
                </div>
                <div>
                    <AlertSeverityTrendChart
                        data={alertTrendData}
                        isLoading={alertTrendLoading}
                        error={alertTrendError}
                    />
                </div>
                <div>
                    <CompanyRiskScoresChart
                        data={companyRiskScoresData || []} 
                        isLoading={companyRiskScoresLoading}
                        error={companyRiskScoresError}
                    />
                </div>
                <div>
                    <RiskAssessmentByBuChart
                        data={riskAssessmentData || []}
                        isLoading={riskAssessmentLoading}
                        error={riskAssessmentError}
                    />
                </div>
            </div>
        </PageContainer>
    );
}

