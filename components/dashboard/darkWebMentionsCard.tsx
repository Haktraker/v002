'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDarkWebMentions } from "@/lib/api/endpoints/dark-web-monitoring/dark-web-mention";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function DarkWebMentionsCard() {
  const { data: mentions, isLoading } = useGetDarkWebMentions();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-md font-medium">Dark Web Mentions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-16" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total mentions and breakdown by type
  const totalMentions = mentions?.length || 0;
  const credentialsCount = mentions?.filter(m => m.type === "credentials").length || 0;
  const assetsCount = mentions?.filter(m => m.type === "corporate assets").length || 0;
  const brandCount = mentions?.filter(m => m.type === "brand mentions").length || 0;

  return (
    <Link href="/dashboard/dark-web-monitoring">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-md font-medium">Dark Web Mentions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-center">{totalMentions}</div>
            {/* <div className="flex justify-center gap-2">
              <Badge variant={credentialsCount > 0 ? "destructive" : "outline"} className="text-xs">
                {credentialsCount} credentials
              </Badge>
              <Badge variant={assetsCount > 0 ? "destructive" : "outline"} className="text-xs">
                {assetsCount} assets
              </Badge>
              <Badge variant={brandCount > 0 ? "secondary" : "outline"} className="text-xs">
                {brandCount} brand
              </Badge>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}