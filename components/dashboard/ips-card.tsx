'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIPSEvents } from "@/lib/api/endpoints/ips";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

export function IPsCard() {
  const { data, isLoading } = useIPSEvents();

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">IPs</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data?.length || 0}</div>
      </CardContent>
    </Card>
  );
}
