'use client'; // Make it a client component

import SecurityPostureScoreChart from '@/components/dashboard/security-posture-score-chart';
import { useGetSecurityPostureScores } from '@/lib/api/endpoints/executive-dashboard/security-posture-score'; // Import the hook

export default function SecurityPostureScorePage() {
  // Fetch data for the chart
  const { data: securityScoreData, isLoading: isSecurityScoreLoading, error: securityScoreError } = useGetSecurityPostureScores();

  return (
    <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Security Posture Score</h1>
        <div className="flex justify-center">
            {/* Pass the required props */}
            <SecurityPostureScoreChart
              data={securityScoreData?.data} // Pass the actual data array
              isLoading={isSecurityScoreLoading}
              error={securityScoreError}
            />
        </div>
    </div>
  );
}


