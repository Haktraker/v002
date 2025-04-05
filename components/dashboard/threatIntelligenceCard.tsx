'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  useGetSuspiciousIPs, 
  useGetIOCs, 
  useGetAPTFeeds,
  useGetThreatIntelligenceFeeds,
  useGetThreatNews,
  useGetGeoWatch
} from "@/lib/api/endpoints/threat-intelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import Link from "next/link";

export function ThreatIntelligenceCard() {
  const { data: suspiciousIPs, isLoading: isLoadingSuspiciousIPs } = useGetSuspiciousIPs();
  const { data: iocs, isLoading: isLoadingIOCs } = useGetIOCs();
  const { data: aptFeeds, isLoading: isLoadingAPTFeeds } = useGetAPTFeeds();
  const { data: threatFeeds, isLoading: isLoadingThreatFeeds } = useGetThreatIntelligenceFeeds();
  const { data: threatNews, isLoading: isLoadingThreatNews } = useGetThreatNews();
  const { data: geoWatch, isLoading: isLoadingGeoWatch } = useGetGeoWatch();

  const isLoading = 
    isLoadingSuspiciousIPs || 
    isLoadingIOCs || 
    isLoadingAPTFeeds || 
    isLoadingThreatFeeds || 
    isLoadingThreatNews || 
    isLoadingGeoWatch;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <CardTitle className="text-md font-medium">Threat Intelligence</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-16" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total threat intelligence items across all types
  const suspiciousIPsCount = suspiciousIPs?.length || 0;
  const iocsCount = iocs?.length || 0;
  const aptFeedsCount = aptFeeds?.length || 0;
  const threatFeedsCount = threatFeeds?.length || 0;
  const threatNewsCount = threatNews?.length || 0;
  const geoWatchCount = geoWatch?.length || 0;
  
  const totalThreats = 
    suspiciousIPsCount + 
    iocsCount + 
    aptFeedsCount + 
    threatFeedsCount + 
    threatNewsCount + 
    geoWatchCount;

  return (
    <Link href="/dashboard/threatintelligence">

    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Threat Intelligence</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-center py-2">{totalThreats}</div>
      </CardContent>
    </Card>
    </Link>

  );
}