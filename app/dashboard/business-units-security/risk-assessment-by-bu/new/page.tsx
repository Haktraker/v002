'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';
import { useCreateRiskAssessmentByBu } from '@/lib/api/endpoints/business-units-security/risk-assessment-by-bu';
import { CreateRiskAssessmentByBuDto, SeverityLevelName, RiskAssessmentBu, RiskAssessmentSeverity } from '@/lib/api/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, ArrowLeft, Upload, Home, XCircle, PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { BU_LIST } from '@/lib/constants/bu-list'; // Assuming BU list exists
import { MONTHS } from '@/lib/constants/months-list';

// --- Common Validation & Types ---
const severityLevels: [SeverityLevelName, ...SeverityLevelName[]] = ["Critical", "High", "Low", "Medium"];

// Define ValidationResult type used by useTableData
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const severitySchema = z.object({
  severity: z.enum(severityLevels, { required_error: "Severity level is required" }),
  count: z.coerce.number().int().min(0, 'Count must be non-negative'),
});
const buSchema = z.object({
  name: z.string().min(1, 'BU name is required'),
  severities: z.array(severitySchema).min(1, 'At least one severity entry is required for each BU')
          .refine(severities => {
              // Check for duplicate severity levels within a BU
              const levels = severities.map(s => s.severity);
              return new Set(levels).size === levels.length;
          }, { message: "Each severity level (Critical, High, etc.) can only appear once per Business Unit." }),
});
const singleFormSchema = z.object({
  month: z.string(),
  year: z.string().min(4, 'Year must be 4 digits').regex(/^\d{4}$/, 'Year must be 4 digits'),
  bu: z.array(buSchema).min(1, 'At least one business unit is required'),
});
type SingleFormData = z.infer<typeof singleFormSchema>;

type RiskAssessmentCsvRow = {
  month: string;
  year: string;
  buName: string;
  severity: string; // Read as string initially
  count: string;    // Read as string initially
};

// --- Main Component --- 
export default function NewRiskAssessmentByBuPage() {
  const router = useRouter();
  const createMutation = useCreateRiskAssessmentByBu();
  const { withLoading } = useApiLoading();
  const [validDtoCount, setValidDtoCount] = useState(0);
  const currentYear = new Date().getFullYear();

  // --- Single Form Logic --- 
  const { 
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: isSingleSubmitting },
    reset: resetSingleForm
  } = useForm<SingleFormData>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      month: '', // Default to empty or current month?
      year: currentYear.toString(),
      bu: [{ name: '', severities: [{ severity: 'Medium', count: 0 }] }],
    },
  });

  const { fields: buFields, append: appendBu, remove: removeBu } = useFieldArray({
    control,
    name: 'bu',
  });

  const handleSingleSubmit = async (data: SingleFormData) => {
    try {
      await withLoading(async () => {
          await createMutation.mutateAsync(data as CreateRiskAssessmentByBuDto);
          toast.success('Risk Assessment created successfully!');
          resetSingleForm();
          router.push('/dashboard/business-units-security/risk-assessment-by-bu'); 
      });
    } catch (error) {
      console.error("Single Submission error:", error); // Specific error handling in mutation hook
    }
  };

  // --- Bulk Upload Logic --- 
  const validateBulkRow = (row: RiskAssessmentCsvRow): ValidationResult => {
    const requiredFields: (keyof RiskAssessmentCsvRow)[] = ['month', 'year', 'buName', 'severity', 'count'];
    for (const field of requiredFields) {
      if (!row[field]) return { isValid: false, error: `Missing required field: ${field}` };
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    if (!severityLevels.includes(row.severity as SeverityLevelName)) {
         return { isValid: false, error: `Invalid severity: ${row.severity}` };
    }
    if (isNaN(parseInt(row.count)) || parseInt(row.count) < 0) {
        return { isValid: false, error: `Invalid count (must be non-negative integer): ${row.count}` };
    }
    return { isValid: true };
  };

  const { 
    data: csvData, 
    isProcessing, 
    isSubmitting: isBulkSubmitting, 
    csvFile,
    handleFileChange, 
    handleProcessCSV: originalHandleProcessCSV, 
    resetData: originalResetData,
    setIsSubmitting: setBulkIsSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
  } = useTableData<RiskAssessmentCsvRow>({
    requiredFields: ['month', 'year', 'buName', 'severity', 'count'],
    validateRow: validateBulkRow,
  });

  // Function to group CSV data and count valid DTOs
  const processAndCountCsvData = (processedCsvData: RiskAssessmentCsvRow[] | null) => {
      if (!processedCsvData || processedCsvData.length === 0) {
          setValidDtoCount(0);
          return [];
      }

      // Group by month-year
      const groupedByMonthYear: Record<string, RiskAssessmentCsvRow[]> = {};
      processedCsvData.forEach(row => {
          const key = `${row.month}-${row.year}`;
          if (!groupedByMonthYear[key]) groupedByMonthYear[key] = [];
          groupedByMonthYear[key].push(row);
      });

      const dtosToSubmit: CreateRiskAssessmentByBuDto[] = [];
      let skippedBuCount = 0;

      Object.entries(groupedByMonthYear).forEach(([key, rows]) => {
          const [month, year] = key.split('-');
          
          // Group rows for this month/year by BU
          const groupedByBu: Record<string, RiskAssessmentCsvRow[]> = {};
          rows.forEach(row => {
              if (!groupedByBu[row.buName]) groupedByBu[row.buName] = [];
              groupedByBu[row.buName].push(row);
          });

          const buArray: RiskAssessmentBu[] = [];
          Object.entries(groupedByBu).forEach(([buName, buRows]) => {
              const severitiesMap = new Map<SeverityLevelName, number>();
              let isValidBu = true;
              for (const row of buRows) {
                  const severity = row.severity as SeverityLevelName;
                  const count = parseInt(row.count);
                  if (severitiesMap.has(severity)) {
                      // Duplicate severity for the same BU in the same month/year - skip this BU
                      console.warn(`Skipping BU '${buName}' for ${month}-${year} due to duplicate severity '${severity}'`);
                      isValidBu = false;
                      skippedBuCount++;
                      break;
                  }
                  severitiesMap.set(severity, count);
              }

              if (isValidBu && severitiesMap.size > 0) {
                  const severities: RiskAssessmentSeverity[] = Array.from(severitiesMap.entries())
                      .map(([severity, count]) => ({ severity, count }));
                  buArray.push({ name: buName, severities });
              }
          });

          if (buArray.length > 0) {
              dtosToSubmit.push({ month, year, bu: buArray });
          }
      });

      setValidDtoCount(dtosToSubmit.length);
      if (skippedBuCount > 0) {
          toast.warning(`${skippedBuCount} BU entries were skipped during processing due to duplicate severities within the same month/year.`);
      }
      if (dtosToSubmit.length === 0 && processedCsvData.length > 0) {
          toast.error("No complete records could be formed. Check for duplicates or missing data.");
      }
      return dtosToSubmit; // Return the DTOs for submission
  };

  const handleProcessCSVAndCount = async () => {
      await originalHandleProcessCSV(); 
      // Process immediately after reading to update the count
      // Note: csvData might not be updated yet due to state update timing
      // We might need to pass the processed data from useTableData if available
      // For now, we rely on the state update, which might have a slight delay in UI count update
      setTimeout(() => processAndCountCsvData(csvData), 0); // Use setTimeout to wait for state update
  };

  const resetDataAndCount = () => {
      originalResetData();
      setValidDtoCount(0);
  };

  const handleBulkSubmit = async () => {
      const dtosToSubmit = processAndCountCsvData(csvData); // Recalculate DTOs just before submit
      
      if (!dtosToSubmit || dtosToSubmit.length === 0) { 
          toast.error('No valid records processed from CSV to submit.');
          return;
      }
      
      setBulkIsSubmitting(true);
      let successCount = 0;
      let errorCount = 0;

      try {
          await withLoading(async () => {
              for (const dto of dtosToSubmit) {
                  try {
                      await createMutation.mutateAsync(dto);
                      successCount++;
                  } catch (error: any) {
                      console.error(`Failed to create record for ${dto.month}-${dto.year} (BUs: ${dto.bu.map(b=>b.name).join(',')}):`, error);
                      errorCount++;
                  }
              }

              if (successCount > 0) {
                  toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
                  router.push('/dashboard/business-units-security/risk-assessment-by-bu');
              } else if (errorCount > 0) {
                   toast.error('Failed to create any records from the bulk upload.');
              } else {
                   // Should not happen if dtosToSubmit was not empty
                   toast.info("No records were submitted.");
              }
          });
      } catch (error) {
          console.error('Bulk submission process failed:', error);
          toast.error('Bulk submission process failed');
      } finally {
          setBulkIsSubmitting(false);
      }
  };

  // --- Render Logic --- 
  return (
    <PageContainer>
       <Breadcrumb className="mb-4">
         <BreadcrumbList>
           <BreadcrumbItem>
             <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
               <Home className="h-4 w-4" /> Dashboard
             </BreadcrumbLink>
           </BreadcrumbItem>
           <BreadcrumbSeparator />
            <BreadcrumbItem>
             <BreadcrumbLink href="/dashboard/business-units-security">Business Units Security</BreadcrumbLink>
           </BreadcrumbItem>
           <BreadcrumbSeparator />
           <BreadcrumbItem>
             <BreadcrumbLink href="/dashboard/business-units-security/risk-assessment-by-bu">Risk Assessment by BU</BreadcrumbLink>
           </BreadcrumbItem>
           <BreadcrumbSeparator />
           <BreadcrumbItem>
             <span className="font-semibold text-foreground">Add New Record</span>
           </BreadcrumbItem>
         </BreadcrumbList>
       </Breadcrumb>

       <div className="flex items-center gap-4 mb-6">
         <Link href="/dashboard/business-units-security/risk-assessment-by-bu">
           <Button variant="outline" size="icon" aria-label="Go back">
             <ArrowLeft className="h-4 w-4" />
           </Button>
         </Link>
         <h1 className="text-2xl font-semibold">Add New Risk Assessment Data</h1>
       </div>

        <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="single">Single Record Entry</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
            </TabsList>

            {/* --- Single Entry Tab --- */} 
            <TabsContent value="single">
                <Card>
                   <form onSubmit={handleSubmit(handleSingleSubmit)}>
                    <CardHeader>
                        <CardTitle>Add Single Assessment Record</CardTitle>
                        <CardDescription>
                        Enter risk assessment counts by severity for specific business units, month, and year.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Month and Year - Copied from original form */} 
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Month</Label>
                                <Controller
                                    control={control}
                                    name="month"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}> 
                                            <SelectTrigger id="month" className={errors.month ? 'border-destructive' : ''}>
                                                <SelectValue placeholder="Select Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTHS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Year</Label>
                                <Input id="year" type="number" {...register('year')} className={errors.year ? 'border-destructive' : ''} placeholder={`e.g., ${currentYear}`} />
                                {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
                            </div>
                        </div>

                        {/* Business Units Array - Copied from original form */}
                        <div className="space-y-4">
                            <Label className="text-lg font-medium">Business Units</Label>
                            {buFields.map((buField, buIndex) => (
                                <Card key={buField.id} className="p-4 border relative space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 flex-grow pr-4">
                                            <Label htmlFor={`bu.${buIndex}.name`}>Business Unit Name</Label>
                                             <Controller
                                                control={control}
                                                name={`bu.${buIndex}.name`}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger id={field.name} className={errors.bu?.[buIndex]?.name ? 'border-destructive' : ''}>
                                                            <SelectValue placeholder="Select BU" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {BU_LIST.map(bu => (<SelectItem key={bu} value={bu}>{bu}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.bu?.[buIndex]?.name && <p className="text-xs text-destructive">{errors.bu?.[buIndex]?.name?.message}</p>}
                                        </div>
                                        {buFields.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeBu(buIndex)} className="h-7 w-7 text-destructive hover:bg-destructive/10 mt-6" aria-label={`Remove BU ${buIndex + 1}`}> <Trash2 className="h-4 w-4" /> </Button>
                                        )}
                                    </div>
                                    {/* Nested Severities Array */}
                                    <SeverityFieldArray control={control} buIndex={buIndex} errors={errors} />
                                    {errors.bu?.[buIndex]?.severities?.root && <p className="text-sm text-destructive">{errors.bu?.[buIndex]?.severities?.root?.message}</p>}
                                </Card>
                            ))}
                            {errors.bu?.root && <p className="text-sm text-destructive">{errors.bu.root.message}</p>}
                            {errors.bu?.message && <p className="text-sm text-destructive">{errors.bu.message}</p>}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendBu({ name: '', severities: [{ severity: 'Medium', count: 0 }] })} className="mt-2"> <Plus className="mr-2 h-4 w-4" /> Add Business Unit </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                         <Button type="submit" disabled={isSingleSubmitting || createMutation.isPending}>
                            {isSingleSubmitting || createMutation.isPending ? 'Creating...' : 'Create Assessment'}
                        </Button>
                    </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            {/* --- Bulk Upload Tab --- */} 
            <TabsContent value="bulk">
                 <Card>
                    <CardHeader>
                        <CardTitle>Bulk Upload Risk Assessments</CardTitle>
                        <CardDescription>
                        Upload a CSV file. Required columns: <strong>month, year, buName, severity, count</strong>. Ensure each BU has only one entry per severity level within the same month/year.
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="csvFileBulk">Choose CSV File</Label>
                                    <Input id="csvFileBulk" type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isBulkSubmitting} className="cursor-pointer file:cursor-pointer"/>
                                </div>
                                <Button type="button" onClick={handleProcessCSVAndCount} disabled={!csvFile || isProcessing || isBulkSubmitting} className="w-full sm:w-auto mt-4 sm:mt-0" aria-label="Process CSV file"> <Upload className="mr-2 h-4 w-4" /> {isProcessing ? 'Processing...' : 'Process CSV'} </Button>
                            </div>
                            {csvData && csvData.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Preview Processed Data ({csvData.length} rows)</h3>
                                    <div className="border rounded-lg overflow-auto max-h-[400px]">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50 sticky top-0"><tr>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Year</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">BU Name</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Severity</th>
                                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Count</th>
                                            </tr></thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {currentPageData.map((row, index) => (<tr key={index}>
                                                    <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{row.year}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{row.buName}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{row.severity}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{row.count}</td>
                                                </tr>))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="text-sm text-muted-foreground">Page {pagination.currentPage} of {totalPages}</div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={previousPage} disabled={pagination.currentPage === 1 || isBulkSubmitting}> Previous </Button>
                                            <Button variant="outline" size="sm" onClick={nextPage} disabled={pagination.currentPage === totalPages || isBulkSubmitting}> Next </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={resetDataAndCount} disabled={isBulkSubmitting || !csvData || csvData.length === 0}> Reset / Clear Preview </Button>
                        <Button onClick={handleBulkSubmit} disabled={isBulkSubmitting || !csvData || csvData.length === 0 || isProcessing || validDtoCount === 0}> {isBulkSubmitting ? 'Submitting...' : `Submit ${validDtoCount} Record(s)`} </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    </PageContainer>
  );
}

// Helper component for nested severity array (minor adjustments for RHF integration)
function SeverityFieldArray({ control, buIndex, errors }: { control: any, buIndex: number, errors: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `bu.${buIndex}.severities`
  });

  return (
    <div className="space-y-3 pl-4 border-l">
       <Label className="text-md">Severity Counts</Label>
      {fields.map((severityField, severityIndex) => (
        <div key={severityField.id} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
             <Label htmlFor={`bu.${buIndex}.severities.${severityIndex}.severity`} className="text-xs">Severity</Label>
             <Controller
                control={control}
                name={`bu.${buIndex}.severities.${severityIndex}.severity`}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id={field.name} className={errors.bu?.[buIndex]?.severities?.[severityIndex]?.severity ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select Severity" />
                        </SelectTrigger>
                        <SelectContent>
                            {severityLevels.map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.bu?.[buIndex]?.severities?.[severityIndex]?.severity && <p className="text-xs text-destructive">{errors.bu?.[buIndex]?.severities?.[severityIndex]?.severity?.message}</p>}
          </div>
          <div className="flex-1 space-y-1">
             <Label htmlFor={`bu.${buIndex}.severities.${severityIndex}.count`} className="text-xs">Count</Label>
            <Input 
              id={`bu.${buIndex}.severities.${severityIndex}.count`}
              type="number" 
              {...control.register(`bu.${buIndex}.severities.${severityIndex}.count`)} 
               className={errors.bu?.[buIndex]?.severities?.[severityIndex]?.count ? 'border-destructive' : ''}
            />
             {errors.bu?.[buIndex]?.severities?.[severityIndex]?.count && <p className="text-xs text-destructive">{errors.bu?.[buIndex]?.severities?.[severityIndex]?.count?.message}</p>}
          </div>
           {fields.length > 1 && (
             <Button
               type="button"
               variant="ghost"
               size="icon"
               onClick={() => remove(severityIndex)}
               className="h-8 w-8 text-destructive hover:bg-destructive/10 mb-1"
               aria-label={`Remove Severity ${severityIndex + 1}`}
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           )}
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ severity: 'Medium', count: 0 })} // Append default severity
        className="mt-1"
      >
        <Plus className="mr-1 h-3 w-3" /> Add Severity
      </Button>
    </div>
  );
}
