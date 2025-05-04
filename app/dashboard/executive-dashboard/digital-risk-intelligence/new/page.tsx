'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDigitalRisk } from '@/lib/api/endpoints/executive-dashboard/digital-risk-intelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateDigitalRiskIntelligenceDto, RiskLevel, RiskIndicator } from '@/lib/api/executive-dashboard-types/types';
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

const riskLevels: RiskLevel[] = ['no risk', 'medium', 'high', 'critical'];
const riskIndicators: RiskIndicator[] = ["executive protection", "situational awareness", "impersonations", "social media"];

// Helper to format display labels
const formatLabel = (label: string): string => {
    return label.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function NewDigitalRiskPage() {
  const router = useRouter();
  const createRecord = useCreateDigitalRisk();
  const { withLoading } = useApiLoading();

  // State for single form
  const [formData, setFormData] = useState<CreateDigitalRiskIntelligenceDto>({
    level: 'no risk', // Default value
    indicator: 'executive protection', // Default value
    month: '',
    year: '',
    quarter: 0,
  });

  // Validation logic for CSV rows
  const validateRow = (row: CreateDigitalRiskIntelligenceDto): { isValid: boolean, error?: string } => {
    if (!row.level || !row.indicator || !row.month || !row.year || !row.quarter) {
      return { isValid: false, error: 'Missing required fields: level, indicator, month, year, quarter.' };
    }
    if (!riskLevels.includes(row.level)) {
        return { isValid: false, error: `Invalid risk level: ${row.level}. Must be one of: ${riskLevels.join(", ")}.` };
    }
     if (!riskIndicators.includes(row.indicator)) {
        return { isValid: false, error: `Invalid indicator: ${row.indicator}. Must be one of: ${riskIndicators.join(", ")}.` };
    }
    const quarterNum = Number(row.quarter);
    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        return { isValid: false, error: `Invalid quarter: ${row.quarter}. Must be between 1 and 4.` };
    }
    // Add more specific month/year validation if needed
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
  } = useTableData<CreateDigitalRiskIntelligenceDto>({
    requiredFields: ['level', 'indicator', 'month', 'year', 'quarter'],
    validateRow,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quarterNum = Number(formData.quarter);

    if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
        toast.error('Invalid Quarter. Must be a number between 1 and 4.');
        return;
    }
    if (!formData.level) {
        toast.error('Risk Level is required.');
        return;
    }
     if (!formData.indicator) {
        toast.error('Indicator is required.');
        return;
    }

    try {
      await withLoading(async () => {
        await createRecord.mutateAsync({ ...formData, quarter: quarterNum });
        toast.success('Digital Risk record created successfully');
        router.push('/dashboard/executive-dashboard/digital-risk-intelligence');
      });
    } catch (error) {
      console.error('Failed to create record:', error);
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
            // Ensure quarter is treated as a number
            await createRecord.mutateAsync({ ...row, quarter: Number(row.quarter) });
            successCount++;
          } catch (err: any) {
            console.error('Failed to create record:', err);
            errorCount++;
            errorMessages.push(err?.response?.data?.message || `Failed for indicator ${row.indicator} in Q${row.quarter}/${row.year}`);
          }
        }
        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          if (errorCount > 0) {
            toast.error(`Failed records: ${errorMessages.slice(0, 5).join("; ")}${errorMessages.length > 5 ? "..." : ""}`);
          }
          router.push('/dashboard/executive-dashboard/digital-risk-intelligence');
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
            <BreadcrumbLink href="/dashboard/executive-dashboard">Executive Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/executive-dashboard/digital-risk-intelligence">Digital Risk Intelligence</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbPage>Add New Risk Record</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/executive-dashboard/digital-risk-intelligence">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Digital Risk Record</h1>
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
                <CardTitle>Add Single Digital Risk Record</CardTitle>
                <CardDescription>Enter the details for the digital risk.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="indicator">Indicator</Label>
                  <Select value={formData.indicator} onValueChange={(value) => setFormData({ ...formData, indicator: value as RiskIndicator })} required>
                    <SelectTrigger id="indicator">
                      <SelectValue placeholder="Select indicator" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskIndicators.map(ind => (
                        <SelectItem key={ind} value={ind}>
                          {formatLabel(ind)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="level">Risk Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value as RiskLevel })} required>
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      {riskLevels.map(lvl => (
                        <SelectItem key={lvl} value={lvl}>
                          {formatLabel(lvl)}
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
              <CardTitle>Bulk Upload Risk Records</CardTitle>
              <CardDescription>
                Upload a CSV file. Required columns: level, indicator, month, year, quarter.<br />
                 Risk Level must be one of: {riskLevels.join(", ")}.<br />
                 Indicator must be one of: {riskIndicators.join(", ")}.
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
                             {['indicator', 'level', 'month', 'year', 'quarter'].map(header => (
                               <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {formatLabel(header)}
                               </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatLabel(row.indicator)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatLabel(row.level)}</td>
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
