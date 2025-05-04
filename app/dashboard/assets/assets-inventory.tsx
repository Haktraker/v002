'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash, Edit, Eye, Plus, ArrowLeft, Home } from 'lucide-react';

// Shadcn UI components
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// API functions and types
import { useGetAssets, useDeleteAsset } from '@/lib/api/endpoints/assets-inventory';
import { IAssetInventory } from '@/lib/api/types';

// Custom components for our functionality
import { AssetForm } from '@/components/assets/asset-form';
import { AssetDetails } from '@/components/assets/asset-details';
import { DetectionsModal } from '@/components/assets/detections-modal';

export default function AssetsInventoryPage() {
  // State for filters
  const [filters, setFilters] = useState({
    BU: '',
    Function: '',
    Location: '',
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
  });
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [detectionsModalOpen, setDetectionsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected asset state
  const [selectedAsset, setSelectedAsset] = useState<IAssetInventory | null>(null);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string>('');
  
  const router = useRouter();
  
  // Use React Query for data fetching
  const { 
    data: assetsResponse, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetAssets({
    page: pagination.currentPage,
    limit: pagination.limit,
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    ),
  });
  
  // Use React Query for delete mutation
  const { mutate: deleteAssetMutation } = useDeleteAsset();
  
  // Extract data from response
  const assets = assetsResponse?.data || [];
  const paginationInfo = {
    currentPage: assetsResponse?.pagination?.currentPage || 1,
    totalPages: assetsResponse?.pagination?.totalPages || 1,
    totalAssets: assetsResponse?.pagination?.totalAssets || 0,
    limit: assetsResponse?.pagination?.limit || 10,
  };
  
  // Handle pagination change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page,
    }));
  };
  
  // Handle creating a new asset
  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setCreateModalOpen(true);
  };
  
  // Handle editing an asset
  const handleEditAsset = (asset: IAssetInventory) => {
    setSelectedAsset(asset);
    setEditModalOpen(true);
  };
  
  // Handle viewing asset details
  const handleViewAsset = (asset: IAssetInventory) => {
    setSelectedAsset(asset);
    setViewModalOpen(true);
  };
  
  // Handle opening detections modal for a device
  const handleOpenDetections = (deviceName: string) => {
    setSelectedDeviceName(deviceName);
    setDetectionsModalOpen(true);
  };
  
  // Handle confirming deletion of an asset
  const handleConfirmDelete = (asset: IAssetInventory) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };
  
  // Handle actually deleting the asset
  const handleDeleteAsset = () => {
    if (!selectedAsset) return;
    
    deleteAssetMutation(selectedAsset._id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedAsset(null);
      },
      onError: (err) => {
        console.error('Failed to delete asset:', err);
      }
    });
  };
  
  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    refetch();
  };
  
  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      BU: '',
      Function: '',
      Location: '',
    });
    
    // Reset to first page
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));
  };
  
  // Define table columns
  const columns: ColumnDef<IAssetInventory>[] = [
    {
      accessorKey: 'BU',
      header: 'BU',
    },
    {
      accessorKey: 'Function',
      header: 'Function',
    },
    {
      accessorKey: 'Location',
      header: 'Location',
    },
    {
      accessorKey: 'Server',
      header: 'Server (Y/N)',
      cell: ({ row }) => row.original.Server ? 'Y' : 'N',
    },
    {
      accessorKey: 'Ecommerce',
      header: 'Ecommerce (Y/N)',
      cell: ({ row }) => row.original.Ecommerce ? 'Y' : 'N',
    },
    {
      accessorKey: 'SecuritySolutions',
      header: 'Security solutions',
    },
    {
      accessorKey: 'NetworkInfrastructure',
      header: 'Network infrastructure',
    },
    {
      accessorKey: 'Notes',
      header: 'Notes',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const asset = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewAsset(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleConfirmDelete(asset)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  return (
    <div className="p-6">
      {/* Breadcrumb navigation */}
      {/* <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/assets">Assets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/assets" className="font-semibold">
              Assets Inventory
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb> */}

      <div className="flex items-center justify-between my-6">
        <h1 className="text-2xl font-semibold">Assets Inventory</h1>
        <Button onClick={handleCreateAsset}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Asset
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter the assets by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="BU">Business Unit</Label>
              <Input
                id="BU"
                name="BU"
                value={filters.BU}
                onChange={handleFilterChange}
                placeholder="Filter by Business Unit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Function">Function</Label>
              <Input
                id="Function"
                name="Function"
                value={filters.Function}
                onChange={handleFilterChange}
                placeholder="Filter by Function"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Location">Location</Label>
              <Input
                id="Location"
                name="Location"
                value={filters.Location}
                onChange={handleFilterChange}
                placeholder="Filter by Location"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Assets List</CardTitle>
          <CardDescription>
            {paginationInfo.totalAssets > 0 
              ? `Showing ${Math.min((paginationInfo.currentPage - 1) * paginationInfo.limit + 1, paginationInfo.totalAssets)}-${Math.min(paginationInfo.currentPage * paginationInfo.limit, paginationInfo.totalAssets)} of ${paginationInfo.totalAssets} assets` 
              : 'No assets found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            // Error message
            <div className="py-8 text-center">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'An error occurred while loading assets'}
              </p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : assets.length === 0 ? (
            // Empty state
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No assets found</p>
              <Button onClick={handleCreateAsset} className="mt-4">
                Add Your First Asset
              </Button>
            </div>
          ) : (
            // Data table
            <DataTable
              columns={columns}
              data={assets}
              pagination={{
                currentPage: paginationInfo.currentPage,
                totalPages: paginationInfo.totalPages,
                onPageChange: handlePageChange,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      
      {/* Create Asset Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Asset</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new asset to the inventory. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          <AssetForm 
            onSuccess={() => {
              setCreateModalOpen(false);
              refetch();
            }}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Asset Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Asset</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the asset information. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <AssetForm 
              asset={selectedAsset}
              onSuccess={() => {
                setEditModalOpen(false);
                refetch();
              }}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Asset Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Asset Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed information about the selected asset.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <AssetDetails 
              asset={selectedAsset}
              onEdit={() => {
                setViewModalOpen(false);
                setSelectedAsset(selectedAsset);
                setEditModalOpen(true);
              }}
              onViewDetections={handleOpenDetections}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detections Modal */}
      <Dialog open={detectionsModalOpen} onOpenChange={setDetectionsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Threat Detections - {selectedDeviceName}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Showing all threat detections for this device.
            </DialogDescription>
          </DialogHeader>
          <DetectionsModal deviceName={selectedDeviceName} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the asset {selectedAsset?.BU} - {selectedAsset?.Function} and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
