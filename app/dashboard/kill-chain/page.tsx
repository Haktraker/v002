import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import ThreatImpactOverviewChart from "@/components/dashboard/threat-impact-overview-chart";

export default function KillChain() {
    return (
        <PageContainer>
            <PageHeader title="Kill Chain Dashboard" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-3">
                    <ThreatImpactOverviewChart />
                </div>
                {/* Add additional Kill Chain related charts here as they become available */}
            </div>
        </PageContainer>
    );
}
