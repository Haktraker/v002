import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import UserBehaviorAnalyticsChart from '@/components/dashboard/user-behavior-analytics-chart';
import { GlobalFilterComponent } from '@/components/dashboard/global-filter';

export default function UserBehaviorAnalyticsDashboard() {
    return (
        <PageContainer>
            <PageHeader title="User Behavior Analytics Dashboard" />
            <GlobalFilterComponent />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <UserBehaviorAnalyticsChart />
                </div>
            </div>
        </PageContainer>
    );
}
