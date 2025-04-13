'use client'
import ComplianceScoresChart from "@/components/dashboard/compliance-scores-chart";
import { UserRiskDistributionChart } from "@/components/dashboard/user-risk-distribution-chart";
import { useGetComplianceScores } from "@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores";
import { useGetUserRiskDistributions } from "@/lib/api/endpoints/security-breach-indicators/user-risk-distribution/user-risk-distribution";

export default function securityBreachIndicators() {
    const { data: complianceScores, isLoading: complianceScoresLoading, error: complianceScoresErrors } = useGetComplianceScores();
    const { data: userRiskDistribution, isLoading: userRiskLoading, error: userRiskErrors } = useGetUserRiskDistributions();

    const transformedRiskData = userRiskDistribution?.map(distribution => {
      const businessUnit = distribution.bu[0];
      return {
        businessUnit: businessUnit.buName,
        critical: businessUnit.severities.find(s => s.severity === "Critical")?.count || 0,
        high: businessUnit.severities.find(s => s.severity === "High")?.count || 0,
        medium: businessUnit.severities.find(s => s.severity === "Medium")?.count || 0,
        low: businessUnit.severities.find(s => s.severity === "Low")?.count || 0
      };
    }) || [];

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