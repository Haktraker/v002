'use client'
import ComplianceScoresChart from "@/components/dashboard/compliance-scores-chart";
import { UserRiskDistributionChart } from "@/components/dashboard/user-risk-distribution-chart";
import { useGetComplianceScores } from "@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores";
import { useGetUserRiskDistributions } from "@/lib/api/endpoints/security-breach-indicators/user-risk-distribution/user-risk-distribution";

export default function securityBreachIndicators() {
    const { data: complianceScores, isLoading: complianceScoresLoading, error: complianceScoresErrors } = useGetComplianceScores();
    const { data: userRiskDistribution, isLoading: userRiskLoading, error: userRiskErrors } = useGetUserRiskDistributions();

    // Aggregate severity counts across all months and years for each business unit
    const transformedRiskData = userRiskDistribution ? (() => {
      // Create a map to store aggregated data by business unit
      const buAggregateMap = new Map<string, {
        businessUnit: string;
        critical: number;
        high: number;
        medium: number;
        low: number;
      }>();
      
      // Process all distributions and aggregate by business unit
      userRiskDistribution.forEach(distribution => {
        // Process each business unit in the distribution
        distribution.bu.forEach(businessUnit => {
          const buName = businessUnit.buName;
          
          // Get or initialize the aggregate for this business unit
          const aggregate = buAggregateMap.get(buName) || {
            businessUnit: buName,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          };
          
          // Add severity counts to the aggregate
          businessUnit.severities.forEach(severity => {
            switch(severity.severity) {
              case "Critical":
                aggregate.critical += severity.count;
                break;
              case "High":
                aggregate.high += severity.count;
                break;
              case "Medium":
                aggregate.medium += severity.count;
                break;
              case "Low":
                aggregate.low += severity.count;
                break;
            }
          });
          
          // Update the map with the new aggregate
          buAggregateMap.set(buName, aggregate);
        });
      });
      
      // Convert the map to an array
      return Array.from(buAggregateMap.values());
    })() : [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="w-full">
          <ComplianceScoresChart 
            data={complianceScores} 
            isLoading={complianceScoresLoading} 
            error={complianceScoresErrors} 
          />
        </div>
        <div className="w-full">
          <UserRiskDistributionChart 
            data={transformedRiskData} 
            isLoading={userRiskLoading} 
            error={userRiskErrors}
          />
        </div>
      </div>
    );
}