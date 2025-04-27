'use client';

import { useGlobalFilter } from '@/lib/context/GlobalFilterContext';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/ui/page-header';
import NetworkSecurityChart from '@/components/dashboard/network-security-chart';
import { useGetNetworkSecurities } from '@/lib/api/endpoints/business-units-security/network-security';
import { NetworkSecurity } from '@/lib/api/types';

export default function BusinessUnitsSecurityPage() {
    const { selectedMonth, selectedYear } = useGlobalFilter();

    // Prepare query params based on global filters
    const queryParams = {
        month: selectedMonth === 'All' ? undefined : selectedMonth,
        year: selectedYear === 'All' ? undefined : selectedYear,
    };

    const { 
        data: networkSecurityData, 
        isLoading: networkSecurityLoading, 
        error: networkSecurityError
    } = useGetNetworkSecurities(queryParams); 

    console.log(networkSecurityData,"networkSecurityData");
    
    // Since the chart fetches its own data based on its hook, we don't need to pass props here.
    // If you refactor the chart to accept data props, you'll use the commented-out section above.

    return (
        <PageContainer>
            <PageHeader title="Business Units Security" />  {/* Updated title */}
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-6 mt-6">
                {/* Render the NetworkSecurityChart and pass data, loading, and error states as props */}
                 <NetworkSecurityChart 
                    data={networkSecurityData}
                    isLoading={networkSecurityLoading}
                    error={networkSecurityError}
                 />
                 {/* Remove the version that fetched its own data */}
                 {/* <NetworkSecurityChart /> */}
            </div>
        </PageContainer>
    );
}

