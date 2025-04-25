'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateComplianceRiskDistribution } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compilance-risk-distribution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreateComplianceRiskDistributionDto, SeverityName, ComplianceRiskDistributionBu } from '@/lib/api/types';
import { ArrowLeft, Upload, Home, PlusCircle, XCircle } from 'lucide-react';
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
import { MONTHS } from '@/lib/constants/months-list';
import { SEVERITY_LEVELS } from '@/lib/constants/severity-list';
import { BU_LIST } from '@/lib/constants/bu-list';

// Define ValidationResult interface locally
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Define the expected structure for a row in the CSV after parsing
interface CsvRowData {
  month: string;
  year: string;
  buName: string;
  severityName: SeverityName;
  score: string; // PapaParse reads numbers as strings initially
}

export default function NewComplianceRiskDistributionPage() {
  const router = useRouter();
  const createMutation = useCreateComplianceRiskDistribution();
  const { withLoading } = useApiLoading();
  const currentYear = new Date().getFullYear();

  // --- State for Single Entry Form ---
  const [formData, setFormData] = useState<CreateComplianceRiskDistributionDto>({
    month: MONTHS[new Date().getMonth()],
    year: currentYear.toString(),
    bu: [{ buName: '', severity: { severityName: 'Low', score: 0 } }],
  });

  const handleFormChange = (field: keyof CreateComplianceRiskDistributionDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBuChange = (index: number, field: keyof ComplianceRiskDistributionBu | 'severityName' | 'score', value: any) => {
    const updatedBu = [...formData.bu];
    const targetBu = updatedBu[index];

    if (field === 'buName') {
      targetBu.buName = value;
    } else if (field === 'severityName') {
      targetBu.severity.severityName = value as SeverityName;
    } else if (field === 'score') {
      targetBu.severity.score = parseInt(value, 10) || 0;
    }

    setFormData(prev => ({ ...prev, bu: updatedBu }));
  };

  const addBuField = () => {
    setFormData(prev => ({
      ...prev,
      bu: [...prev.bu, { buName: '', severity: { severityName: 'Low', score: 0 } }],
    }));
  };

  const removeBuField = (index: number) => {
    if (formData.bu.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      bu: prev.bu.filter((_, i) => i !== index),
    }));
  };

  const validateSingleEntry = (): boolean => {
      if (!formData.month || !formData.year) {
        toast.error("Month and Year are required.");
        return false;
      }
      if (formData.bu.some(b => !b.buName)) {
          toast.error("Business Unit must be selected for all entries.");
          return false;
      }
       if (formData.bu.some(b => b.severity.score === undefined || isNaN(b.severity.score))) {
          toast.error("Score must be a valid number for all entries.");
          return false;
      }
      // Add more specific validation if needed (e.g., year format)
      return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSingleEntry()) return;

    try {
      await withLoading(async () => {
        await createMutation.mutateAsync(formData);
        toast.success('Compliance risk distribution entry created successfully');
        router.push('/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution');
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
      toast.error('Failed to create entry');
    }
  };

  // --- State and Logic for Bulk Upload ---
  const validateCsvRow = (row: CsvRowData): ValidationResult => {
    if (!row.month || !MONTHS.includes(row.month)) {
      return { isValid: false, error: `Invalid or missing month: ${row.month}` };
    }
    if (!row.year || isNaN(parseInt(row.year)) || row.year.length !== 4) {
       return { isValid: false, error: `Invalid or missing year: ${row.year}` };
    }
    if (!row.buName) {
      return { isValid: false, error: `Missing Business Unit Name in one row` };
    }
    if (!row.severityName || !SEVERITY_LEVELS.includes(row.severityName)) {
       return { isValid: false, error: `Invalid or missing severityName: ${row.severityName}. Must be one of ${SEVERITY_LEVELS.join(', ')}` };
    }
    const score = parseInt(row.score, 10);
    if (row.score === undefined || isNaN(score)) {
        return { isValid: false, error: `Invalid or missing score: ${row.score}. Must be a number.` };
    }

    return { isValid: true };
  };

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
  } = useTableData<CsvRowData>({
    requiredFields: ['month', 'year', 'buName', 'severityName', 'score'],
    validateRow: validateCsvRow,
  });

  const handleBulkSubmit = async () => {
    if (!csvData.length) {
      toast.error('No processed data to submit');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    const groupedData = csvData.reduce<Record<string, CreateComplianceRiskDistributionDto>>((acc, row) => {
      const key = `${row.month}-${row.year}`;
      if (!acc[key]) {
        acc[key] = { month: row.month, year: row.year, bu: [] };
      }
      acc[key].bu.push({
        buName: row.buName,
        severity: {
          severityName: row.severityName,
          score: parseInt(row.score, 10),
        },
      });
      return acc;
    }, {});

    const entriesToSubmit = Object.values(groupedData);

    try {
      await withLoading(async () => {
        for (const entry of entriesToSubmit) {
          try {
            await createMutation.mutateAsync(entry);
            successCount++;
          } catch (error) {
            console.error(`Failed to create entry for ${entry.month}/${entry.year}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution');
        } else {
          toast.error('Failed to create any entries');
        }
      });
    } catch (error) {
      console.error('Bulk submission process failed:', error);
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
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
           <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard">Cybersecurity & Compliance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution">Compliance Risk Distribution</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution/new" className="font-semibold">
              Add New Entry
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/cybersecurity-compliance-dashboard/compliance-risk-distribution">
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Compliance Risk Distribution Entry</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        {/* Single Entry Tab */}
        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Single Entry</CardTitle>
                <CardDescription>
                  Enter the risk distribution details for a specific month and year.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="month">Month</Label>
                        <Select
                            value={formData.month}
                            onValueChange={(value) => handleFormChange('month', value)}
                        >
                            <SelectTrigger id="month">
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => handleFormChange('year', e.target.value)}
                        placeholder={`Enter year (e.g., ${currentYear})`}
                        required
                        min={currentYear - 10} // Example range
                        max={currentYear + 1}
                      />
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Business Units Risk</Label>
                    {formData.bu.map((buItem, index) => (
                        <div key={index} className="flex flex-col md:flex-row items-start md:items-end gap-4 border p-4 rounded-md relative">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow w-full">
                                <div className="space-y-2">
                                    <Label htmlFor={`buName-${index}`}>BU Name</Label>
                                    <Select
                                        value={buItem.buName}
                                        onValueChange={(value) => handleBuChange(index, 'buName', value)}
                                    >
                                        <SelectTrigger id={`buName-${index}`}>
                                            <SelectValue placeholder="Select Business Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BU_LIST.map(bu => <SelectItem key={bu} value={bu}>{bu}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`severityName-${index}`}>Severity</Label>
                                    <Select
                                        value={buItem.severity.severityName}
                                        onValueChange={(value) => handleBuChange(index, 'severityName', value)}
                                    >
                                        <SelectTrigger id={`severityName-${index}`}>
                                            <SelectValue placeholder="Select severity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SEVERITY_LEVELS.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`score-${index}`}>Score</Label>
                                    <Input
                                        id={`score-${index}`}
                                        type="number"
                                        value={buItem.severity.score}
                                        onChange={(e) => handleBuChange(index, 'score', e.target.value)}
                                        placeholder="Enter score"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                            {formData.bu.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive md:ml-2 mt-2 md:mt-0"
                                    onClick={() => removeBuField(index)}
                                    aria-label="Remove Business Unit entry"
                                >
                                    <XCircle className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    ))}
                     <Button type="button" variant="outline" size="sm" onClick={addBuField} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Business Unit
                     </Button>
                </div>

              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Entry'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk">
           <Card>
            <CardHeader>
              <CardTitle>Bulk Upload via CSV</CardTitle>
              <CardDescription>
                Upload a CSV file with columns: <code className="font-mono bg-muted px-1 rounded">month</code>, <code className="font-mono bg-muted px-1 rounded">year</code>, <code className="font-mono bg-muted px-1 rounded">buName</code>, <code className="font-mono bg-muted px-1 rounded">severityName</code>, <code className="font-mono bg-muted px-1 rounded">score</code>. Each row represents a business unit's risk for a specific month and year. Ensure `severityName` is one of '{SEVERITY_LEVELS.join(', ')}'.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                     <Label htmlFor="csv-upload">Upload CSV File</Label>
                     <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={isProcessing || isSubmitting}
                        className="cursor-pointer file:cursor-pointer"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleProcessCSV}
                    disabled={!csvFile || isProcessing || isSubmitting}
                    className="w-full sm:w-auto mt-4 sm:mt-0"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Process CSV'}
                  </Button>
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Preview Data (Page {pagination.currentPage} of {totalPages})</h3>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BU Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentPageData.map((row, index) => (
                            <tr key={`${row.month}-${row.year}-${row.buName}-${index}`}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.month}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.year}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.buName}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.severityName}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">{row.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Simple Pagination */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Total Rows: {csvData.length}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={previousPage}
                          disabled={pagination.currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={nextPage}
                          disabled={pagination.currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
             <CardFooter className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={resetData}
                    disabled={isSubmitting || csvData.length === 0}
                >
                    Reset
                </Button>
                <Button
                    onClick={handleBulkSubmit}
                    disabled={isSubmitting || csvData.length === 0 || isProcessing}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit All Entries'}
                </Button>
             </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
