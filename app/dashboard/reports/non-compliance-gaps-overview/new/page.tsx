'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateReportNonComplianceGapsOverview,
  CreateReportNonComplianceGapsOverviewDto,
  NonComplianceGapDetailItem, // Reusing from API endpoints
  COMPLIANCE_TYPES,
  PRIORITY_LEVELS,
  STATUS_TYPES,
  ComplianceType,
  PriorityLevel,
  StatusType,
} from '@/lib/api/endpoints/reports/non-compliance-gaps-overview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useTableData } from '@/hooks/useTableData';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MONTHS } from '@/lib/constants/months-list';

const defaultSingleDetailItem: Omit<NonComplianceGapDetailItem, '_id'> = {
  quarter: 1,
  issueName: '',
  relatedStandard: '',
  priorityLevel: PRIORITY_LEVELS[0],
  recommendation: '',
  status: STATUS_TYPES[0],
  responsiblePerson: '',
  user: '',
  bu: '',
};

export default function NewReportNonComplianceGapsOverviewPage() {
  const router = useRouter();
  const createRecordMutation = useCreateReportNonComplianceGapsOverview();

  // State for single form
  const [year, setYear] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [compliance, setCompliance] = useState<ComplianceType>(COMPLIANCE_TYPES[0]);
  const [score, setScore] = useState<string>('');
  const [currentDetails, setCurrentDetails] = useState<Omit<NonComplianceGapDetailItem, '_id'>[]>([defaultSingleDetailItem]);

  const handleDetailChange = (
    index: number,
    field: keyof Omit<NonComplianceGapDetailItem, '_id'>,
    value: string | number
  ) => {
    const newDetails = [...currentDetails];
    if (field === 'quarter') {
      (newDetails[index] as any)[field] = value === '' ? undefined : Number(value);
    } else {
      (newDetails[index] as any)[field] = value;
    }
    setCurrentDetails(newDetails);
  };

  const handleDetailSelectChange = (
    index: number,
    field: 'priorityLevel' | 'status',
    value: PriorityLevel | StatusType
  ) => {
    const newDetails = [...currentDetails];
    (newDetails[index] as any)[field] = value;
    setCurrentDetails(newDetails);
  };

  const addDetailItem = () => {
    setCurrentDetails([...currentDetails, { ...defaultSingleDetailItem }]);
  };

  const removeDetailItem = (index: number) => {
    if (currentDetails.length > 1) {
      setCurrentDetails(currentDetails.filter((_, i) => i !== index));
    }
  };

  const validateSingleEntry = useCallback((): { isValid: boolean, error?: string, data?: CreateReportNonComplianceGapsOverviewDto } => {
    if (!year || !month || !compliance || !score) {
      return { isValid: false, error: 'Year, Month, Compliance, and Score are required.' };
    }
    if (!MONTHS.includes(month)) return { isValid: false, error: `Invalid Month: ${month}`};
    if (!/^[0-9]{4}$/.test(year)) return { isValid: false, error: 'Year must be 4 digits.'};
    
    for (const detail of currentDetails) {
      if (!detail.issueName || !detail.priorityLevel || !detail.status) {
        return { isValid: false, error: 'For each detail: Issue Name, Priority, and Status are required.' };
      }
    }
    return { isValid: true, data: { year, month, compliance, score, details: currentDetails } };
  }, [year, month, compliance, score, currentDetails]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSingleEntry();
    if (!validation.isValid || !validation.data) {
      toast.error(validation.error || 'Invalid data');
      return;
    }
    try {
      await createRecordMutation.mutateAsync(validation.data);
      toast.success('Non-Compliance Gap record created successfully');
      router.push('/dashboard/reports/non-compliance-gaps-overview');
    } catch (error) { /* Error toast handled by mutation hook */ }
  };

  const validateCsvRow = (row: any): { isValid: boolean, error?: string, data?: CreateReportNonComplianceGapsOverviewDto } => {
    if (!row.year || !row.month || !row.compliance || !row.score) {
      return { isValid: false, error: 'CSV Row: Missing year, month, compliance, or score.' };
    }
    if (!MONTHS.includes(row.month)) return { isValid: false, error: `CSV Row: Invalid Month ${row.month}`};
    if (!COMPLIANCE_TYPES.includes(row.compliance as ComplianceType)) return { isValid: false, error: `CSV Row: Invalid Compliance ${row.compliance}`};
    
    let parsedDetails: Omit<NonComplianceGapDetailItem, '_id'>[] = [];
    if (row.detailsJson) {
      try {
        parsedDetails = JSON.parse(row.detailsJson);
        if (!Array.isArray(parsedDetails)) throw new Error('detailsJson is not an array');
        for (const detail of parsedDetails) {
          if (!detail.issueName || !detail.priorityLevel || !detail.status) {
            return { isValid: false, error: `CSV Row (detailsJson): Invalid detail item. Issue Name, Priority, and Status are required.` };
          }
          if (detail.priorityLevel && !PRIORITY_LEVELS.includes(detail.priorityLevel)) return { isValid: false, error: `CSV Row (detailsJson): Invalid priority level ${detail.priorityLevel}`};
          if (detail.status && !STATUS_TYPES.includes(detail.status)) return { isValid: false, error: `CSV Row (detailsJson): Invalid status ${detail.status}`};
        }
      } catch (e: any) {
        return { isValid: false, error: `CSV Row: Error parsing detailsJson - ${e.message}` };
      }
    }
    return { isValid: true, data: { year: row.year, month: row.month, compliance: row.compliance as ComplianceType, score: row.score, details: parsedDetails } };
  };

  const { 
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
    previousPage,
    nextPage,
  } = useTableData<CreateReportNonComplianceGapsOverviewDto>({
    requiredFields: ['year', 'month', 'compliance', 'score'], // detailsJson is optional but validated
    validateRow: validateCsvRow,
  });

  const handleBulkSubmit = async () => {
    if (!csvProcessedData || csvProcessedData.length === 0) {
      toast.error('No valid data from CSV to submit.');
      return;
    }
    setIsBulkSubmitting(true);
    let successCount = 0; let errorCount = 0;
    for (const entry of csvProcessedData) {
      if (entry) {
        try {
          await createRecordMutation.mutateAsync(entry);
          successCount++;
        } catch (err) { errorCount++; console.error('CSV Row submission error:', err, entry);}
      }
    }
    if (successCount > 0) toast.success(`Successfully created ${successCount} records from CSV${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
    if (errorCount > 0 && successCount === 0) toast.error('Failed to create any records from CSV.');
    if (successCount === 0 && errorCount === 0) toast.info('No records submitted from CSV.');
    setIsBulkSubmitting(false); resetData();
    if (successCount > 0) router.push('/dashboard/reports/non-compliance-gaps-overview');
  };

  return (
    <div className="p-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard" className="flex items-center gap-2"><Home className="h-4 w-4" />Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/reports">Reports</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/reports/non-compliance-gaps-overview">Non-Compliance Gaps</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Add New Record</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/reports/non-compliance-gaps-overview">
          <Button variant="outline" size="icon" aria-label="Go back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add Non-Compliance Gap Record</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2"><TabsTrigger value="single">Single Record</TabsTrigger><TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger></TabsList>

        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSingleSubmit}>
              <CardHeader><CardTitle>Add Single Gap Record</CardTitle><CardDescription>Enter details for a specific period and compliance standard.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="year-s">Year</Label>
                        <Input id="year-s" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g., 2024" required pattern="^[0-9]{4}$"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="month-s">Month</Label>
                        <Select value={month} onValueChange={(val) => setMonth(val)} required>
                            <SelectTrigger id="month-s"><SelectValue placeholder="Select Month" /></SelectTrigger>
                            <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="compliance-s">Compliance Standard</Label>
                        <Select value={compliance} onValueChange={(val) => setCompliance(val as ComplianceType)} required>
                            <SelectTrigger id="compliance-s"><SelectValue placeholder="Select Standard" /></SelectTrigger>
                            <SelectContent>{COMPLIANCE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="score-s">Overall Score</Label>
                        <Input id="score-s" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g., 75% or Pass/Fail" required />
                    </div>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2"><Label className="text-base font-medium">Gap Details</Label><Button type="button" variant="outline" size="sm" onClick={addDetailItem}><PlusCircle className="mr-2 h-4 w-4" />Add Detail</Button></div>
                  <ScrollArea className="max-h-[400px] pr-3">
                  {currentDetails.map((detail, index) => (
                    <div key={index} className="border p-3 rounded-md mb-3 space-y-2 bg-muted/30">
                        <div className="flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeDetailItem(index)} className="text-destructive hover:text-destructive-hover text-xs" aria-label="Remove Detail"><XCircle className="h-4 w-4" /></Button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-1"><Label htmlFor={`di-issue-${index}`}>Issue Name</Label><Input id={`di-issue-${index}`} value={detail.issueName || ''} onChange={(e) => handleDetailChange(index, 'issueName', e.target.value)} required /></div>
                            <div className="space-y-1"><Label htmlFor={`di-quarter-${index}`}>Quarter</Label><Input id={`di-quarter-${index}`} type="number" value={detail.quarter || ''} onChange={(e) => handleDetailChange(index, 'quarter', e.target.value)} /></div>
                            <div className="space-y-1"><Label htmlFor={`di-priority-${index}`}>Priority</Label><Select value={detail.priorityLevel || ''} onValueChange={(val) => handleDetailSelectChange(index, 'priorityLevel', val as PriorityLevel)} required><SelectTrigger id={`di-priority-${index}`}><SelectValue/></SelectTrigger><SelectContent>{PRIORITY_LEVELS.map(pl=><SelectItem key={pl} value={pl}>{pl}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-1"><Label htmlFor={`di-status-${index}`}>Status</Label><Select value={detail.status || ''} onValueChange={(val) => handleDetailSelectChange(index, 'status', val as StatusType)} required><SelectTrigger id={`di-status-${index}`}><SelectValue/></SelectTrigger><SelectContent>{STATUS_TYPES.map(st=><SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-1"><Label htmlFor={`di-standard-${index}`}>Related Standard</Label><Input id={`di-standard-${index}`} value={detail.relatedStandard || ''} onChange={(e) => handleDetailChange(index, 'relatedStandard', e.target.value)} /></div>
                            <div className="space-y-1"><Label htmlFor={`di-person-${index}`}>Responsible Person</Label><Input id={`di-person-${index}`} value={detail.responsiblePerson || ''} onChange={(e) => handleDetailChange(index, 'responsiblePerson', e.target.value)} /></div>
                            <div className="space-y-1 md:col-span-2 lg:col-span-3"><Label htmlFor={`di-recomm-${index}`}>Recommendation</Label><Textarea id={`di-recomm-${index}`} value={detail.recommendation || ''} onChange={(e) => handleDetailChange(index, 'recommendation', e.target.value)} /></div>
                            <div className="space-y-1"><Label htmlFor={`di-user-${index}`}>User</Label><Input id={`di-user-${index}`} value={detail.user || ''} onChange={(e) => handleDetailChange(index, 'user', e.target.value)} /></div>
                            <div className="space-y-1"><Label htmlFor={`di-bu-${index}`}>Business Unit</Label><Input id={`di-bu-${index}`} value={detail.bu || ''} onChange={(e) => handleDetailChange(index, 'bu', e.target.value)} /></div>
                        </div>
                    </div>
                  ))}
                  </ScrollArea>
                  {currentDetails.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No details added. At least one detail is recommended.</p>}
                </div>
              </CardContent>
              <CardFooter><Button type="submit" disabled={createRecordMutation.isPending}>{createRecordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Record</Button></CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader><CardTitle>Bulk Upload Gap Records</CardTitle><CardDescription>CSV Columns: year, month, compliance, score, detailsJson (optional JSON string of details array).</CardDescription></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4"><Input type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isBulkSubmitting} className="max-w-xs"/><Button type="button" onClick={handleProcessCSV} disabled={!csvFile || isProcessing || isBulkSubmitting}>{isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Process CSV</Button></div>
                {csvProcessedData && csvProcessedData.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Previewing {currentPageData.length} of {csvProcessedData.length} valid records.</p>
                        <div className="border rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>{['Year', 'Month', 'Compliance', 'Score', 'Details Count'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {currentPageData.map((entry, idx) => (<tr key={idx}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{entry?.year}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{entry?.month}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{entry?.compliance}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{entry?.score}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">{entry?.details?.length || 0}</td>
                                    </tr>))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (<div className="flex justify-between items-center"><div className="text-sm text-muted-foreground">Page {pagination.currentPage} of {totalPages}</div><div className="flex gap-2"><Button variant="outline" onClick={previousPage} disabled={pagination.currentPage === 1}>Prev</Button><Button variant="outline" onClick={nextPage} disabled={pagination.currentPage === totalPages}>Next</Button></div></div>)}
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={resetData} disabled={isBulkSubmitting}>Reset</Button><Button onClick={handleBulkSubmit} disabled={isBulkSubmitting || !csvProcessedData || csvProcessedData.length === 0}>{isBulkSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit ({csvProcessedData.length}) Valid Records</Button></div>
                    </div>
                )}
                {isProcessing && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing CSV...</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
