'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateThreatComposition } from '@/lib/api/endpoints/threat-composition/threatcomposition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateThreatCompositionDto } from '@/lib/api/types';
import { ArrowLeft, Home, Upload } from 'lucide-react';
import Link from 'next/link';
import { useApiLoading } from '@/lib/utils/api-utils';
import { useTableData } from '@/hooks/useTableData';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function NewThreatCompositionPage() {
  const router = useRouter();
  const createThreatComposition = useCreateThreatComposition();
  const { withLoading } = useApiLoading();
  
  // State for form
  const [formData, setFormData] = useState<CreateThreatCompositionDto>({
    month: '',
    year: '',
    severityLevel: '',
    threatType: '',
    attackVector: '',
    bu: '',
    affectedAsset: '',
    incidentCount: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'incidentCount' ? parseInt(value) || 0 : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(async () => {
        await createThreatComposition.mutateAsync(formData);
        toast.success('Threat composition created successfully');
        router.push('/dashboard/threat-composition');
      });
    } catch (error) {
      console.error('Failed to create threat composition:', error);
      toast.error('Failed to create threat composition');
    }
  };
  
  // Validate CSV row
  const validateRow = (row: CreateThreatCompositionDto) => {
    if (!row.month || !row.year || !row.severityLevel || !row.threatType || !row.attackVector || !row.bu || !row.affectedAsset) {
      return {
        isValid: false,
        error: 'Missing required fields'
      };
    }
    
    if (isNaN(row.incidentCount) || row.incidentCount < 0) {
      return {
        isValid: false,
        error: `Invalid incident count: ${row.incidentCount}`
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
  } = useTableData<CreateThreatCompositionDto>({
    requiredFields: ['month', 'year', 'severityLevel', 'threatType', 'attackVector', 'bu', 'affectedAsset', 'incidentCount'],
    validateRow,
    transformRow: (row: any) => ({
      ...row,
      incidentCount: parseInt(row.incidentCount) || 0
    })
  });

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
            await createThreatComposition.mutateAsync(row);
            successCount++;
          } catch (error) {
            console.error('Failed to create threat composition:', error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} threat compositions${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/threat-composition');
        } else {
          toast.error('Failed to create any threat compositions');
        }
      });
    } catch (error) {
      console.error('Bulk submission failed:', error);
      toast.error('Bulk submission process failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Options for select fields
  const severityLevelOptions = ['Low', 'Medium', 'High', 'Critical'];
  const threatTypeOptions = [
    'Phishing Attempts', 
    'Intrusion Attempts', 
    'Insider Threats', 
    'ATO', 
    'Trojan and Malware', 
    '3rd Party leaks', 
    'Attack Surfaces'
  ];
  const attackVectorOptions = [
    'Email', 
    'Network Ports', 
    'Social Engineering', 
    'Applications', 
    'Removable Media'
  ];
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const yearOptions = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());
  const buOptions = [
    "HO/DR",
    "CWC",
    "RAMAT",
    "EFS",
    "ETS",
    "Alrashed Food",
    "Alrashed Tires",
    "Jana Marine / Tanajib",
    "Industrials (Steel, Fast)",
    "Alrashed Wood",
    "Admirals",
    "YAUMI",
    "BMD",
    "Saudi Filter",
    "cement",
    "Insuwrap",
    "EFS/ETS",
    "Ubmksa",
    "Polystyrene",
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
            <BreadcrumbLink href="/dashboard/threat-composition">Threat Composition</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/threat-composition/new" className="font-semibold">
              Add New Threat Composition
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/threat-composition">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Threat Composition</h1>
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
                <CardTitle>Add Threat Composition</CardTitle>
                <CardDescription>
                  Enter the details for a new threat composition entry.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('month', value)}
                      value={formData.month}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('year', value)}
                      value={formData.year}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severityLevel">Severity Level</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('severityLevel', value)}
                      value={formData.severityLevel}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                      <SelectContent>
                        {severityLevelOptions.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threatType">Threat Type</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('threatType', value)}
                      value={formData.threatType}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select threat type" />
                      </SelectTrigger>
                      <SelectContent>
                        {threatTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attackVector">Attack Vector</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('attackVector', value)}
                      value={formData.attackVector}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select attack vector" />
                      </SelectTrigger>
                      <SelectContent>
                        {attackVectorOptions.map((vector) => (
                          <SelectItem key={vector} value={vector}>{vector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incidentCount">Incident Count</Label>
                    <Input
                      id="incidentCount"
                      name="incidentCount"
                      type="number"
                      min="0"
                      value={formData.incidentCount.toString()}
                      onChange={handleInputChange}
                      placeholder="Enter incident count"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bu">Business Unit</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('bu', value)}
                      value={formData.bu}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {buOptions.map((bu) => (
                          <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affectedAsset">Affected Asset</Label>
                    <Input
                      id="affectedAsset"
                      name="affectedAsset"
                      value={formData.affectedAsset}
                      onChange={handleInputChange}
                      placeholder="Enter affected asset"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/threat-composition')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createThreatComposition.isPending}>
                    {createThreatComposition.isPending ? 'Creating...' : 'Create Threat Composition'}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple threat composition entries.
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
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Year
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Severity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Threat Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attack Vector
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Business Unit
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Affected Asset
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Incident Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.month}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.severityLevel}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.threatType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.attackVector}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.bu}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.affectedAsset}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.incidentCount}
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