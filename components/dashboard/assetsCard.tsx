'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIPSAssets, useDomainAssets, usePortalAssets } from "@/lib/api/endpoints/assets";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";
import Link from "next/link";

export function AssetsCard() {
  const { data: ipsData, isLoading: isLoadingIps } = useIPSAssets();
  const { data: domainsData, isLoading: isLoadingDomains } = useDomainAssets();
  const { data: portalsData, isLoading: isLoadingPortals } = usePortalAssets();

  const isLoading = isLoadingIps || isLoadingDomains || isLoadingPortals;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-md font-normal">Total Assets</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-16 mb-4" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total assets across all types
  const ipsCount = ipsData?.length || 0;
  const domainsCount = domainsData?.length || 0;
  const portalsCount = portalsData?.length || 0;
  const totalAssets = ipsCount + domainsCount + portalsCount;

  return (
    <Link href="/dashboard/assets">
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <CardTitle className="text-md font-normal py-1">Assets</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-center">{totalAssets}</div>
      </CardContent>
    </Card>
    </Link>

  );
}
