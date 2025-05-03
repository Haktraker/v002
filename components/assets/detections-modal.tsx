'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { getDetectionsByDeviceName } from '@/lib/api/endpoints/assets-inventory';
import { IThreatDetection } from '@/lib/api/types';

interface DetectionsModalProps {
  deviceName: string;
}

export const DetectionsModal = ({ deviceName }: DetectionsModalProps) => {
  const [detections, setDetections] = useState<IThreatDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDetections: 0,
    limit: 10,
  });
  
  // Fetch detections when device name or pagination changes
  useEffect(() => {
    if (!deviceName) return;
    
    const fetchDetections = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getDetectionsByDeviceName(
          deviceName, 
          pagination.currentPage, 
          pagination.limit
        );
        
        setDetections(response.data);
        
        if (response.pagination) {
          setPagination({
            currentPage: response.pagination.currentPage,
            totalPages: response.pagination.totalPages,
            totalDetections: response.pagination.totalDetections || 0,
            limit: response.pagination.limit,
          });
        }
      } catch (err) {
        console.error('Failed to fetch detections:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast.error('Failed to load threat detections');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetections();
  }, [deviceName, pagination.currentPage, pagination.limit]);
  
  // Handle pagination change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page,
    }));
  };
  
  // Render severity badge with appropriate color and icon
  const renderSeverityBadge = (severity: IThreatDetection['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Critical
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 bg-orange-600">
            <AlertTriangle className="h-3 w-3" />
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Medium
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-600">
            <HelpCircle className="h-3 w-3" />
            Low
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            {severity || 'Unknown'}
          </Badge>
        );
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: IThreatDetection['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </Badge>
        );
      case 'investigating':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-600">
            <AlertCircle className="h-3 w-3" />
            Investigating
          </Badge>
        );
      case 'unresolved':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            Unresolved
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };
  
  // Define table columns
  const columns: ColumnDef<IThreatDetection>[] = [
    {
      accessorKey: 'detectionTime',
      header: 'Detection Time',
      cell: ({ row }) => {
        const time = row.getValue('detectionTime') as string;
        return time ? new Date(time).toLocaleString() : 'N/A';
      },
    },
    {
      accessorKey: 'securityProduct',
      header: 'Security Product',
    },
    {
      accessorKey: 'threatType',
      header: 'Threat Type',
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const severity = row.getValue('severity') as IThreatDetection['severity'];
        return renderSeverityBadge(severity);
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as IThreatDetection['status'];
        return renderStatusBadge(status);
      },
    },
    {
      accessorKey: 'actionTaken',
      header: 'Action Taken',
      cell: ({ row }) => {
        const actionTaken = row.getValue('actionTaken') as string;
        return actionTaken || 'No action recorded';
      },
    },
  ];
  
  if (!deviceName) {
    return <div className="py-4 text-center">No device selected</div>;
  }
  
  return (
    <div className="space-y-4">
      {loading ? (
        // Loading skeleton
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        // Error message
        <div className="py-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : detections.length === 0 ? (
        // Empty state
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No threat detections found for this device</p>
        </div>
      ) : (
        // Data table
        <DataTable
          columns={columns}
          data={detections}
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            onPageChange: handlePageChange,
          }}
        />
      )}
      
      {!loading && detections.length > 0 && (
        <div className="text-sm text-muted-foreground text-right">
          Showing {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalDetections)}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalDetections)} of {pagination.totalDetections} detections
        </div>
      )}
    </div>
  );
};
