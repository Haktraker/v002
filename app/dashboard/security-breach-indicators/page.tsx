'use client'
import ComplianceScoresChart from "@/components/dashboard/compliance-scores-chart";
import { UserRiskDistributionChart } from "@/components/dashboard/user-risk-distribution-chart";
import { useGetComplianceScores } from "@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores";
import { useGetUserRiskDistributions } from "@/lib/api/endpoints/security-breach-indicators/user-risk-distribution/user-risk-distribution";

export default function securityBreachIndicators() {
    const { data: complianceScores, isLoading: complianceScoresLoading, error: complianceScoresErrors } = useGetComplianceScores();
    const { data: userRiskDistribution, isLoading: userRiskLoading, error: userRiskErrors } = useGetUserRiskDistributions();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="w-full h-full flex">
          <div className="w-full h-full flex-1 flex flex-col">
            <ComplianceScoresChart 
              data={complianceScores} 
              isLoading={complianceScoresLoading} 
              error={complianceScoresErrors} 
            />
          </div>
        </div>
        <div className="w-full h-full flex">
          <div className="w-full h-full flex-1 flex flex-col">
            <UserRiskDistributionChart 
              data={userRiskDistribution} 
              isLoading={userRiskLoading} 
              error={userRiskErrors}
            />
          </div>
        </div>
      </div>
    );
}