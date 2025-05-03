'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBrandReputation } from '@/lib/api/endpoints/brand-reputation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateBrandReputationDto, BrandReputationStatus } from '@/lib/api/types';
import { ArrowLeft, Upload, Home } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData';
import Link from 'next/link';
import { useApiLoading } from '@/lib/utils/api-utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BrandReputationNew() {
  const router = useRouter();
  const createBrandReputation = useCreateBrandReputation();
  const { withLoading } = useApiLoading();
  
  // State for single entry form
  const [formData, setFormData] = useState<CreateBrandReputationDto>({
    brandName: '',
    domainName: '',
    incidentDescription: '',
    status: 'in progress',
    mitigationSteps: '',
    time: new Date().toISOString().split('T')[0],
    sampleFile: '',
  });
  
  const validateRow = (row: CreateBrandReputationDto) => {
    if (!row.brandName || !row.domainName || !row.incidentDescription) {
      return {
        isValid: false,
        error: `Missing required fields: ${!row.brandName ? 'Brand Name, ' : ''}${!row.domainName ? 'Domain Name, ' : ''}${!row.incidentDescription ? 'Incident Description' : ''}`
      };
    }
    
    const statusOptions: BrandReputationStatus[] = ['taking down', 'in progress', 'false positive', 'resolving'];
    if (row.status && !statusOptions.includes(row.status as BrandReputationStatus)) {
      return {
        isValid: false,
        error: `Invalid status: ${row.status}. Valid options are: ${statusOptions.join(', ')}`
      };
    }
    
    return { isValid: true };
  };

  // Table data handling with custom hook
  const {
    data: csvData,
    isProcessing,
    isSubmitting,
    csvFile,
    handleFileChange,
    handleProcessCSV,
    resetData,
    setIsSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
    sortConfig,
    handleSort,
  } = useTableData<CreateBrandReputationDto>({
    requiredFields: ['brandName', 'domainName', 'incidentDescription', 'status', 'time'],
    validateRow,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(async () => {
        await createBrandReputation.mutateAsync(formData);
        toast.success('Brand reputation entry created successfully');
        router.push('/dashboard/brand-reputation');
      });
    } catch (error) {
      console.error('Failed to create brand reputation entry:', error);
      toast.error('Failed to create brand reputation entry');
    }
  };

  const handleBulkSubmit = async () => {
    if (!csvData.length) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      await withLoading(async () => {
        for (const row of csvData) {
          try {
            await createBrandReputation.mutateAsync(row);
            successCount++;
          } catch (error) {
            console.error('Failed to create brand reputation entry:', error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/brand-reputation');
        } else {
          toast.error('Failed to create any entries');
        }
      });
    } catch (error) {
      console.error('Bulk submission failed:', error);
      toast.error('Bulk submission process failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions: BrandReputationStatus[] = [
    'taking down',
    'in progress',
    'false positive',
    'resolving'
  ];

  return (
    <div className="p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/brand-reputation">Brand Reputation</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/brand-reputation/new" className="font-semibold">
              Add New Entry
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/brand-reputation">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Brand Reputation Entry</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList>
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Single Entry</CardTitle>
                <CardDescription>
                  Enter the details for a single brand reputation entry.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      placeholder="Enter brand name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domainName">Domain Name</Label>
                    <Input
                      id="domainName"
                      value={formData.domainName}
                      onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                      placeholder="Enter domain name"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="date"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as BrandReputationStatus })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="incidentDescription">Incident Description</Label>
                  <Textarea
                    id="incidentDescription"
                    value={formData.incidentDescription}
                    onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                    placeholder="Enter incident description"
                    required
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mitigationSteps">Mitigation Steps</Label>
                  <Textarea
                    id="mitigationSteps"
                    value={formData.mitigationSteps}
                    onChange={(e) => setFormData({ ...formData, mitigationSteps: e.target.value })}
                    placeholder="Enter mitigation steps"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sampleFile">Sample File URL</Label>
                  <Input
                    id="sampleFile"
                    value={formData.sampleFile}
                    onChange={(e) => setFormData({ ...formData, sampleFile: e.target.value })}
                    placeholder="Enter sample file URL (optional)"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createBrandReputation.isPending}>
                  {createBrandReputation.isPending ? 'Creating...' : 'Create Entry'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple brand reputation entries.
                <br />
                <small className="text-muted-foreground">
                  The CSV should include: brandName, domainName, incidentDescription, status, time, and optionally mitigationSteps and sampleFile.
                </small>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isProcessing || isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={handleProcessCSV}
                    disabled={!csvFile || isProcessing || isSubmitting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Process CSV
                  </Button>
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Brand Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Domain Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Incident Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.brandName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.domainName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.status}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.time}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                {row.incidentDescription}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Page {pagination.currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={previousPage}
                          disabled={pagination.currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={nextPage}
                          disabled={pagination.currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={resetData}
                        disabled={isSubmitting}
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit All'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
