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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total assets across all types
  const ipsCount = ipsData?.length || 0;
  const domainsCount = domainsData?.length || 0;
  const portalsCount = portalsData?.length || 0;
  const totalAssets = ipsCount + domainsCount + portalsCount;
  console.log('Total assets:', totalAssets);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalAssets}</div>
        <div className="text-xs text-muted-foreground mt-1">
          <Link href="/dashboard/assets/ips">{ipsCount} IPs</Link>
          ,&nbsp;
          <Link href="/dashboard/assets/domains">{domainsCount} Domains</Link>
          ,&nbsp;
          <Link href="/dashboard/assets/portals">{portalsCount} Portals</Link>
        </div>
      </CardContent>
    </Card>
  );
}
