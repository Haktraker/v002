'use client'
import ComplianceScoresChart from "@/components/dashboard/compliance-scores-chart";
import { useGetComplianceScores } from "@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores";

export default function securityBreachIndicators() {
    const { data: complianceScores, isLoading, error } = useGetComplianceScores();

    return (
        <div className="p-6">
          <ComplianceScoresChart 
            data={complianceScores} 
            isLoading={isLoading} 
            error={error} 
          />
        </div>
      );
}