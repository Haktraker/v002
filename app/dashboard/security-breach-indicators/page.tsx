'use client'
import ComplianceScoresChart from "@/components/dashboard/compliance-scores-chart";
import { UserRiskDistributionChart } from "@/components/dashboard/user-risk-distribution-chart";
import NetworkAnomaliesChart from "@/components/dashboard/network-anomalies-chart";
import { useGetComplianceScores } from "@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores";
import { useGetUserRiskDistributions } from "@/lib/api/endpoints/security-breach-indicators/user-risk-distribution/user-risk-distribution";
import { useGetNetworkAnomalies } from "@/lib/api/endpoints/security-breach-indicators/network-anomalies/network-anomalies";
import { useGetSecurityIncidentTrends } from "@/lib/api/endpoints/security-breach-indicators/security-incident-trends/security-incident-trends";
import { SecurityIncidentTrendsChart } from "@/components/dashboard/security-incident-trends-chart";
import { useGlobalFilter } from '@/lib/context/GlobalFilterContext'; // Import the hook
import { GlobalFilterComponent } from '@/components/dashboard/global-filter'; // Import the component
import { useGetSecurityIssues } from '@/lib/api/endpoints/security-breach-indicators/active-security-issues/active-security-issues'; // Import the hook for security issues
import SecurityIssues from '@/components/dashboard/securityIssues'; // Import the SecurityIssues component

export default function SecurityBreachIndicatorsPage() { // Renamed component for clarity
    const { selectedMonth, selectedYear } = useGlobalFilter(); // Get filter values

    // Prepare parameters for hooks, omitting 'All'
    const queryParams = {
      month: selectedMonth === 'All' ? undefined : selectedMonth,
      year: selectedYear === 'All' ? undefined : selectedYear,
    };

    // Pass conditional parameters to the hooks
    const { data: complianceScores, isLoading: complianceScoresLoading, error: complianceScoresErrors } = useGetComplianceScores(queryParams);
    const { data: userRiskDistribution, isLoading: userRiskLoading, error: userRiskErrors } = useGetUserRiskDistributions(queryParams);
    const { data: networkAnomalies, isLoading: networkAnomaliesLoading, error: networkAnomaliesErrors } = useGetNetworkAnomalies(queryParams);
    const { data: securityIncidentTrends, isLoading: securityIncidentTrendsLoading, error: securityIncidentTrendsErrors } = useGetSecurityIncidentTrends(queryParams);
    const { data: securityIssuesData, isLoading: securityIssuesLoading, error: securityIssuesError } = useGetSecurityIssues(queryParams); // Fetch security issues data

    console.log(securityIssuesData,"securityIssuesData")
    // Render components with the conditional parameters
    // ... (other components)
    // Wrap content in a div and add the filter component as a child pr
    return (
      <div> {/* Wrap content in a div */} 
        <GlobalFilterComponent /> {/* Add the filter component here */} 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4"> {/* Adjusted gap and padding */} 
            <ComplianceScoresChart 
              data={complianceScores} 
              isLoading={complianceScoresLoading} 
              error={complianceScoresErrors} 
            />
            <UserRiskDistributionChart 
              data={userRiskDistribution} 
              isLoading={userRiskLoading} 
              error={userRiskErrors}
            />
            
            <NetworkAnomaliesChart 
              data={networkAnomalies}
              isLoading={networkAnomaliesLoading}
              error={networkAnomaliesErrors}
            />
            <SecurityIncidentTrendsChart 
              data={securityIncidentTrends}
              isLoading={securityIncidentTrendsLoading}
              error={securityIncidentTrendsErrors}
            />
            {/* Render the SecurityIssues component, spanning both columns */} 
            <SecurityIssues 
              data={securityIssuesData} 
              isLoading={securityIssuesLoading} 
              error={securityIssuesError} 
            />
        </div>
      </div>
    );
}