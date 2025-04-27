'use client';

import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import NetworkSecurityChart from '@/components/dashboard/network-security-chart';
import BusinessUnitsAlertsChart from '@/components/dashboard/business-units-alerts-chart';
import { useGetNetworkSecurities } from '@/lib/api/endpoints/business-units-security/network-security';
import { useGetBuAlerts } from '@/lib/api/endpoints/business-units-security/business-units-alerts';
import { NetworkSecurity, BuAlerts } from '@/lib/api/types';

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

    return (
        <PageContainer>
            <PageHeader title="Business Units Security" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className='flex flex-col gap-6 col-span-2'>

                    <NetworkSecurityChart
                        data={networkSecurityData}
                        isLoading={networkSecurityLoading}
                        error={networkSecurityError}
                    />
                </div>
                <BusinessUnitsAlertsChart
                    data={buAlertsData}
                    isLoading={buAlertsLoading}
                    error={buAlertsError}
                />
            </div>
        </PageContainer>
    );
}

