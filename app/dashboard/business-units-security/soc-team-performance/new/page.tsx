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
import { useCreateSocTeamPerformance } from '@/lib/api/endpoints/business-units-security/soc-team-performance';
import { CreateSocTeamPerformanceDto, SocTeamPerformanceTeam, SocTeamPerformanceBuDetail } from '@/lib/api/types';
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

// --- Common Validation & Types ---

// Assuming a list of known SOC Team Names exists
const SOC_TEAM_NAMES = ["Alpha Team", "Bravo Team", "Charlie Team", "Delta Team"]; // Example list

const buDetailSchema = z.object({
  buName: z.string().min(1, 'BU name is required'),
  resolutionRate: z.coerce.number().min(0, 'Must be >= 0').max(1, 'Must be <= 1 (e.g., 0.85 for 85%)'),
  accuracy: z.coerce.number().min(0, 'Must be >= 0').max(1, 'Must be <= 1 (e.g., 0.92 for 92%)'),
  incidentsHandled: z.coerce.number().int().min(0, 'Must be a non-negative integer'),
});

const teamSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
  bu: z.array(buDetailSchema).min(1, 'At least one BU detail is required per team')
    .refine(bus => {
        const names = bus.map(b => b.buName);
        return new Set(names).size === names.length;
    }, { message: "Each Business Unit can only appear once per SOC Team." }),
});

const singleFormSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  year: z.string().min(4, 'Year must be 4 digits').regex(/^\d{4}$/, 'Year must be 4 digits'),
  socTeam: z.array(teamSchema).min(1, 'At least one SOC team is required')
    .refine(teams => {
        const names = teams.map(t => t.teamName);
        return new Set(names).size === names.length;
    }, { message: "Each SOC Team can only appear once per record." }),
});
type SingleFormData = z.infer<typeof singleFormSchema>;

type SocPerformanceCsvRow = {
  month: string;
  year: string;
  teamName: string;
  buName: string;
  resolutionRate: string;
  accuracy: string;
  incidentsHandled: string;
};

// ValidationResult type
interface ValidationResult { isValid: boolean; error?: string; }

// --- Main Component ---
export default function NewSocTeamPerformancePage() {
  const router = useRouter();
  const createMutation = useCreateSocTeamPerformance();
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
      month: MONTHS[new Date().getMonth()],
      year: currentYear.toString(),
      socTeam: [{ teamName: '', bu: [{ buName: '', resolutionRate: 0, accuracy: 0, incidentsHandled: 0 }] }],
    },
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: 'socTeam',
  });

  const handleSingleSubmit = async (data: SingleFormData) => {
    try {
      await withLoading(async () => {
          await createMutation.mutateAsync(data as CreateSocTeamPerformanceDto);
          toast.success('SOC Team Performance record created successfully!');
          resetSingleForm();
          router.push('/dashboard/business-units-security/soc-team-performance'); 
      });
    } catch (error) {
      console.error("Single Submission error:", error); 
    }
  };

  // --- Bulk Upload Logic ---
  const validateBulkRow = (row: SocPerformanceCsvRow): ValidationResult => {
    const requiredFields: (keyof SocPerformanceCsvRow)[] = ['month', 'year', 'teamName', 'buName', 'resolutionRate', 'accuracy', 'incidentsHandled'];
    for (const field of requiredFields) {
      if (!row[field]) return { isValid: false, error: `Missing required field: ${field}` };
    }
    if (!MONTHS.includes(row.month)) return { isValid: false, error: `Invalid month: ${row.month}` };
    // Optional: Validate teamName/buName against known lists if needed
    const resolutionRate = parseFloat(row.resolutionRate);
    if (isNaN(resolutionRate) || resolutionRate < 0 || resolutionRate > 1) return { isValid: false, error: `Invalid resolutionRate (0-1): ${row.resolutionRate}` };
    const accuracy = parseFloat(row.accuracy);
    if (isNaN(accuracy) || accuracy < 0 || accuracy > 1) return { isValid: false, error: `Invalid accuracy (0-1): ${row.accuracy}` };
    const incidentsHandled = parseInt(row.incidentsHandled);
    if (isNaN(incidentsHandled) || incidentsHandled < 0) return { isValid: false, error: `Invalid incidentsHandled (>=0): ${row.incidentsHandled}` };
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
  } = useTableData<SocPerformanceCsvRow>({
    requiredFields: ['month', 'year', 'teamName', 'buName', 'resolutionRate', 'accuracy', 'incidentsHandled'],
    validateRow: validateBulkRow,
  });

  const processAndCountCsvData = (processedCsvData: SocPerformanceCsvRow[] | null): CreateSocTeamPerformanceDto[] => {
      if (!processedCsvData || processedCsvData.length === 0) {
          setValidDtoCount(0);
          return [];
      }

      // Group by month-year
      const groupedByMonthYear: Record<string, SocPerformanceCsvRow[]> = {};
      processedCsvData.forEach(row => {
          const key = `${row.month}-${row.year}`;
          if (!groupedByMonthYear[key]) groupedByMonthYear[key] = [];
          groupedByMonthYear[key].push(row);
      });

      const dtosToSubmit: CreateSocTeamPerformanceDto[] = [];
      let skippedBuCount = 0;

      Object.entries(groupedByMonthYear).forEach(([key, rows]) => {
          const [month, year] = key.split('-');
          
          // Group rows for this month/year by Team
          const groupedByTeam: Record<string, SocPerformanceCsvRow[]> = {};
          rows.forEach(row => {
              if (!groupedByTeam[row.teamName]) groupedByTeam[row.teamName] = [];
              groupedByTeam[row.teamName].push(row);
          });

          const teamArray: SocTeamPerformanceTeam[] = [];
          Object.entries(groupedByTeam).forEach(([teamName, teamRows]) => {
              const buMap = new Map<string, SocTeamPerformanceBuDetail>();
              let isValidTeam = true;
              for (const row of teamRows) {
                  if (buMap.has(row.buName)) {
                      // Duplicate BU for the same Team in the same month/year - skip this Team entry for this month/year
                      console.warn(`Skipping Team '${teamName}' for ${month}-${year} due to duplicate BU entry '${row.buName}'`);
                      isValidTeam = false;
                      skippedBuCount++; // Count skipped BUs within the potentially skipped team
                      break; 
                  }
                  buMap.set(row.buName, {
                      buName: row.buName,
                      resolutionRate: parseFloat(row.resolutionRate),
                      accuracy: parseFloat(row.accuracy),
                      incidentsHandled: parseInt(row.incidentsHandled)
                  });
              }

              if (isValidTeam && buMap.size > 0) {
                  teamArray.push({ teamName, bu: Array.from(buMap.values()) });
              }
          });

          if (teamArray.length > 0) {
              dtosToSubmit.push({ month, year, socTeam: teamArray });
          }
      });

      setValidDtoCount(dtosToSubmit.length);
      if (skippedBuCount > 0) {
          toast.warning(`${skippedBuCount} BU entries were skipped during processing due to duplicates within the same team/month/year.`);
      }
      if (dtosToSubmit.length === 0 && processedCsvData.length > 0) {
          toast.error("No complete records could be formed. Check for duplicates or missing data.");
      }
      return dtosToSubmit;
  };

  const handleProcessCSVAndCount = async () => {
      await originalHandleProcessCSV(); 
      setTimeout(() => processAndCountCsvData(csvData), 0); // Wait for state update
  };

  const resetDataAndCount = () => {
      originalResetData();
      setValidDtoCount(0);
  };

  const handleBulkSubmit = async () => {
      const dtosToSubmit = processAndCountCsvData(csvData); 
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
                  try { await createMutation.mutateAsync(dto); successCount++; }
                  catch (error: any) { console.error(`Failed record: ${dto.month}-${dto.year}`, error); errorCount++; }
              }
              if (successCount > 0) {
                  toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
                  router.push('/dashboard/business-units-security/soc-team-performance');
              } else if (errorCount > 0) { toast.error('Failed to create any records.'); }
              else { toast.info("No records submitted."); }
          });
      } catch (error) { console.error('Bulk submit failed:', error); toast.error('Bulk submission failed'); }
      finally { setBulkIsSubmitting(false); }
  };

  // --- Render Logic ---
  return (
    <PageContainer>
      {/* Breadcrumbs and Header */}
       <Breadcrumb className="mb-4">
         <BreadcrumbList>
           <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
           <BreadcrumbSeparator />
           <BreadcrumbItem><BreadcrumbLink href="/dashboard/business-units-security">Business Units Security</BreadcrumbLink></BreadcrumbItem>
           <BreadcrumbSeparator />
           <BreadcrumbItem><BreadcrumbLink href="/dashboard/business-units-security/soc-team-performance">SOC Team Performance</BreadcrumbLink></BreadcrumbItem>
           <BreadcrumbSeparator />
           <BreadcrumbItem><span className="font-semibold text-foreground">Add New Record</span></BreadcrumbItem>
         </BreadcrumbList>
       </Breadcrumb>
       <div className="flex items-center gap-4 mb-6">
         <Link href="/dashboard/business-units-security/soc-team-performance"><Button variant="outline" size="icon" aria-label="Go back"><ArrowLeft className="h-4 w-4" /></Button></Link>
         <h1 className="text-2xl font-semibold">Add New SOC Performance Data</h1>
       </div>

      <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="single">Single Record Entry</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
            </TabsList>

            {/* Single Entry Form */}
            <TabsContent value="single">
              <Card>
                <form onSubmit={handleSubmit(handleSingleSubmit)}>
                  <CardHeader>
                    <CardTitle>Add Single Performance Record</CardTitle>
                    <CardDescription>Enter performance metrics for SOC teams and their assigned Business Units.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Month and Year */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="month-single">Month</Label>
                            <Controller control={control} name="month" render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="month-single" className={errors.month ? 'border-destructive' : ''}><SelectValue placeholder="Select Month" /></SelectTrigger><SelectContent>{MONTHS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent></Select> )}/>
                            {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year-single">Year</Label>
                            <Input id="year-single" type="number" {...register('year')} className={errors.year ? 'border-destructive' : ''} placeholder={`e.g., ${currentYear}`} />
                            {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
                        </div>
                    </div>

                    {/* SOC Teams Array */}
                    <div className="space-y-4">
                        <Label className="text-lg font-medium">SOC Teams</Label>
                        {teamFields.map((teamField, teamIndex) => (
                            <Card key={teamField.id} className="p-4 border relative space-y-3">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="space-y-2 flex-grow pr-4">
                                        <Label htmlFor={`socTeam.${teamIndex}.teamName`}>Team Name</Label>
                                        {/* Use Select if team names are predefined, Input otherwise */} 
                                        <Controller control={control} name={`socTeam.${teamIndex}.teamName`} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger id={field.name} className={errors.socTeam?.[teamIndex]?.teamName ? 'border-destructive' : ''}><SelectValue placeholder="Select Team" /></SelectTrigger><SelectContent>{SOC_TEAM_NAMES.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}</SelectContent></Select> )}/>
                                        {/* <Input id={`socTeam.${teamIndex}.teamName`} placeholder="Enter Team Name" {...register(`socTeam.${teamIndex}.teamName`)} className={errors.socTeam?.[teamIndex]?.teamName ? 'border-destructive' : ''}/> */} 
                                        {errors.socTeam?.[teamIndex]?.teamName && <p className="text-xs text-destructive">{errors.socTeam?.[teamIndex]?.teamName?.message}</p>}
                                    </div>
                                    {teamFields.length > 1 && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTeam(teamIndex)} className="h-7 w-7 text-destructive hover:bg-destructive/10 mt-6" aria-label={`Remove Team ${teamIndex + 1}`}><Trash2 className="h-4 w-4" /></Button>
                                    )}
                                </div>
                                {/* Nested BU Details Array */} 
                                <BuDetailsFieldArray control={control} teamIndex={teamIndex} errors={errors} />
                                {errors.socTeam?.[teamIndex]?.bu?.root && <p className="text-sm text-destructive">{errors.socTeam?.[teamIndex]?.bu?.root?.message}</p>}
                            </Card>
                        ))}
                        {errors.socTeam?.root && <p className="text-sm text-destructive">{errors.socTeam.root.message}</p>}
                         {errors.socTeam?.message && <p className="text-sm text-destructive">{errors.socTeam.message}</p>} 
                        <Button type="button" variant="outline" size="sm" onClick={() => appendTeam({ teamName: '', bu: [{ buName: '', resolutionRate: 0, accuracy: 0, incidentsHandled: 0 }] })} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add SOC Team</Button>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSingleSubmitting || createMutation.isPending}>
                      {isSingleSubmitting || createMutation.isPending ? 'Creating...' : 'Create Performance Record'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Bulk Upload Form */}
            <TabsContent value="bulk">
              <Card>
                 <CardHeader>
                     <CardTitle>Bulk Upload SOC Performance</CardTitle>
                     <CardDescription>Upload a CSV file. Required columns: <strong>month, year, teamName, buName, resolutionRate, accuracy, incidentsHandled</strong>. Ensure each BU appears only once per Team within the same month/year.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <div className="space-y-4">
                         <div className="flex flex-col sm:flex-row items-center gap-4">
                             <div className="grid w-full max-w-sm items-center gap-1.5"><Label htmlFor="csvFileBulkSoc">Choose CSV File</Label><Input id="csvFileBulkSoc" type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isBulkSubmitting} className="cursor-pointer file:cursor-pointer"/></div>
                             <Button type="button" onClick={handleProcessCSVAndCount} disabled={!csvFile || isProcessing || isBulkSubmitting} className="w-full sm:w-auto mt-4 sm:mt-0" aria-label="Process CSV file"><Upload className="mr-2 h-4 w-4" />{isProcessing ? 'Processing...' : 'Process CSV'}</Button>
                         </div>
                         {csvData && csvData.length > 0 && (
                             <div className="space-y-4">
                                 <h3 className="text-lg font-medium">Preview Processed Data ({csvData.length} rows)</h3>
                                 <div className="border rounded-lg overflow-auto max-h-[400px]">
                                     <table className="min-w-full divide-y divide-gray-200 text-sm"><thead className="bg-gray-50 sticky top-0"><tr>
                                         <th className="px-3 py-2 text-left font-medium text-muted-foreground">Month</th>
                                         <th className="px-3 py-2 text-left font-medium text-muted-foreground">Year</th>
                                         <th className="px-3 py-2 text-left font-medium text-muted-foreground">Team</th>
                                         <th className="px-3 py-2 text-left font-medium text-muted-foreground">BU</th>
                                         <th className="px-3 py-2 text-left font-medium text-muted-foreground">Res. Rate</th>
                                         <th className="px-3 py-2 text-left font-medium text-muted-foreground">Accuracy</th>
                                         <th className="px-3 py-2 text-left font-medium text-muted-foreground">Inc. Handled</th>
                                     </tr></thead>
                                     <tbody className="bg-white divide-y divide-gray-100">
                                         {currentPageData.map((row, index) => (<tr key={index}>
                                             <td className="px-3 py-2 whitespace-nowrap">{row.month}</td>
                                             <td className="px-3 py-2 whitespace-nowrap">{row.year}</td>
                                             <td className="px-3 py-2 whitespace-nowrap">{row.teamName}</td>
                                             <td className="px-3 py-2 whitespace-nowrap">{row.buName}</td>
                                             <td className="px-3 py-2 whitespace-nowrap">{row.resolutionRate}</td>
                                             <td className="px-3 py-2 whitespace-nowrap">{row.accuracy}</td>
                                             <td className="px-3 py-2 whitespace-nowrap">{row.incidentsHandled}</td>
                                         </tr>))}
                                     </tbody></table>
                                 </div>
                                 <div className="flex justify-between items-center pt-2">
                                     <div className="text-sm text-muted-foreground">Page {pagination.currentPage} of {totalPages}</div>
                                     <div className="flex gap-2">
                                         <Button variant="outline" size="sm" onClick={previousPage} disabled={pagination.currentPage === 1 || isBulkSubmitting}>Previous</Button>
                                         <Button variant="outline" size="sm" onClick={nextPage} disabled={pagination.currentPage === totalPages || isBulkSubmitting}>Next</Button>
                                     </div>
                                 </div>
                             </div>
                         )}
                     </div>
                 </CardContent>
                 <CardFooter className="flex justify-end gap-2 pt-4">
                     <Button variant="outline" onClick={resetDataAndCount} disabled={isBulkSubmitting || !csvData || csvData.length === 0}>Reset / Clear Preview</Button>
                     <Button onClick={handleBulkSubmit} disabled={isBulkSubmitting || !csvData || csvData.length === 0 || isProcessing || validDtoCount === 0}>{isBulkSubmitting ? 'Submitting...' : `Submit ${validDtoCount} Record(s)`}</Button>
                 </CardFooter>
              </Card>
            </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

// Helper component for nested BU details array
function BuDetailsFieldArray({ control, teamIndex, errors }: { control: any, teamIndex: number, errors: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `socTeam.${teamIndex}.bu`
  });

  return (
    <div className="space-y-3 pl-4 border-l ml-1">
       <Label className="text-md font-medium">Business Unit Details</Label>
      {fields.map((buField, buIndex) => (
        <div key={buField.id} className="p-3 border rounded-md relative space-y-2">
           {fields.length > 1 && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(buIndex)}
                    className="h-6 w-6 text-destructive hover:bg-destructive/10 absolute top-1 right-1"
                    aria-label={`Remove BU Detail ${buIndex + 1}`}
                    >
                    <XCircle className="h-4 w-4" />
                </Button>
            )}
            {/* BU Name Select */}
             <div className="space-y-1">
                 <Label htmlFor={`socTeam.${teamIndex}.bu.${buIndex}.buName`} className="text-xs">Business Unit</Label>
                 <Controller control={control} name={`socTeam.${teamIndex}.bu.${buIndex}.buName`} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger id={field.name} className={errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.buName ? 'border-destructive' : ''}><SelectValue placeholder="Select BU" /></SelectTrigger><SelectContent>{BU_LIST.map(bu => (<SelectItem key={bu} value={bu}>{bu}</SelectItem>))}</SelectContent></Select> )}/>
                 {errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.buName && <p className="text-xs text-destructive">{errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.buName?.message}</p>}
            </div>
            {/* Metrics Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <div className="space-y-1">
                     <Label htmlFor={`socTeam.${teamIndex}.bu.${buIndex}.resolutionRate`} className="text-xs">Resolution Rate (0-1)</Label>
                     <Input id={`socTeam.${teamIndex}.bu.${buIndex}.resolutionRate`} type="number" step="0.01" {...control.register(`socTeam.${teamIndex}.bu.${buIndex}.resolutionRate`)} className={errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.resolutionRate ? 'border-destructive' : ''} />
                     {errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.resolutionRate && <p className="text-xs text-destructive">{errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.resolutionRate?.message}</p>}
                 </div>
                 <div className="space-y-1">
                     <Label htmlFor={`socTeam.${teamIndex}.bu.${buIndex}.accuracy`} className="text-xs">Accuracy (0-1)</Label>
                     <Input id={`socTeam.${teamIndex}.bu.${buIndex}.accuracy`} type="number" step="0.01" {...control.register(`socTeam.${teamIndex}.bu.${buIndex}.accuracy`)} className={errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.accuracy ? 'border-destructive' : ''} />
                     {errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.accuracy && <p className="text-xs text-destructive">{errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.accuracy?.message}</p>}
                 </div>
                 <div className="space-y-1">
                     <Label htmlFor={`socTeam.${teamIndex}.bu.${buIndex}.incidentsHandled`} className="text-xs">Incidents Handled</Label>
                     <Input id={`socTeam.${teamIndex}.bu.${buIndex}.incidentsHandled`} type="number" {...control.register(`socTeam.${teamIndex}.bu.${buIndex}.incidentsHandled`)} className={errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.incidentsHandled ? 'border-destructive' : ''} />
                     {errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.incidentsHandled && <p className="text-xs text-destructive">{errors.socTeam?.[teamIndex]?.bu?.[buIndex]?.incidentsHandled?.message}</p>}
                 </div>
            </div>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ buName: '', resolutionRate: 0, accuracy: 0, incidentsHandled: 0 })}
        className="mt-1"
      >
        <PlusCircle className="mr-1 h-4 w-4" /> Add BU Detail
      </Button>
    </div>
  );
}
