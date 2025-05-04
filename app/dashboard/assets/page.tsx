"use client";

import { useIPSAssets, useDomainAssets, usePortalAssets } from "@/lib/api/endpoints/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Globe, Server, Database } from "lucide-react";
import Link from "next/link";
import { PageContainer } from '@/components/layout/page-container';
import AssetsInventoryPage from "./assets-inventory";
import { useGetAssets } from "@/lib/api/endpoints/assets-inventory";

export default function AssetsPage() {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Assets</h1>
      </div>

      {/* Asset summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <IPsCard />
        <DomainsCard />
        <PortalsCard />
        <InventoryCard />
      </div>
      
      {/* Assets Inventory */}
      <AssetsInventoryPage />
    </PageContainer>
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
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground mt-2">
            {`${count} IP addresses monitored`}
          </div>
        )}
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
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground mt-2">
            {`${count} domains monitored`}
          </div>
        )}
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
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground mt-2">
            {`${count} portals monitored`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InventoryCard() {
  const { data: assetsInventory, isLoading } = useGetAssets();
  const count = assetsInventory?.data?.length || 0;
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <CardTitle className="text-md font-medium">Inventory</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">
          Assets
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-16" />
        ) : (
          <div className="text-4xl font-bold">
            {count}
          </div>
        )}
        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground mt-2">
            {`${count} assets in inventory`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}