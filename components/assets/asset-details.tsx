'use client';

import { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IAssetInventory } from '@/lib/api/types';

interface AssetDetailsProps {
  asset: IAssetInventory;
  onEdit: () => void;
  onViewDetections: (deviceName: string) => void;
}

export const AssetDetails = ({ asset, onEdit, onViewDetections }: AssetDetailsProps) => {
  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex justify-end">
        <Button onClick={onEdit} variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Asset
        </Button>
      </div>

      {/* General information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Business Unit</h3>
          <p className="text-base">{asset.BU}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Function</h3>
          <p className="text-base">{asset.Function}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
          <p className="text-base">{asset.Location}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Asset Type</h3>
          <div className="flex space-x-2">
            {asset.Server && <Badge variant="outline">Server</Badge>}
            {asset.Ecommerce && <Badge variant="outline">E-commerce</Badge>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Additional details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Security Solutions</h3>
          <p className="text-base">{asset.SecuritySolutions || "None specified"}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Network Infrastructure</h3>
          <p className="text-base">{asset.NetworkInfrastructure || "None specified"}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
          <p className="text-base whitespace-pre-wrap">{asset.Notes || "No notes provided"}</p>
        </div>
      </div>

      <Separator />

      {/* Machines table */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Machines ({asset.machines.length})</h3>
        
        {asset.machines.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Operating System</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asset.machines.map((machine, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => onViewDetections(machine.Name)}
                    >
                      {machine.Name}
                    </Button>
                  </TableCell>
                  <TableCell>{machine.IP}</TableCell>
                  <TableCell>{machine.User}</TableCell>
                  <TableCell>{machine.operatingSystem || "N/A"}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{machine.Notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No machines added to this asset</p>
        )}
      </div>

      {/* Servers table */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Servers ({asset.servers.length})</h3>
        
        {asset.servers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Operating System</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asset.servers.map((server, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {server.Name ? (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => server.Name && onViewDetections(server.Name)}
                      >
                        {server.Name}
                      </Button>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{server.IP || "N/A"}</TableCell>
                  <TableCell>{server.User || "N/A"}</TableCell>
                  <TableCell>{server.operatingSystem || "N/A"}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{server.Notes || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No servers added to this asset</p>
        )}
      </div>

      {/* Created/updated info */}
      <div className="pt-4 text-sm text-muted-foreground">
        <p>Created: {new Date(asset.createdAt).toLocaleString()}</p>
        <p>Last Updated: {new Date(asset.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};
