'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateThirdPartyThreat } from '@/lib/api/endpoints/reports/third-party-threat-intelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateReportThirdPartyThreatIntelligenceDto, SeverityLevel } from '@/lib/api/reports-types/types';
import { ArrowLeft, Upload, Home } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData';
import Link from 'next/link';
import { useApiLoading } from '@/lib/utils/api-utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateThirdPartyThreatIntelligenceDto } from '@/lib/api/executive-dashboard-types/types';

const severityLevels: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

export default function NewThirdPartyThreatPage() {
  const router = useRouter();
  const createRecord = useCreateThirdPartyThreat();
  const { withLoading } = useApiLoading();

  // State for single form
  const [formData, setFormData] = useState<CreateReportThirdPartyThreatIntelligenceDto>({
    thirdParty: '',
    severity: 'medium', // Default value
    month: '',
    year: '',
  });

  // Validation logic for CSV rows
  const validateRow = (row: CreateReportThirdPartyThreatIntelligenceDto): { isValid: boolean, error?: string } => {
    if (!row.thirdParty || !row.severity || !row.month || !row.year) {
      return { isValid: false, error: 'Missing required fields: thirdParty, severity, month, year.' };
    }
    if (!severityLevels.includes(row.severity)) {
        return { isValid: false, error: `Invalid severity: ${row.severity}. Must be one of ${severityLevels.join(", ")}.` };
    }
    // Add month/year format validation if needed
    return { isValid: true };
  };

  // Table data handling
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
  } = useTableData<CreateThirdPartyThreatIntelligenceDto>({
    requiredFields: ['thirdParty', 'severity', 'month', 'year', 'quarter'],
    validateRow,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.severity) {
        toast.error('Severity is required.');
        return;
    }

    try {
      await withLoading(async () => {
        await createRecord.mutateAsync({ ...formData });
        toast.success('Threat record created successfully');
        router.push('/dashboard/reports/third-party-threat-intelligence');
      });
    } catch (error) {
      console.error('Failed to create record:', error);
      // Extract and show specific backend error message if available
      const message = (error as any)?.response?.data?.message || 'Failed to create record';
      toast.error(message);
    }
  };

  const handleBulkSubmit = async () => {
    if (!csvData.length) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0, errorCount = 0;
    let errorMessages: string[] = [];

    try {
      await withLoading(async () => {
        for (const row of csvData) {
          try {
            await createRecord.mutateAsync({ ...row });
            successCount++;
          } catch (err: any) {
            console.error('Failed to create record:', err);
            errorCount++;
            errorMessages.push(err?.response?.data?.message || `Failed to create record for ${row.thirdParty}`);
          }
        }
        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          if (errorCount > 0) {
            toast.error(`Failed records: ${errorMessages.slice(0, 5).join("; ")}${errorMessages.length > 5 ? "..." : ""}`);
          }
          router.push('/dashboard/executive-dashboard/third-party-threat-intelligence');
        } else {
          toast.error(`Failed to create any records. Errors: ${errorMessages.slice(0, 5).join("; ")}${errorMessages.length > 5 ? "..." : ""}`);
        }
      });
    } catch (error) {
      console.error('Bulk submission failed:', error);
      toast.error('Bulk submission process failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2"><Home className="h-4 w-4" /><span>Dashboard</span></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
           <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/reports">Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/reports/third-party-threat-intelligence">Third Party Threats</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbPage>Add New Threat Record</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/reports/third-party-threat-intelligence">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Third Party Threat Record</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList>
          <TabsTrigger value="single">Single Record</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        {/* Single Record Form */}
        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Single Threat Record</CardTitle>
                <CardDescription>Enter the details for the third party threat.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="thirdParty">Third Party</Label>
                  <Input id="thirdParty" value={formData.thirdParty} onChange={(e) => setFormData({ ...formData, thirdParty: e.target.value })} placeholder="e.g., Vendor XYZ" required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value as SeverityLevel })} required>
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map(level => (
                        <SelectItem key={level} value={level} className="capitalize">
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input id="month" type="number" min="1" max="12" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} placeholder="e.g., 7" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="e.g., 2024" required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createRecord.isPending}>
                  {createRecord.isPending ? 'Creating...' : 'Create Record'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Bulk Upload Section */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Threat Records</CardTitle>
              <CardDescription>
                Upload a CSV file. Required columns: thirdParty, severity, month, year, quarter.
                 Severity must be one of: {severityLevels.join(", ")}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isSubmitting} />
                  <Button type="button" onClick={handleProcessCSV} disabled={!csvFile || isProcessing || isSubmitting}>
                    <Upload className="mr-2 h-4 w-4" /> Process CSV
                  </Button>
                </div>

                {/* Data Preview Table */}
                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                             {['thirdParty', 'severity', 'month', 'year', 'quarter'].map(header => (
                               <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                               </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.thirdParty}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">{row.severity}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.month}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.year}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.quarter}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                     {totalPages > 1 && (
                        <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">Page {pagination.currentPage} of {totalPages}</div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={previousPage} disabled={pagination.currentPage === 1}>Previous</Button>
                            <Button variant="outline" onClick={nextPage} disabled={pagination.currentPage === totalPages}>Next</Button>
                        </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetData} disabled={isSubmitting}>Reset</Button>
                      <Button onClick={handleBulkSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : `Submit All (${csvData.length})`}
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
