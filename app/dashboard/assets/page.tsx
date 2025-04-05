"use client";

import { useIPSAssets, useDomainAssets, usePortalAssets } from "@/lib/api/endpoints/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Globe, Server } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IPsCard />
        <DomainsCard />
        <PortalsCard />
      </div>
    </div>
  );
}

function IPsCard() {
  const { data: ipsData, isLoading } = useIPSAssets();
  const count = ipsData?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <CardTitle className="text-md font-medium">IPs</CardTitle>
        </div>
        <Link href="/dashboard/assets/ips" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            `${count} IP addresses monitored`
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function DomainsCard() {
  const { data: domainsData, isLoading } = useDomainAssets();
  const count = domainsData?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Domains</CardTitle>
        </div>
        <Link href="/dashboard/assets/domains" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            `${count} domains monitored`
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function PortalsCard() {
  const { data: portalsData, isLoading } = usePortalAssets();
  const count = portalsData?.length || 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Portals</CardTitle>
        </div>
        <Link href="/dashboard/assets/portals" className="text-sm text-muted-foreground hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">{count}</div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            `${count} portals monitored`
          )}
        </p>
      </CardContent>
    </Card>
  );
}