'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateReportsSecurityBreachIndicator,
  CreateReportsSecurityBreachIndicatorsDto,
  SecurityBreachIndicatorItem, // Reusing this from API endpoints
  SECURITY_BREACH_INDICATOR_NAMES,
  SecurityBreachIndicatorName,
} from '@/lib/api/endpoints/reports/security-breach-indicators';
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
import { ArrowLeft, Upload, Home, PlusCircle, XCircle, Loader2 } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData'; // Assuming this can be adapted
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MONTHS } from '@/lib/constants/months-list';

// Default empty indicator for new rows
const defaultIndicator: Omit<SecurityBreachIndicatorItem, '_id'> = {
  indicatorName: SECURITY_BREACH_INDICATOR_NAMES[0],
  score: ''
};

export default function NewReportsSecurityBreachIndicatorsPage() {
  const router = useRouter();
  const createRecordMutation = useCreateReportsSecurityBreachIndicator();

  // State for single form
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [indicators, setIndicators] = useState<Omit<SecurityBreachIndicatorItem, '_id'>[]>([defaultIndicator]);

  const handleIndicatorChange = (
    index: number,
    field: keyof Omit<SecurityBreachIndicatorItem, '_id'>,
    value: string | SecurityBreachIndicatorName
  ) => {
    const newIndicators = [...indicators];
    (newIndicators[index] as any)[field] = value;
    setIndicators(newIndicators);
  };

  const addIndicator = () => {
    setIndicators([...indicators, { ...defaultIndicator }]);
  };

  const removeIndicator = (index: number) => {
    if (indicators.length > 1) { // Prevent removing the last indicator
      setIndicators(indicators.filter((_, i) => i !== index));
    }
  };

  const validateSingleEntry = useCallback((): { isValid: boolean, error?: string, data?: CreateReportsSecurityBreachIndicatorsDto } => {
    if (!month || !year) {
      return { isValid: false, error: 'Month and Year are required.' };
    }
    if (!MONTHS.includes(month)) {
      return { isValid: false, error: `Invalid month: ${month}.` };
    }
    if (!/^[0-9]{4}$/.test(year)) {
      return { isValid: false, error: 'Year must be a 4-digit number.' };
    }
    if (indicators.length === 0) {
      return { isValid: false, error: 'At least one indicator is required.' };
    }
    for (const ind of indicators) {
      if (!ind.indicatorName || !SECURITY_BREACH_INDICATOR_NAMES.includes(ind.indicatorName)) {
        return { isValid: false, error: `Invalid indicator name: ${ind.indicatorName}.` };
      }
      if (ind.score.trim() === '') {
        return { isValid: false, error: `Score is required for indicator: ${ind.indicatorName}.` };
      }
      // Add more specific score validation if needed (e.g. isNaN(Number(ind.score)))
    }
    return { isValid: true, data: { month, year, indicators } };
  }, [month, year, indicators]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSingleEntry();
    if (!validation.isValid || !validation.data) {
      toast.error(validation.error || 'Invalid data');
      return;
    }

    try {
      await createRecordMutation.mutateAsync(validation.data);
      toast.success('Security Breach Indicator record created successfully');
      router.push('/dashboard/reports/security-breach-indicators');
    } catch (error) {
      console.error('Failed to create record:', error);
      // Error toast is handled by the mutation hook
    }
  };

  // Validation logic for CSV rows
  const validateCsvRow = (row: any): { isValid: boolean, error?: string, data?: CreateReportsSecurityBreachIndicatorsDto } => {
    if (!row.month || !row.year) {
        return { isValid: false, error: 'Row missing month or year.' };
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    if (!/^[0-9]{4}$/.test(row.year)) {
        return { isValid: false, error: `Invalid year: ${row.year}` };
    }

    const parsedIndicators: Omit<SecurityBreachIndicatorItem, '_id'>[] = [];
    // Assuming CSV has columns like: CompromisedEmployees_Score, AccountTakeOver_Score etc.
    // Or a more complex structure, for now let's assume simple named columns for scores
    for (const indicatorName of SECURITY_BREACH_INDICATOR_NAMES) {
        const scoreKey = indicatorName.replace(/\s+/g, ''); // e.g. CompromisedEmployees
        if (row[scoreKey] !== undefined && row[scoreKey] !== null && String(row[scoreKey]).trim() !== '') {
            parsedIndicators.push({ indicatorName, score: String(row[scoreKey]) });
        }
    }

    if (parsedIndicators.length === 0) {
        return { isValid: false, error: `No indicators found for ${row.month}/${row.year}. CSV needs columns like '${SECURITY_BREACH_INDICATOR_NAMES[0].replace(/\s+/g,'')}', etc.` };
    }

    return { isValid: true, data: { month: row.month, year: row.year, indicators: parsedIndicators } };
  };


  const { // useTableData for CSV
    data: csvProcessedData,
    isProcessing,
    isSubmitting: isBulkSubmitting,
    csvFile,
    handleFileChange,
    handleProcessCSV,
    resetData,
    setIsSubmitting: setIsBulkSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
    // sortConfig, // Not displaying sortable table for preview here
    // handleSort, 
  } = useTableData<CreateReportsSecurityBreachIndicatorsDto>({
    // Required fields for the hook are at top level of CSV row, not specific DTO fields
    // This might need adjustment in useTableData or here for complex objects
    requiredFields: ['month', 'year', ...SECURITY_BREACH_INDICATOR_NAMES.map(name => name.replace(/\s+/g, ''))],
    validateRow: validateCsvRow, 
  });

  const handleBulkSubmit = async () => {
    if (!csvProcessedData || csvProcessedData.length === 0) {
      toast.error('No valid data processed from CSV to submit');
      return;
    }

    setIsBulkSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const entry of csvProcessedData) {
        // Validate again or trust useTableData's processed output if validateRow returns the DTO
        // Assuming entry is already validated and is of type CreateReportsSecurityBreachIndicatorsDto
        if (entry) { // entry could be null if useTableData filters out invalid rows
            try {
                await createRecordMutation.mutateAsync(entry);
                successCount++;
            } catch (error) {
                console.error('Failed to create record from CSV row:', error, entry);
                errorCount++;
            }
        }
    }

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} records from CSV${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      router.push('/dashboard/reports/security-breach-indicators');
    } else if (errorCount > 0) {
      toast.error('Failed to create any records from CSV.');
    } else {
      toast.info('No records were submitted from CSV.');
    }
    setIsBulkSubmitting(false);
    resetData();
  };

  return (
    <div className="p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard" className="flex items-center gap-2"><Home className="h-4 w-4" />Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/reports">Reports</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/reports/security-breach-indicators">Security Breach Indicators</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Add New Record</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/reports/security-breach-indicators">
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add Security Breach Indicators</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2">
          <TabsTrigger value="single">Single Record</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSingleSubmit}>
              <CardHeader>
                <CardTitle>Add Single Indicator Record</CardTitle>
                <CardDescription>Enter details for a specific month and year.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month-single">Month</Label>
                    <Select value={month} onValueChange={setMonth} required>
                      <SelectTrigger id="month-single"><SelectValue placeholder="Select month" /></SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year-single">Year</Label>
                    <Input id="year-single" type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 2024" required pattern="^[0-9]{4}$" title="Year must be 4 digits" />
                  </div>
                </div>
                
                <div>
                  <Label className="text-base font-medium">Indicators</Label>
                  {indicators.map((indicator, index) => (
                    <div key={index} className="grid grid-cols-12 items-center gap-2 my-2 p-3 border rounded-md">
                      <div className="col-span-12 md:col-span-5 space-y-1">
                         <Label htmlFor={`indicatorName-${index}`} className="text-xs">Indicator Name</Label>
                        <Select
                          value={indicator.indicatorName}
                          onValueChange={(value) => handleIndicatorChange(index, 'indicatorName', value as SecurityBreachIndicatorName)}
                          required
                        >
                          <SelectTrigger id={`indicatorName-${index}`}><SelectValue placeholder="Select Indicator" /></SelectTrigger>
                          <SelectContent>
                            {SECURITY_BREACH_INDICATOR_NAMES.map((name) => (<SelectItem key={name} value={name}>{name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-10 md:col-span-5 space-y-1">
                        <Label htmlFor={`indicatorScore-${index}`} className="text-xs">Score</Label>
                        <Input
                          id={`indicatorScore-${index}`}
                          type="text"
                          placeholder="Score"
                          value={indicator.score}
                          onChange={(e) => handleIndicatorChange(index, 'score', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2 flex items-end justify-end">
                        {indicators.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeIndicator(index)} className="text-destructive hover:text-destructive-hover" aria-label="Remove indicator">
                            <XCircle className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addIndicator} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Indicator
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createRecordMutation.isPending}>
                  {createRecordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Record
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Indicator Records</CardTitle>
              <CardDescription>
                Upload a CSV. Required columns: month, year. Indicator scores should be in columns named after the indicator, e.g., 'CompromisedEmployees', 'AccountTakeOver'.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isBulkSubmitting} className="max-w-xs"/>
                <Button type="button" onClick={handleProcessCSV} disabled={!csvFile || isProcessing || isBulkSubmitting}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Process CSV
                </Button>
              </div>

              {csvProcessedData && csvProcessedData.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Previewing first {currentPageData.length} of {csvProcessedData.length} valid records.</p>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                          {SECURITY_BREACH_INDICATOR_NAMES.map(name => (
                             <th key={name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{name} Score</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentPageData.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{entry?.month}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{entry?.year}</td>
                            {SECURITY_BREACH_INDICATOR_NAMES.map(name => {
                              const indicator = entry?.indicators.find(ind => ind.indicatorName === name);
                              return <td key={name} className="px-4 py-3 whitespace-nowrap text-sm">{indicator ? indicator.score : 'N/A'}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Page {pagination.currentPage} of {totalPages}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={previousPage} disabled={pagination.currentPage === 1}>Previous</Button>
                        <Button variant="outline" onClick={nextPage} disabled={pagination.currentPage === totalPages}>Next</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetData} disabled={isBulkSubmitting}>Reset CSV Data</Button>
                    <Button onClick={handleBulkSubmit} disabled={isBulkSubmitting || !csvProcessedData || csvProcessedData.length === 0}>
                      {isBulkSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit All ({csvProcessedData.length}) Valid Records
                    </Button>
                  </div>
                </div>
              )}
              {isProcessing && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing CSV file...</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
