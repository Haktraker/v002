"use client";

import { useGetDarkWebMentions } from "@/lib/api/endpoints/dark-web-monitoring/dark-web-mention";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield, FileSearch } from "lucide-react";
import Link from "next/link";
import { PageContainer } from '@/components/layout/page-container';
import { DarkWebMentionType } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

export default function DarkWebMonitoringPage() {
  const { data: allMentions, isLoading } = useGetDarkWebMentions();
  const credentialsCount = allMentions?.filter(m => m.type === "credentials").length || 0;
  const assetsCount = allMentions?.filter(m => m.type === "corporate assets").length || 0;
  const brandCount = allMentions?.filter(m => m.type === "brand mentions").length || 0;
  const totalCount = allMentions?.length || 0;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dark Web Monitoring</h1>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-md font-medium">Dark Web Mentions</CardTitle>
          </div>
          <Link href="/dashboard/dark-web-monitoring/dark-web-mentions" className="text-sm text-muted-foreground hover:underline">
            Manage All
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-16" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold">{totalCount}</div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">total mentions</p>
                  <div className="flex gap-2">
                    <Badge variant={credentialsCount > 0 ? "destructive" : "outline"} className="text-xs">
                      {credentialsCount} credentials
                    </Badge>
                    <Badge variant={assetsCount > 0 ? "destructive" : "outline"} className="text-xs">
                      {assetsCount} assets
                    </Badge>
                    <Badge variant={brandCount > 0 ? "secondary" : "outline"} className="text-xs">
                      {brandCount} brand
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Credentials</span>
                    </div>
                    <Link href="/dashboard/dark-web-monitoring/dark-web-mentions?type=credentials" className="text-xs text-muted-foreground hover:underline">
                      View
                    </Link>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">{credentialsCount}</div>
                    <p className="text-xs text-muted-foreground">Leaked credentials found</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">Corporate Assets</span>
                    </div>
                    <Link href="/dashboard/dark-web-monitoring/dark-web-mentions?type=corporate+assets" className="text-xs text-muted-foreground hover:underline">
                      View
                    </Link>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">{assetsCount}</div>
                    <p className="text-xs text-muted-foreground">Assets exposed</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSearch className="h-4 w-4 text-secondary-foreground" />
                      <span className="text-sm font-medium">Brand Mentions</span>
                    </div>
                    <Link href="/dashboard/dark-web-monitoring/dark-web-mentions?type=brand+mentions" className="text-xs text-muted-foreground hover:underline">
                      View
                    </Link>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">{brandCount}</div>
                    <p className="text-xs text-muted-foreground">Brand mentions detected</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}