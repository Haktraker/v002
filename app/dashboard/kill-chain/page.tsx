import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';
import ThreatImpactOverviewChart from "@/components/dashboard/threat-impact-overview-chart";
import LockHeadPhasesChart from "@/components/dashboard/lock-head-phases-chart";
import ThreatBreakDownChart from "@/components/dashboard/threat-break-down-chart";

export default function KillChain() {
    return (
        <PageContainer>
            <PageHeader title="Kill Chain Dashboard" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-3">
                    <LockHeadPhasesChart />
                </div>
                <div className="">
                    <ThreatImpactOverviewChart />
                </div>
                <div className="">
                    <ThreatBreakDownChart />
                </div>
          
                {/* Add additional Kill Chain related charts here as they become available */}
            </div>
        </PageContainer>
    );
}
