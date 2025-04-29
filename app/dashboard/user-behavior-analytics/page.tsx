import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import UserBehaviorAnalyticsChart from '@/components/dashboard/user-behavior-analytics-chart';
import UserRiskScoreDistributionsChart from '@/components/dashboard/user-risk-score-distributions-chart';
import UserRiskTimelineChart from '@/components/dashboard/user-risk-timeline-chart';
import BehavioralPatternChart from '@/components/dashboard/behavioral-pattern-chart';
import { AnomalyCategoryDistributionChart } from '@/components/dashboard/anomaly-category-distribution-chart';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';

export default function UserBehaviorAnalyticsDashboard() {
    return (
        <PageContainer>
            <PageHeader title="User Behavior Analytics Dashboard" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-3">
                    <UserBehaviorAnalyticsChart />
                </div>
                <div className="lg:col-span-1">
                    <UserRiskScoreDistributionsChart />
                </div>
                <div className="lg:col-span-1">
                    <UserRiskTimelineChart />
                </div>
                <div className="lg:col-span-1">
                    <BehavioralPatternChart />
                </div>
                <div className="lg:col-span-1">
                    <AnomalyCategoryDistributionChart />
                </div>
            </div>
        </PageContainer>
    );
}
