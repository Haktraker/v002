'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateSecurityBreachIndicator } from '@/lib/api/endpoints/executive-dashboard/security-breach-indicators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { CreateSecurityBreachIndicatorsDto, SecurityBreachIndicatorType } from '@/lib/api/executive-dashboard-types/types';
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

// Define the possible indicator types
const indicatorTypes: SecurityBreachIndicatorType[] = [
  "Compromised Employees",
  "Account Take Over",
  "3rd Party Leaked Credentials",
  "Brand Reputation",
];

export default function NewSecurityBreachIndicatorPage() {
  const router = useRouter();
  const createRecord = useCreateSecurityBreachIndicator();
  const { withLoading } = useApiLoading();

  // State for single form
  const [formData, setFormData] = useState<CreateSecurityBreachIndicatorsDto>({
    month: '',
    year: '',
    quarter: 0,
    score: '',
    indicator: indicatorTypes[0], // Default to the first type
  });

  // Validation logic for CSV rows
  const validateRow = (row: CreateSecurityBreachIndicatorsDto): { isValid: boolean, error?: string } => {
    if (!row.month || !row.year || !row.quarter || !row.score || !row.indicator) {
      return { isValid: false, error: 'Missing required fields in a row.' };
    }
    if (!indicatorTypes.includes(row.indicator)) {
      return { isValid: false, error: `Invalid indicator type: ${row.indicator}` };
    }
    const quarterNum = Number(row.quarter);
    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        return { isValid: false, error: `Invalid quarter: ${row.quarter}. Must be between 1 and 4.` };
    }
    // Add score validation if needed
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
  } = useTableData<CreateSecurityBreachIndicatorsDto>({
    requiredFields: ['month', 'year', 'quarter', 'score', 'indicator'],
    validateRow,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     const quarterNum = Number(formData.quarter);
    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        toast.error('Invalid Quarter. Must be a number between 1 and 4.');
        return;
    }
    // Add score validation if needed

    try {
      await withLoading(async () => {
        await createRecord.mutateAsync({ ...formData, quarter: quarterNum });
        toast.success('Security Breach Indicator record created successfully');
        router.push('/dashboard/executive-dashboard/security-breach-indicators');
      });
    } catch (error) {
      console.error('Failed to create record:', error);
      toast.error('Failed to create record');
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
             await createRecord.mutateAsync({ ...row, quarter: Number(row.quarter) });
            successCount++;
          } catch (error) {
            console.error('Failed to create record:', error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/executive-dashboard/security-breach-indicators');
        } else {
          toast.error('Failed to create any records');
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
            <BreadcrumbLink href="/dashboard/executive-dashboard">Executive Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/executive-dashboard/security-breach-indicators">Security Breach Indicators</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbPage>Add New Indicator</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/executive-dashboard/security-breach-indicators">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Security Breach Indicator</h1>
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
                <CardTitle>Add Single Indicator Record</CardTitle>
                <CardDescription>Enter the details.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="indicator">Indicator Type</Label>
                  <Select
                    value={formData.indicator}
                    onValueChange={(value) => setFormData({ ...formData, indicator: value as SecurityBreachIndicatorType })}
                    required
                  >
                    <SelectTrigger id="indicator">
                      <SelectValue placeholder="Select Indicator Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {indicatorTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Score</Label>
                  <Input id="score" value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} placeholder="e.g., 80" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Input id="month" type="number" min="1" max="12" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} placeholder="e.g., 7" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="e.g., 2024" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <Input id="quarter" type="number" min="1" max="4" value={formData.quarter || ''} onChange={(e) => setFormData({ ...formData, quarter: parseInt(e.target.value, 10) || 0 })} placeholder="e.g., 3" required />
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
              <CardTitle>Bulk Upload Indicators</CardTitle>
              <CardDescription>
                Upload a CSV file. Required columns: month, year, quarter, score, indicator.
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
                             {['indicator', 'score', 'month', 'year', 'quarter'].map(header => (
                               <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                               </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.indicator}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.score}</td>
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
