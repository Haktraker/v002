'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIPSAsset } from '@/lib/api/endpoints/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showToast } from '@/lib/utils/toast-utils';
import { CreateIPSDto } from '@/lib/api/types';
import { ArrowLeft, Upload } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData';
import Link from 'next/link';
import { useApiLoading } from '@/lib/utils/api-utils';

export default function NewIPPage() {
  const router = useRouter();
  const createIPSAsset = useCreateIPSAsset();
  const { withLoading } = useApiLoading();
  
  // State for single IP form
  const [formData, setFormData] = useState<CreateIPSDto>({
    value: '',
    location: '',
    description: '',
  });
  
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
  } = useTableData<CreateIPSDto>({
    requiredFields: ['value', 'location', 'description'],
    validateRow: (row: CreateIPSDto) => {
      // Add any IP-specific validation here
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(row.value)) {
        return {
          isValid: false,
          error: `Invalid IP address format: ${row.value}`
        };
      }
      return { isValid: true };
    },
    defaultSort: { key: 'value', direction: 'asc' },
    defaultPageSize: 5,
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle single IP submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await withLoading(createIPSAsset.mutateAsync(formData));
      showToast('IP asset created successfully', 'success');
      router.push('/dashboard/assets/ips');
    } catch (error) {
      showToast('Failed to create IP asset', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bulk submission
  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      showToast('No valid IP data to submit', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Process each entry
      for (const entry of csvData) {
        try {
          await withLoading(createIPSAsset.mutateAsync(entry));
          successCount++;
        } catch (error) {
          console.error('Failed to add entry:', error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showToast(`Successfully added ${successCount} IP entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
        router.push('/dashboard/assets/ips');
      } else {
        showToast('Failed to add any IP entries', 'error');
      }
    } catch (error) {
      console.error('Bulk import failed:', error);
      showToast('Bulk import process failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/assets/ips">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">New IP Asset</h1>
        </div>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Create IP Asset</CardTitle>
              <CardDescription>Add a new IP address to monitor</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">IP Address</Label>
                    <Input
                      id="value"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      placeholder="192.168.1.1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Server Room A"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Details about this IP address"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    Create IP Asset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import IP Assets</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple entries. The file should contain columns for value (IP address),
                location, and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csvFile">CSV File</Label>
                <Input 
                  id="csvFile" 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isProcessing || isSubmitting}
                />
              </div>
              
              <Button 
                type="button" 
                onClick={handleProcessCSV}
                disabled={!csvFile || isProcessing || isSubmitting}
                className="mt-2"
              >
                {isProcessing ? 'Processing...' : 'Process CSV'}
              </Button>
              
              {currentPageData.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Preview ({csvData.length} entries)</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previousPage()}
                        disabled={pagination.currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {pagination.currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => nextPage()}
                        disabled={pagination.currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('value')}
                          >
                            IP Address
                            {sortConfig?.key === 'value' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => handleSort('location')}
                          >
                            Location
                            {sortConfig?.key === 'location' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentPageData.map((entry: CreateIPSDto, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/assets/ips')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={csvData.length === 0 || isSubmitting}
              >
                {isSubmitting ? `Creating Entries (${csvData.length})...` : `Import ${csvData.length} Entries`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}