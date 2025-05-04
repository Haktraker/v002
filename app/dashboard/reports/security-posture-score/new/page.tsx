'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateReportsSecurityPostureScore } from '@/lib/api/endpoints/reports/security-posture-score'; // Updated import
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
} from "@/components/ui/select"; // Import Select components
import { toast } from 'sonner';
import { CreateReportsSecurityPostureScoreDto } from '@/lib/api/reports-types/types'; // Updated import
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
import { MONTHS } from '@/lib/constants/months-list'; // Import MONTHS

export default function NewReportsSecurityPostureScorePage() {
  const router = useRouter();
  const createRecord = useCreateReportsSecurityPostureScore(); // Use the new create hook
  const { withLoading } = useApiLoading();

  // State for single form (no quarter)
  const [formData, setFormData] = useState<CreateReportsSecurityPostureScoreDto>({
    percentage: '',
    score: '',
    year: '',
    month: '',
  });

  // Validation logic for CSV rows (no quarter)
  const validateRow = (row: CreateReportsSecurityPostureScoreDto): { isValid: boolean, error?: string } => {
    if (!row.percentage || !row.score || !row.year || !row.month) {
      return { isValid: false, error: 'Missing required fields in a row.' };
    }
    // Ensure month from CSV is valid if needed
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    return { isValid: true };
  };

  // Table data handling with custom hook (updated requiredFields)
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
  } = useTableData<CreateReportsSecurityPostureScoreDto>({
    requiredFields: ['percentage', 'score', 'year', 'month'], // Removed quarter
    validateRow,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation check
    if (!formData.percentage || !formData.score || !formData.year || !formData.month) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      await withLoading(async () => {
        await createRecord.mutateAsync(formData); // Submit formData directly
        toast.success('Reports Security Posture Score record created successfully'); // Updated message
        router.push('/dashboard/reports/security-posture-score'); // Updated redirect path
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
          const validationResult = validateRow(row);
          if (!validationResult.isValid) {
             console.error('Invalid row data:', validationResult.error, row);
             errorCount++;
             continue; // Skip invalid row
          }
          try {
            await createRecord.mutateAsync(row); // Submit row directly
            successCount++;
          } catch (error) {
            console.error('Failed to create record:', error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} report score records${errorCount > 0 ? `, ${errorCount} failed` : ''}`); // Updated message
          router.push('/dashboard/reports/security-posture-score'); // Updated redirect path
        } else {
          toast.error('Failed to create any report score records'); // Updated message
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
      {/* Breadcrumb updated */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/reports">Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/reports/security-posture-score">Security Posture Score</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbPage>Add New Report Score</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/reports/security-posture-score"> {/* Updated link */}
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Report Security Posture Score</h1> {/* Title updated */}
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList>
          <TabsTrigger value="single">Single Record</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        {/* Single Record Form (Month as Select) */} 
        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Single Report Score Record</CardTitle>
                <CardDescription>
                  Enter the details for a single report score record.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentage</Label>
                  <Input id="percentage" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} placeholder="e.g., 85" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Score</Label>
                  <Input id="score" value={formData.score} onChange={(e) => setFormData({ ...formData, score: e.target.value })} placeholder="e.g., B" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="text" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="e.g., 2024" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select
                    value={formData.month}
                    onValueChange={(value) => setFormData({ ...formData, month: value })}
                    required // Add required attribute if needed
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((monthName) => (
                        <SelectItem key={monthName} value={monthName}>
                          {monthName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* You might want to add a FormMessage component here from Shadcn if using react-hook-form integration */} 
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

        {/* Bulk Upload Section (CSV validation updated) */} 
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Report Scores</CardTitle>
              <CardDescription>
                Upload a CSV file. Required columns: percentage, score, year, month. Ensure month names match the standard list (e.g., January, February).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isSubmitting} />
                  <Button type="button" onClick={handleProcessCSV} disabled={!csvFile || isProcessing || isSubmitting}>
                    <Upload className="mr-2 h-4 w-4" />
                    Process CSV
                  </Button>
                </div>

                {/* Data Preview Table (updated columns) */} 
                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {/* Dynamically generate headers based on updated fields */} 
                            {['percentage', 'score', 'year', 'month'].map(header => (
                               <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                               </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.percentage}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.score}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{row.year}</td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${MONTHS.includes(row.month) ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400 font-semibold'}`}>{row.month} {!MONTHS.includes(row.month) && '(Invalid)'}</td>
                              {/* Quarter cell removed */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            Page {pagination.currentPage} of {totalPages}
                        </div>
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
