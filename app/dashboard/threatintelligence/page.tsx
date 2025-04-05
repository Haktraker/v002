"use client";

import { 
  useGetSuspiciousIPs, 
  useGetIOCs, 
  useGetAPTFeeds,
  useGetThreatIntelligenceFeeds,
  useGetThreatNews,
  useGetGeoWatch
} from "@/lib/api/endpoints/threat-intelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Globe, Info, Shield, Target, User, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

export default function ThreatIntelligencePage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Threat Intelligence</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SuspiciousIPsCard />
          <IOCsCard />
          <APTFeedsCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ThreatFeedsCard />
          <GeoWatchCard />
          <ThreatNewsCard />
        </div>
      </div>
    </PageContainer>
  );
}

function SuspiciousIPsCard() {
  const { data: suspiciousIPs, isLoading } = useGetSuspiciousIPs();
  const count = suspiciousIPs?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Suspicious IPs</CardTitle>
        </div>
        <Link href="/dashboard/threatintelligence/suspicious_ips" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {`${count} suspicious IP addresses detected`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function IOCsCard() {
  const { data: iocs, isLoading } = useGetIOCs();
  const count = iocs?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <CardTitle className="text-md font-medium">IOCs</CardTitle>
        </div>
        <Link href="/dashboard/threatintelligence/iocs" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {`${count} indicators of compromise`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function APTFeedsCard() {
  const { data: aptFeeds, isLoading } = useGetAPTFeeds();
  const count = aptFeeds?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <CardTitle className="text-md font-medium">APT Feeds</CardTitle>
        </div>
        <Link href="/dashboard/threatintelligence/apt_feeds" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {`${count} advanced persistent threat feeds`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ThreatFeedsCard() {
  const { data: threatFeeds, isLoading } = useGetThreatIntelligenceFeeds();
  const count = threatFeeds?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Threat Feeds</CardTitle>
        </div>
        <Link href="/dashboard/threatintelligence/threat_feeds" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {`${count} threat intelligence feeds`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GeoWatchCard() {
  const { data: geoWatch, isLoading } = useGetGeoWatch();
  const count = geoWatch?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Geo Watch</CardTitle>
        </div>
        <Link href="/dashboard/threatintelligence/geo_watch" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {`${count} geographical threat alerts`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ThreatNewsCard() {
  const { data: threatNews, isLoading } = useGetThreatNews();
  const count = threatNews?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Threat News</CardTitle>
        </div>
        <Link href="/dashboard/threatintelligence/threat_news" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {`${count} threat news articles`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}