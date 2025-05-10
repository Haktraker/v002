'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Home } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useCreateReportsDigitalRiskIntelligence } from '@/lib/api/endpoints/reports/digital-risk-intelligence';
import { CreateReportsDigitalRiskIntelligenceDto, ReportLevel, ReportIndicator } from '@/lib/api/reports-types/types';
import { MONTHS } from '@/lib/constants/months-list'; 
import { useTableData } from '@/hooks/useTableData'; 
import { useApiLoading } from '@/lib/utils/api-utils';

const reportLevelsList: ReportLevel[] = ["no risk", "medium", "high", "critical"];
const reportIndicatorsList: ReportIndicator[] = ["executive protection", "situational awareness", "impersonations", "social media"];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

const formatLabel = (label: string): string => {
    if (!label) return '';
    return label.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const NewDigitalRiskIntelligenceReportPage = () => {
  const router = useRouter();
  const createMutation = useCreateReportsDigitalRiskIntelligence();
  const { withLoading } = useApiLoading();

  const [formData, setFormData] = useState<CreateReportsDigitalRiskIntelligenceDto>({
    level: reportLevelsList[0],
    indicator: reportIndicatorsList[0],
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString(),
  });

  const validateRow = (row: CreateReportsDigitalRiskIntelligenceDto): { isValid: boolean, error?: string } => {
    if (!row.level || !row.indicator || !row.month || !row.year) {
      return { isValid: false, error: 'Missing required fields: level, indicator, month, year.' };
    }
    if (!reportLevelsList.includes(row.level)) {
        return { isValid: false, error: `Invalid risk level: ${row.level}. Must be one of: ${reportLevelsList.join(", ")}.` };
    }
    if (!reportIndicatorsList.includes(row.indicator)) {
        return { isValid: false, error: `Invalid indicator: ${row.indicator}. Must be one of: ${reportIndicatorsList.join(", ")}.` };
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}. Must be a valid full month name (e.g., January).` };
    }
    const yearNum = parseInt(row.year, 10);
    if (isNaN(yearNum) || row.year.length !== 4 || yearNum < 2000 || yearNum > 2100) { // Basic year range validation
        return { isValid: false, error: `Invalid year: ${row.year}. Must be a 4-digit year (e.g., 2024).` };
    }
    return { isValid: true };
  };

  const {
    data: csvData,
    isProcessing: isCsvProcessing,
    isSubmitting: isCsvSubmitting,
    csvFile,
    handleFileChange,
    handleProcessCSV,
    resetData: resetCsvData,
    setIsSubmitting: setIsCsvSubmitting,
    currentPageData: csvCurrentPageData,
    pagination: csvPagination,
    totalPages: csvTotalPages,
    nextPage: csvNextPage,
    previousPage: csvPreviousPage,
  } = useTableData<CreateReportsDigitalRiskIntelligenceDto>({
    requiredFields: ['level', 'indicator', 'month', 'year'],
    validateRow,
  });

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRow(formData);
    if (!validation.isValid) {
        toast.error(validation.error || 'Invalid data in form.');
        return;
    }

    try {
      await withLoading(async () => {
        await createMutation.mutateAsync(formData);
        toast.success('Report created successfully');
        router.push('/dashboard/reports/digital-risk-intelligence');
      });
    } catch (error: any) {
      console.error('Failed to create report:', error);
      const message = error?.response?.data?.message || 'Failed to create report';
      toast.error(message);
    }
  };

  const handleBulkSubmit = async () => {
    if (!csvData.length) {
      toast.error('No CSV data to submit');
      return;
    }
    // Ensure all rows are valid before attempting submission (optional, as validateRow is also in useTableData)
    for (const row of csvData) {
        const validation = validateRow(row);
        if (!validation.isValid) {
            toast.error(`Invalid data in CSV: ${validation.error} (Row example: ${row.indicator}, ${row.level}, ${row.month}, ${row.year})`);
            return;
        }
    }

    setIsCsvSubmitting(true);
    let successCount = 0, errorCount = 0;
    let errorMessages: string[] = [];

    try {
      await withLoading(async () => {
        for (const row of csvData) {
          try {
            await createMutation.mutateAsync(row);
            successCount++;
          } catch (err: any) {
            console.error('Failed to create record from CSV row:', err);
            errorCount++;
            errorMessages.push(err?.response?.data?.message || `Failed for ${row.indicator} (${row.month}/${row.year})`);
          }
        }
        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} report(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          if (errorCount > 0) {
            toast.error(`Failed records examples: ${errorMessages.slice(0, 3).join("; ")}${errorMessages.length > 3 ? "..." : ""}`);
          }
          router.push('/dashboard/reports/digital-risk-intelligence');
        } else {
          toast.error(`Failed to create any reports from CSV. Errors: ${errorMessages.slice(0, 3).join("; ")}${errorMessages.length > 3 ? "..." : ""}`);
        }
      });
    } catch (error) {
      console.error('Bulk report submission failed:', error);
      toast.error('Bulk report submission process failed');
    } finally {
      setIsCsvSubmitting(false);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
       <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2"><Home className="h-4 w-4" /><span>Dashboard</span></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
           <BreadcrumbItem>
            {/* Assuming a general /reports path exists */}
            <BreadcrumbLink href="/dashboard/reports">Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/reports/digital-risk-intelligence">Digital Risk Intelligence</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbPage>New Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Link href="/dashboard/reports/digital-risk-intelligence">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">Create Digital Risk Intelligence Report</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="single">Single Report</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSingleSubmit}>
              <CardHeader>
                <CardTitle>Add Single Report</CardTitle>
                <CardDescription>Enter the details for the new report.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="indicator-single">Indicator</Label>
                  <Select value={formData.indicator} onValueChange={(value) => setFormData({ ...formData, indicator: value as ReportIndicator })} required>
                    <SelectTrigger id="indicator-single">
                      <SelectValue placeholder="Select an indicator" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportIndicatorsList.map(ind => (
                        <SelectItem key={ind} value={ind}>{formatLabel(ind)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="level-single">Risk Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value as ReportLevel })} required>
                    <SelectTrigger id="level-single">
                      <SelectValue placeholder="Select a risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportLevelsList.map(lvl => (
                        <SelectItem key={lvl} value={lvl}>{formatLabel(lvl)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="month-single">Month</Label>
                  <Select value={formData.month} onValueChange={(value) => setFormData({...formData, month: value as string})} required>
                      <SelectTrigger id="month-single"><SelectValue placeholder="Select month" /></SelectTrigger>
                      <SelectContent>
                          {MONTHS.map(month => (<SelectItem key={month} value={month}>{month}</SelectItem>))}
                      </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year-single">Year</Label>
                  <Select value={formData.year} onValueChange={(value) => setFormData({...formData, year: value as string})} required>
                      <SelectTrigger id="year-single"><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>
                          {years.map(year => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                      </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Report'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Reports</CardTitle>
              <CardDescription>
                Upload a CSV file. Required columns: <strong>level, indicator, month, year</strong>.<br />
                 Risk Level must be one of: {reportLevelsList.join(", ")}.<br />
                 Indicator must be one of: {reportIndicatorsList.join(", ")}.<br />
                 Month must be a full month name (e.g., January). Year must be 4 digits (e.g., 2024).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isCsvProcessing || isCsvSubmitting} className="max-w-xs"/>
                <Button type="button" onClick={handleProcessCSV} disabled={!csvFile || isCsvProcessing || isCsvSubmitting}>
                  <Upload className="mr-2 h-4 w-4" /> Process CSV
                </Button>
              </div>

              {csvData.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">Preview Processed Data ({csvData.length} rows)</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {['indicator', 'level', 'month', 'year'].map(header => (
                            <th key={header} className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {formatLabel(header)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {csvCurrentPageData.map((row, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap">{formatLabel(row.indicator)}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{formatLabel(row.level)}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{row.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {csvTotalPages > 1 && (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Page {csvPagination.currentPage} of {csvTotalPages}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={csvPreviousPage} disabled={csvPagination.currentPage === 1 || isCsvSubmitting}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={csvNextPage} disabled={csvPagination.currentPage === csvTotalPages || isCsvSubmitting}>Next</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={resetCsvData} disabled={isCsvSubmitting}>Reset CSV Data</Button>
                    <Button onClick={handleBulkSubmit} disabled={isCsvSubmitting || csvData.length === 0 || isCsvProcessing}>
                      {isCsvSubmitting ? 'Submitting...' : `Submit All (${csvData.length}) Reports`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewDigitalRiskIntelligenceReportPage;
