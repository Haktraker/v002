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
import { useCreateAlertTypeDistribution } from '@/lib/api/endpoints/business-units-security/alert-type-distribution';
import { CreateAlertTypeDistributionDto, AlertTypeName, AlertTypeDistributionBu, AlertTypeDistributionAlert } from '@/lib/api/types';
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
import { BU_LIST } from '@/lib/constants/bu-list';
import { MONTHS } from '@/lib/constants/months-list';
import { ALERT_TYPES_LIST } from '@/lib/constants/alert-types-list'; // Use the specific list

// --- Common Validation & Types ---
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Zod schema for individual alert entry
const alertSchema = z.object({
  name: z.enum(ALERT_TYPES_LIST as [AlertTypeName, ...AlertTypeName[]], { required_error: "Alert type is required" }),
  count: z.coerce.number().int().min(0, 'Count must be non-negative'),
});

// Zod schema for BU entry
const buSchema = z.object({
  buName: z.string().min(1, 'BU name is required'),
  alert: z.array(alertSchema).min(1, 'At least one alert entry is required for each BU')
          .refine(alerts => {
              // Check for duplicate alert types within a BU
              const names = alerts.map(a => a.name);
              return new Set(names).size === names.length;
          }, { message: "Each alert type (Malware, Phishing, etc.) can only appear once per Business Unit." }),
});

// Zod schema for the single form
const singleFormSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  year: z.string().min(4, 'Year must be 4 digits').regex(/^\d{4}$/, 'Year must be 4 digits'),
  bu: z.array(buSchema).min(1, 'At least one business unit is required')
        .refine(bus => {
           // Check for duplicate BU names within a record
           const names = bus.map(b => b.buName);
           return new Set(names).size === names.length;
        }, { message: "Each Business Unit can only appear once per record." }),
});

type SingleFormData = z.infer<typeof singleFormSchema>;

// CSV Row Type
type AlertTypeDistributionCsvRow = {
  month: string;
  year: string;
  buName: string;
  alertName: string; // Read alert type name as string
  count: string;    // Read count as string
};

// --- Main Component ---
export default function NewAlertTypeDistributionPage() {
  const router = useRouter();
  const createMutation = useCreateAlertTypeDistribution();
  const { withLoading } = useApiLoading();
  const [validDtoCount, setValidDtoCount] = useState(0);
  const currentYear = new Date().getFullYear();

  // --- Single Form Logic ---
  const {
    register: registerSingle,
    handleSubmit: handleSingleSubmitHook,
    control: controlSingle,
    formState: { errors: errorsSingle, isSubmitting: isSingleSubmitting },
    reset: resetSingleForm
  } = useForm<SingleFormData>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      month: '',
      year: currentYear.toString(),
      bu: [{ buName: '', alert: [{ name: 'Malware', count: 0 }] }], // Default first BU with one alert
    },
  });

  const { fields: buFields, append: appendBu, remove: removeBu } = useFieldArray({
    control: controlSingle,
    name: 'bu',
  });

  const handleSingleSubmit = async (data: SingleFormData) => {
    try {
      await withLoading(async () => {
          await createMutation.mutateAsync(data as CreateAlertTypeDistributionDto);
          toast.success('Alert Type Distribution created successfully!');
          resetSingleForm();
          router.push('/dashboard/business-units-security/alert-type-distribution');
      });
    } catch (error) {
      console.error("Single Submission error:", error);
      // Error toast is handled by the mutation hook
    }
  };

  // --- Bulk Upload Logic ---
  const validateBulkRow = (row: AlertTypeDistributionCsvRow): ValidationResult => {
    const requiredFields: (keyof AlertTypeDistributionCsvRow)[] = ['month', 'year', 'buName', 'alertName', 'count'];
    for (const field of requiredFields) {
      if (!row[field]) return { isValid: false, error: `Missing required field: ${field}` };
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    if (!ALERT_TYPES_LIST.includes(row.alertName as AlertTypeName)) {
         return { isValid: false, error: `Invalid alert type: ${row.alertName}` };
    }
    if (isNaN(parseInt(row.count)) || parseInt(row.count) < 0) {
        return { isValid: false, error: `Invalid count (must be non-negative integer): ${row.count}` };
    }
     if (!BU_LIST.includes(row.buName)) {
        return { isValid: false, error: `Invalid BU name: ${row.buName}` };
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
  } = useTableData<AlertTypeDistributionCsvRow>({
    requiredFields: ['month', 'year', 'buName', 'alertName', 'count'],
    validateRow: validateBulkRow,
  });

  // Function to group CSV data into DTOs and count valid ones
  const processAndCountCsvData = (processedCsvData: AlertTypeDistributionCsvRow[] | null) => {
      if (!processedCsvData || processedCsvData.length === 0) {
          setValidDtoCount(0);
          return [];
      }

      // Group by month-year
      const groupedByMonthYear: Record<string, AlertTypeDistributionCsvRow[]> = {};
      processedCsvData.forEach(row => {
          const key = `${row.month}-${row.year}`;
          if (!groupedByMonthYear[key]) groupedByMonthYear[key] = [];
          groupedByMonthYear[key].push(row);
      });

      const dtosToSubmit: CreateAlertTypeDistributionDto[] = [];
      let skippedDuplicateAlertCount = 0;

      Object.entries(groupedByMonthYear).forEach(([key, rows]) => {
          const [month, year] = key.split('-');

          // Group rows for this month/year by BU
          const groupedByBu: Record<string, AlertTypeDistributionCsvRow[]> = {};
          rows.forEach(row => {
              if (!groupedByBu[row.buName]) groupedByBu[row.buName] = [];
              groupedByBu[row.buName].push(row);
          });

          const buArray: AlertTypeDistributionBu[] = [];
          Object.entries(groupedByBu).forEach(([buName, buRows]) => {
              const alertsMap = new Map<AlertTypeName, number>();
              let isValidBu = true;
              for (const row of buRows) {
                  const alertName = row.alertName as AlertTypeName;
                  const count = parseInt(row.count);
                  if (alertsMap.has(alertName)) {
                      // Duplicate alert type for the same BU in the same month/year - skip this BU
                      console.warn(`Skipping BU '${buName}' for ${month}-${year} due to duplicate alert type '${alertName}'`);
                      isValidBu = false;
                      skippedDuplicateAlertCount += buRows.length; // Count all rows for this skipped BU
                      break; // Stop processing alerts for this BU
                  }
                  alertsMap.set(alertName, count);
              }

              if (isValidBu && alertsMap.size > 0) {
                  const alerts: AlertTypeDistributionAlert[] = Array.from(alertsMap.entries())
                      .map(([name, count]) => ({ name, count }));
                  // Create BU object without _id for the DTO
                  buArray.push({ buName: buName, alert: alerts });
              }
          });

          if (buArray.length > 0) {
              dtosToSubmit.push({ month, year, bu: buArray });
          }
      });

      setValidDtoCount(dtosToSubmit.length);
      if (skippedDuplicateAlertCount > 0) {
          toast.warning(`${skippedDuplicateAlertCount} CSV rows were skipped during processing due to duplicate alert types within the same BU/Month/Year.`);
      }
      if (dtosToSubmit.length === 0 && processedCsvData.length > 0) {
          toast.error("No complete records could be formed. Check for duplicates or missing data.");
      }
      return dtosToSubmit; // Return the DTOs for submission
  };

  const handleProcessCSVAndCount = async () => {
      await originalHandleProcessCSV();
      // Use setTimeout to allow state updates before processing
      setTimeout(() => processAndCountCsvData(csvData), 0);
  };

  const resetDataAndCount = () => {
      originalResetData();
      setValidDtoCount(0);
  };

  const handleBulkSubmit = async () => {
      const dtosToSubmit = processAndCountCsvData(csvData); // Recalculate DTOs

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
                      console.error(`Failed to create record for ${dto.month}-${dto.year} (BUs: ${dto.bu.map(b=>b.buName).join(',')})`, error);
                      errorCount++;
                  }
              }

              if (successCount > 0) {
                  toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
                  router.push('/dashboard/business-units-security/alert-type-distribution');
              } else if (errorCount > 0) {
                   toast.error('Failed to create any records from the bulk upload.');
              } else {
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
            <BreadcrumbLink href="/dashboard/business-units-security/alert-type-distribution">Alert Type Distribution</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="font-semibold text-foreground">Add New Record</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/business-units-security/alert-type-distribution">
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Alert Type Distribution Data</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="single">Single Record Entry</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
          </TabsList>

          {/* --- Single Entry Tab --- */} 
          <TabsContent value="single">
              <Card>
                 <form onSubmit={handleSingleSubmitHook(handleSingleSubmit)}>
                  <CardHeader>
                      <CardTitle>Add Single Distribution Record</CardTitle>
                      <CardDescription>
                          Enter monthly alert counts by type for specific business units.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {/* Month and Year */} 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="month">Month</Label>
                              <Controller
                                  control={controlSingle}
                                  name="month"
                                  render={({ field }) => (
                                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                          <SelectTrigger id="month" className={errorsSingle.month ? 'border-destructive' : ''}>
                                              <SelectValue placeholder="Select Month" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {MONTHS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))} 
                                          </SelectContent>
                                      </Select>
                                  )}
                              />
                              {errorsSingle.month && <p className="text-sm text-destructive">{errorsSingle.month.message}</p>}
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="year">Year</Label>
                              <Input id="year" type="number" {...registerSingle('year')} className={errorsSingle.year ? 'border-destructive' : ''} placeholder={`e.g., ${currentYear}`} />
                              {errorsSingle.year && <p className="text-sm text-destructive">{errorsSingle.year.message}</p>}
                          </div>
                      </div>

                      {/* Business Units Array */} 
                      <div className="space-y-4">
                          <Label className="text-lg font-medium">Business Units</Label>
                          {buFields.map((buField, buIndex) => (
                              <Card key={buField.id} className="p-4 border relative space-y-3">
                                  <div className="flex justify-between items-start mb-3">
                                      <div className="space-y-2 flex-grow pr-4">
                                          <Label htmlFor={`bu.${buIndex}.buName`}>Business Unit Name</Label>
                                          <Controller
                                              control={controlSingle}
                                              name={`bu.${buIndex}.buName`}
                                              render={({ field }) => (
                                                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                      <SelectTrigger id={field.name} className={errorsSingle.bu?.[buIndex]?.buName ? 'border-destructive' : ''}>
                                                          <SelectValue placeholder="Select BU" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                          {BU_LIST.map(bu => (<SelectItem key={bu} value={bu}>{bu}</SelectItem>))} 
                                                      </SelectContent>
                                                  </Select>
                                              )}
                                          />
                                          {errorsSingle.bu?.[buIndex]?.buName && <p className="text-xs text-destructive">{errorsSingle.bu?.[buIndex]?.buName?.message}</p>}
                                      </div>
                                      {buFields.length > 1 && (
                                          <Button type="button" variant="ghost" size="icon" onClick={() => removeBu(buIndex)} className="h-7 w-7 text-destructive hover:bg-destructive/10 mt-6" aria-label={`Remove BU ${buIndex + 1}`}> <Trash2 className="h-4 w-4" /> </Button>
                                      )}
                                  </div>
                                  {/* Nested Alerts Array */} 
                                  <AlertFieldArray control={controlSingle} buIndex={buIndex} errors={errorsSingle} />
                                  {errorsSingle.bu?.[buIndex]?.alert?.root && <p className="text-sm text-destructive">{errorsSingle.bu?.[buIndex]?.alert?.root?.message}</p>}
                                  {errorsSingle.bu?.[buIndex]?.alert?.message && <p className="text-sm text-destructive">{errorsSingle.bu?.[buIndex]?.alert?.message}</p>}
                              </Card>
                          ))}
                          {errorsSingle.bu?.root && <p className="text-sm text-destructive">{errorsSingle.bu.root.message}</p>}
                          {errorsSingle.bu?.message && <p className="text-sm text-destructive">{errorsSingle.bu.message}</p>}
                          <Button type="button" variant="outline" size="sm" onClick={() => appendBu({ buName: '', alert: [{ name: 'Malware', count: 0 }] })} className="mt-2"> <Plus className="mr-2 h-4 w-4" /> Add Business Unit </Button>
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                       <Button type="submit" disabled={isSingleSubmitting || createMutation.isPending}>
                          {isSingleSubmitting || createMutation.isPending ? 'Creating...' : 'Create Distribution Record'}
                      </Button>
                  </CardFooter>
                  </form>
              </Card>
          </TabsContent>

          {/* --- Bulk Upload Tab --- */} 
          <TabsContent value="bulk">
               <Card>
                  <CardHeader>
                      <CardTitle>Bulk Upload Alert Type Distribution</CardTitle>
                      <CardDescription>
                          Upload a CSV file. Required columns: <strong>month, year, buName, alertName, count</strong>. Ensure each alert type appears only once per BU within the same month/year.
                      </CardDescription>
                  </CardHeader>
                   <CardContent>
                      <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row items-center gap-4">\n                              <div className="grid w-full max-w-sm items-center gap-1.5">\n                                  <Label htmlFor="csvFileBulkAlerts">Choose CSV File</Label>\n                                  <Input id="csvFileBulkAlerts" type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isBulkSubmitting} className="cursor-pointer file:cursor-pointer"/>\n                              </div>\n                              <Button type="button" onClick={handleProcessCSVAndCount} disabled={!csvFile || isProcessing || isBulkSubmitting} className="w-full sm:w-auto mt-4 sm:mt-0" aria-label="Process CSV file"> <Upload className="mr-2 h-4 w-4" /> {isProcessing ? 'Processing...' : 'Process CSV'} </Button>\n                          </div>
                          {csvData && csvData.length > 0 && (
                              <div className="space-y-4">
                                  <h3 className="text-lg font-medium">Preview Processed Data ({csvData.length} rows)</h3>
                                  <div className="border rounded-lg overflow-auto max-h-[400px]">
                                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                                          <thead className="bg-gray-50 sticky top-0"><tr>
                                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Year</th>
                                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">BU Name</th>
                                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Alert Type</th>
                                              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Count</th>
                                          </tr></thead>
                                          <tbody className="bg-white divide-y divide-gray-100">
                                              {currentPageData.map((row, index) => (<tr key={index}>
                                                  <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                                                  <td className="px-4 py-2 whitespace-nowrap">{row.year}</td>
                                                  <td className="px-4 py-2 whitespace-nowrap">{row.buName}</td>
                                                  <td className="px-4 py-2 whitespace-nowrap">{row.alertName}</td>
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

// --- Helper Component for Nested Alert Array --- 
function AlertFieldArray({ control, buIndex, errors }: { control: any, buIndex: number, errors: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `bu.${buIndex}.alert`
  });

  return (
    <div className="space-y-3 pl-4 border-l">
      <Label className="text-md">Alert Counts</Label>
      {fields.map((alertField, alertIndex) => (
        <div key={alertField.id} className="flex items-end gap-2">
          {/* Alert Type Name */}
          <div className="flex-1 space-y-1">
             <Label htmlFor={`bu.${buIndex}.alert.${alertIndex}.name`} className="text-xs">Alert Type</Label>
             <Controller
                control={control}
                name={`bu.${buIndex}.alert.${alertIndex}.name`}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <SelectTrigger id={field.name} className={errors.bu?.[buIndex]?.alert?.[alertIndex]?.name ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select Alert Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {ALERT_TYPES_LIST.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.bu?.[buIndex]?.alert?.[alertIndex]?.name && <p className="text-xs text-destructive">{errors.bu?.[buIndex]?.alert?.[alertIndex]?.name?.message}</p>}
          </div>
          {/* Alert Count */}
          <div className="flex-1 space-y-1 max-w-[120px]">
             <Label htmlFor={`bu.${buIndex}.alert.${alertIndex}.count`} className="text-xs">Count</Label>
            <Input 
              id={`bu.${buIndex}.alert.${alertIndex}.count`}
              type="number" 
              {...control.register(`bu.${buIndex}.alert.${alertIndex}.count`)} 
               className={errors.bu?.[buIndex]?.alert?.[alertIndex]?.count ? 'border-destructive' : ''}
            />
             {errors.bu?.[buIndex]?.alert?.[alertIndex]?.count && <p className="text-xs text-destructive">{errors.bu?.[buIndex]?.alert?.[alertIndex]?.count?.message}</p>}
          </div>
          {/* Remove Alert Button */}
           {fields.length > 1 && (
             <Button
               type="button"
               variant="ghost"
               size="icon"
               onClick={() => remove(alertIndex)}
               className="h-8 w-8 text-destructive hover:bg-destructive/10 mb-1"
               aria-label={`Remove Alert ${alertIndex + 1}`}
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
        onClick={() => append({ name: 'Malware', count: 0 })} // Append default alert type
        className="mt-1"
      >
        <Plus className="mr-1 h-3 w-3" /> Add Alert Type
      </Button>
    </div>
  );
}
