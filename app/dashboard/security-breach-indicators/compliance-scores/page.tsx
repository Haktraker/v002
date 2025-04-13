'use client';

import { useGetComplianceScores } from '@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores';
import ComplianceScoresChart from '@/components/dashboard/compliance-scores-chart';

const ComplianceScoresPage = () => {
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
};

export default ComplianceScoresPage;