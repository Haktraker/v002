'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTtdTtrRecord } from '@/lib/api/endpoints/reports/ttd-ttr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateTtdTtrDto, TtdTtrIndicator } from '@/lib/api/reports-types/types';
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
import { MONTHS } from '@/lib/constants/months-list';

const ttdTtrIndicators: TtdTtrIndicator[] = ['TTD', 'TTR'];

// Update form data structure for combined TTD/TTR input
interface CombinedFormData {
    month: string;
    year: string;
    ttdScore?: string; // Optional
    ttrScore?: string; // Optional
}

export default function NewTtdTtrPage() {
  const router = useRouter();
  const createRecord = useCreateTtdTtrRecord();
  const { withLoading } = useApiLoading();

  // State for single form - Updated structure
  const [formData, setFormData] = useState<CombinedFormData>({
    month: '', // Month name string
    year: '',
    ttdScore: '',
    ttrScore: '',
  });

  // Validation logic for CSV rows
  const validateRow = (row: CreateTtdTtrDto): { isValid: boolean, error?: string } => {
    if (!row.indicator || !row.score || !row.month || !row.year) {
      return { isValid: false, error: 'Missing required fields: indicator, score, month, year.' };
    }
    if (!ttdTtrIndicators.includes(row.indicator)) {
        return { isValid: false, error: `Invalid indicator: ${row.indicator}. Must be TTD or TTR.` };
    }
    if (!MONTHS.includes(row.month)) {
      return { isValid: false, error: `Invalid month: ${row.month}. Must be a full month name (e.g., January).` };
    }
    const scoreNum = Number(row.score);
     if (isNaN(scoreNum)) {
        return { isValid: false, error: `Invalid score: ${row.score}. Must be a number (e.g., time in hours).` };
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
  } = useTableData<CreateTtdTtrDto>({
    requiredFields: ['indicator', 'score', 'month', 'year'],
    validateRow,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ttdScoreNum = formData.ttdScore ? Number(formData.ttdScore) : NaN;
    const ttrScoreNum = formData.ttrScore ? Number(formData.ttrScore) : NaN;

    if (!formData.month || !MONTHS.includes(formData.month)) {
        toast.error('Month is required and must be a valid month name.');
        return;
    }

    // Validate scores if entered
    const hasTtdScore = formData.ttdScore !== '' && formData.ttdScore !== undefined;
    const hasTtrScore = formData.ttrScore !== '' && formData.ttrScore !== undefined;

    if (!hasTtdScore && !hasTtrScore) {
        toast.error('Please enter at least one score (TTD or TTR).');
        return;
    }
    if (hasTtdScore && isNaN(ttdScoreNum)) {
        toast.error('Invalid TTD Score. Must be a number (e.g., time in hours).');
        return;
    }
    if (hasTtrScore && isNaN(ttrScoreNum)) {
        toast.error('Invalid TTR Score. Must be a number (e.g., time in hours).');
        return;
    }

    try {
      await withLoading(async () => {
        const createPromises: Promise<any>[] = [];
        const commonData = { // Common fields for both records
            month: formData.month,
            year: formData.year,
        };

        // Prepare TTD create promise if score provided
        if (hasTtdScore) {
            const ttdPayload: CreateTtdTtrDto = {
                ...commonData,
                indicator: 'TTD',
                score: String(ttdScoreNum),
            };
            createPromises.push(createRecord.mutateAsync(ttdPayload));
        }

        // Prepare TTR create promise if score provided
        if (hasTtrScore) {
            const ttrPayload: CreateTtdTtrDto = {
                ...commonData,
                indicator: 'TTR',
                score: String(ttrScoreNum),
            };
            createPromises.push(createRecord.mutateAsync(ttrPayload));
        }

        await Promise.all(createPromises);

        const createdCount = createPromises.length;
        toast.success(`Successfully created ${createdCount} TTD/TTR record(s).`);
        router.push('/dashboard/executive-dashboard/ttd-ttr');
      });
    } catch (error) {
      console.error('Failed to create record(s):', error);
      const message = (error as any)?.response?.data?.message || 'Failed to create record(s)';
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
            // Ensure numeric fields are numbers, score is string
            await createRecord.mutateAsync({ 
                ...row, 
                score: String(row.score) // Ensure score is string
            });
            successCount++;
          } catch (err: any) {
            console.error('Failed to create record:', err);
            errorCount++;
            errorMessages.push(err?.response?.data?.message || `Failed for ${row.indicator} in ${row.month}/${row.year}`);
          }
        }
        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          if (errorCount > 0) {
            toast.error(`Failed records: ${errorMessages.slice(0, 5).join("; ")}${errorMessages.length > 5 ? "..." : ""}`);
          }
          router.push('/dashboard/executive-dashboard/ttd-ttr');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            <BreadcrumbLink href="/dashboard/reports/ttd-ttr">TTD/TTR</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbPage>Add New TTD/TTR Record</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/executive-dashboard/ttd-ttr">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New TTD/TTR Record</h1>
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
                <CardTitle>Add Single TTD/TTR Record</CardTitle>
                <CardDescription>Enter the time-to-detect or time-to-resolve score.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* TTD Score Input */}
                 <div className="space-y-2">
                  <Label htmlFor="ttdScore">TTD Score (hrs)</Label>
                  <Input id="ttdScore" name="ttdScore" type="number" step="any" value={formData.ttdScore || ''} onChange={handleInputChange} placeholder="Enter TTD score (optional)" />
                </div>
                 {/* TTR Score Input */}
                 <div className="space-y-2">
                  <Label htmlFor="ttrScore">TTR Score (hrs)</Label>
                  <Input id="ttrScore" name="ttrScore" type="number" step="any" value={formData.ttrScore || ''} onChange={handleInputChange} placeholder="Enter TTR score (optional)" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })} required>
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(monthName => (
                        <SelectItem key={monthName} value={monthName}>{monthName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <CardTitle>Bulk Upload TTD/TTR Records</CardTitle>
              <CardDescription>
                Upload a CSV file. Required columns: indicator, score, month (full name, e.g., January), year.<br />
                 Indicator must be TTD or TTR.<br />
                 Score must be a number (e.g., time in hours).
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
                             {['indicator', 'score', 'month', 'year'].map(header => (
                               <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header.charAt(0).toUpperCase() + header.slice(1)}
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
