'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateThreatCompositionOverview,
  useBulkCreateThreatCompositionOverview, // Assuming this hook will be created or is available
  THREAT_SEVERITY_LEVELS,
  THREAT_TYPES,
  ATTACK_VECTORS,
  BUSINESS_UNITS_TC,
} from '@/lib/api/endpoints/reports/threat-composition-overview';
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
import { useToast } from '@/components/ui/use-toast'; // Using app's toast
import { CreateReportsThreatCompositionOverviewDto, ReportsSeverityLevel, ReportsThreatType, ReportsAttackVector, ReportsBusinessUnit } from '@/lib/api/reports-types/types';
import { ArrowLeft, Upload, Home, PlusCircle, Trash2 } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData'; // Assuming this hook is generic enough
import Link from 'next/link';
import { useApiLoading } from '@/lib/utils/api-utils'; // Assuming this utility
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MONTHS } from '@/lib/constants/months-list';

const requiredCsvHeaders = [
  'month',
  'year',
  'severityLevel',
  'threatType',
  'attackVector',
  'bu',
  'affectedAsset',
  'incidentCount'
];

// For the multi-entry form
const initialEntryFormData: Omit<CreateReportsThreatCompositionOverviewDto, 'month' | 'year'> = {
  severityLevel: ReportsSeverityLevel.LOW,
  threatType: ReportsThreatType.PHISHING_ATTEMPTS,
  attackVector: ReportsAttackVector.EMAIL,
  bu: ReportsBusinessUnit.HO_DR, 
  affectedAsset: '',
  incidentCount: 0,
};

export default function NewThreatCompositionOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createRecordMutation = useCreateThreatCompositionOverview();
  const bulkCreateMutation = useBulkCreateThreatCompositionOverview(); // Ensure this hook exists and handles an array of DTOs
  const { withLoading, isLoading: isApiLoading } = useApiLoading();

  // State for common month/year selection
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isPeriodLocked, setIsPeriodLocked] = useState(false);

  // State for the current entry being added
  const [currentEntry, setCurrentEntry] = useState<Omit<CreateReportsThreatCompositionOverviewDto, 'month' | 'year'>>(initialEntryFormData);
  // State for entries staged for submission for the selected month/year
  const [stagedEntries, setStagedEntries] = useState<CreateReportsThreatCompositionOverviewDto[]>([]);

  const validateRow = (row: CreateReportsThreatCompositionOverviewDto, index?: number): { isValid: boolean, error?: string } => {
    const errorPrefix = index !== undefined ? `Entry ${index + 1}: ` : '';
    if (!row.month || !MONTHS.includes(row.month)) return { isValid: false, error: `${errorPrefix}Invalid or missing month: ${row.month}` };
    if (!row.year || isNaN(parseInt(row.year))) return { isValid: false, error: `${errorPrefix}Invalid or missing year: ${row.year}` };
    if (!row.severityLevel || !THREAT_SEVERITY_LEVELS.includes(row.severityLevel as ReportsSeverityLevel)) return { isValid: false, error: `${errorPrefix}Invalid or missing severity level: ${row.severityLevel}` };
    if (!row.threatType || !THREAT_TYPES.includes(row.threatType as ReportsThreatType)) return { isValid: false, error: `${errorPrefix}Invalid or missing threat type: ${row.threatType}` };
    if (!row.attackVector || !ATTACK_VECTORS.includes(row.attackVector as ReportsAttackVector)) return { isValid: false, error: `${errorPrefix}Invalid or missing attack vector: ${row.attackVector}` };
    if (!row.bu || !BUSINESS_UNITS_TC.includes(row.bu as ReportsBusinessUnit)) return { isValid: false, error: `${errorPrefix}Invalid or missing business unit: ${row.bu}` };
    if (typeof row.affectedAsset !== 'string') return { isValid: false, error: `${errorPrefix}Affected asset must be a string.`}
    if (row.incidentCount === undefined || row.incidentCount === null || typeof row.incidentCount !== 'number' || row.incidentCount < 0) {
        return { isValid: false, error: `${errorPrefix}Incident count must be a non-negative number: ${row.incidentCount}` };
    }
    return { isValid: true };
  };

  const { 
    data: csvData,
    isProcessing,
    csvFile,
    handleFileChange,
    handleProcessCSV,
    resetData,
    isSubmitting: isCsvSubmitting, 
    setIsSubmitting: setIsCsvSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
    // sortConfig, // Not used in reference for form submission page
    // handleSort, // Not used in reference for form submission page
  } = useTableData<CreateReportsThreatCompositionOverviewDto>({
    requiredFields: requiredCsvHeaders,
    validateRow,
  });

  const handleSetPeriod = () => {
    if (!selectedMonth || !selectedYear) {
      toast({ variant: 'destructive', title: 'Missing Period', description: 'Please select both month and year.' });
      return;
    }
    setIsPeriodLocked(true);
    toast({ title: 'Period Set', description: `Adding entries for ${selectedMonth}, ${selectedYear}` });
  };

  const handleCurrentEntryChange = (name: keyof typeof currentEntry, value: any) => {
    setCurrentEntry(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddStagedEntry = () => {
    if (!isPeriodLocked) {
      toast({ variant: 'destructive', title: 'Period Not Set', description: 'Please set month and year before adding entries.' });
      return;
    }
    const newEntryDto: CreateReportsThreatCompositionOverviewDto = {
      month: selectedMonth,
      year: selectedYear,
      ...currentEntry,
    };
    const validation = validateRow(newEntryDto);
    if (!validation.isValid) {
      toast({ variant: 'destructive', title: 'Invalid Entry Data', description: validation.error || 'Please check the entry details.' });
      return;
    }
    setStagedEntries(prev => [...prev, newEntryDto]);
    setCurrentEntry(initialEntryFormData); // Reset for next entry
    toast({ description: 'Entry added to the list for submission.' });
  };

  const handleRemoveStagedEntry = (index: number) => {
    setStagedEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitStagedEntries = async () => {
    if (!stagedEntries.length) {
      toast({ variant: 'destructive', title: 'No Entries', description: 'No entries to submit.' });
      return;
    }

    // Validate all staged entries one last time (optional, as they are validated on add)
    const invalidEntryIndex = stagedEntries.findIndex(entry => !validateRow(entry).isValid);
    if (invalidEntryIndex !== -1) {
      const validationError = validateRow(stagedEntries[invalidEntryIndex], invalidEntryIndex).error;
      toast({ variant: 'destructive', title: 'Invalid Staged Entry', description: validationError || `Entry ${invalidEntryIndex + 1} is invalid.` });
      return;
    }

    await withLoading(async () => {
      try {
        if (stagedEntries.length === 1) {
          await createRecordMutation.mutateAsync(stagedEntries[0]);
        } else {
          await bulkCreateMutation.mutateAsync(stagedEntries);
        }
        toast({ title: 'Success', description: `${stagedEntries.length} record(s) created successfully for ${selectedMonth}, ${selectedYear}` });
        setStagedEntries([]);
        // Optionally reset period or keep it for more entries
        // setIsPeriodLocked(false); setSelectedMonth(''); setSelectedYear('');
        router.push('/dashboard/reports/threat-composition-overview');
      } catch (error: any) {
        console.error('Failed to create records:', error);
        toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'Failed to create records' });
      }
    });
  };

  const handleBulkCsvSubmit = async () => { // Renamed to avoid conflict
    if (!csvData.length) {
      toast({ variant: 'destructive', title: 'No Data', description: 'No data to submit from CSV' });
      return;
    }
    setIsCsvSubmitting(true);
    const validRows = csvData.filter(row => validateRow(row).isValid);
    const invalidRowsCount = csvData.length - validRows.length;
    if (invalidRowsCount > 0) {
        toast({ title: 'Invalid CSV Rows', description: `${invalidRowsCount} row(s) have validation errors and will be skipped.` });
    }
    if (!validRows.length) {
      toast({ variant: 'destructive', title: 'No Valid CSV Data', description: 'No valid records to submit after filtering CSV.' });
      setIsCsvSubmitting(false);
      return;
    }
    await withLoading(async () => {
      try {
        await bulkCreateMutation.mutateAsync(validRows);
        toast({ title: 'Success', description: `Successfully created ${validRows.length} records from CSV.` });
        router.push('/dashboard/reports/threat-composition-overview');
      } catch (error: any) {
        console.error('Bulk CSV submission failed:', error);
        toast({ variant: 'destructive', title: 'Bulk CSV Error', description: error?.response?.data?.message || 'Bulk CSV submission failed' });
      }
    });
    setIsCsvSubmitting(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString()); // Last 5 years + next 4 years

  return (
    <div className="p-6">
      <Breadcrumb className="mb-6">
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
            <BreadcrumbLink href="/dashboard/reports/threat-composition-overview">Threat Composition Overview</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             <BreadcrumbPage>Add New Record(s)</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/reports/threat-composition-overview">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add Threat Composition Records</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList>
          <TabsTrigger value="single">Add Multiple Entries (Single Period)</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Add Multiple Entries for a Single Month/Year</CardTitle>
              <CardDescription>
                Select a month and year, then add one or more threat composition entries for that period.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Month and Year Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="selectedMonth">Month *</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={isPeriodLocked} required>
                    <SelectTrigger id="selectedMonth"><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((monthName) => (
                        <SelectItem key={monthName} value={monthName}>{monthName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selectedYear">Year *</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isPeriodLocked} required>
                    <SelectTrigger id="selectedYear"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={isPeriodLocked ? () => { setIsPeriodLocked(false); setStagedEntries([]); /* Clear staged if period changes */ } : handleSetPeriod} className="w-full md:w-auto">
                  {isPeriodLocked ? 'Change Period' : 'Set Period & Add Entries'}
                </Button>
              </div>

              {/* Form for a single entry - only if period is locked */}
              {isPeriodLocked && (
                <div className="p-4 border rounded-md space-y-4">
                  <h3 className="text-lg font-medium">New Entry for {selectedMonth}, {selectedYear}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="current_severityLevel">Severity Level *</Label>
                      <Select value={currentEntry.severityLevel} onValueChange={(value) => handleCurrentEntryChange('severityLevel', value as ReportsSeverityLevel)} required>
                        <SelectTrigger id="current_severityLevel"><SelectValue placeholder="Select severity" /></SelectTrigger>
                        <SelectContent>{THREAT_SEVERITY_LEVELS.map((level) => (<SelectItem key={level} value={level}>{level}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_threatType">Threat Type *</Label>
                      <Select value={currentEntry.threatType} onValueChange={(value) => handleCurrentEntryChange('threatType', value as ReportsThreatType)} required>
                        <SelectTrigger id="current_threatType"><SelectValue placeholder="Select threat type" /></SelectTrigger>
                        <SelectContent>{THREAT_TYPES.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_attackVector">Attack Vector *</Label>
                      <Select value={currentEntry.attackVector} onValueChange={(value) => handleCurrentEntryChange('attackVector', value as ReportsAttackVector)} required>
                        <SelectTrigger id="current_attackVector"><SelectValue placeholder="Select attack vector" /></SelectTrigger>
                        <SelectContent>{ATTACK_VECTORS.map((vector) => (<SelectItem key={vector} value={vector}>{vector}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_bu">Business Unit *</Label>
                      <Select value={currentEntry.bu} onValueChange={(value) => handleCurrentEntryChange('bu', value as ReportsBusinessUnit)} required>
                        <SelectTrigger id="current_bu"><SelectValue placeholder="Select business unit" /></SelectTrigger>
                        <SelectContent>{BUSINESS_UNITS_TC.map((unit) => (<SelectItem key={unit} value={unit}>{unit}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="current_affectedAsset">Affected Asset / Description *</Label>
                      <Textarea id="current_affectedAsset" value={currentEntry.affectedAsset} onChange={(e) => handleCurrentEntryChange('affectedAsset', e.target.value)} placeholder="e.g., Server XYZ, User Account John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_incidentCount">Incident Count *</Label>
                      <Input id="current_incidentCount" type="number" min="0" value={currentEntry.incidentCount} onChange={(e) => handleCurrentEntryChange('incidentCount', parseInt(e.target.value, 10) || 0)} placeholder="e.g., 10" required />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" onClick={handleAddStagedEntry} disabled={isApiLoading}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Entry to List
                    </Button>
                  </div>
                </div>
              )}

              {/* Staged Entries List */}
              {stagedEntries.length > 0 && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-xl font-semibold">Entries for {selectedMonth}, {selectedYear} ({stagedEntries.length})</h3>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Severity', 'Threat Type', 'Attack Vector', 'BU', 'Affected Asset', 'Count', 'Actions'].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stagedEntries.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.severityLevel}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.threatType}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.attackVector}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.bu}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.affectedAsset}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{entry.incidentCount}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveStagedEntry(index)} disabled={isApiLoading}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" onClick={handleSubmitStagedEntries} disabled={isApiLoading || stagedEntries.length === 0 || createRecordMutation.isPending || bulkCreateMutation.isPending}>
                      {createRecordMutation.isPending || bulkCreateMutation.isPending || isApiLoading ? 'Submitting...' : `Submit All ${stagedEntries.length} Entries`}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            {/* CardFooter might not be needed here if submit is tied to staged entries list */}
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Threat Composition Records</CardTitle>
              <CardDescription>
                Upload a CSV file. Required columns: {requiredCsvHeaders.join(', ')}. Ensure enum values match the predefined lists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing || isCsvSubmitting || isApiLoading} />
                  <Button type="button" onClick={handleProcessCSV} disabled={!csvFile || isProcessing || isCsvSubmitting || isApiLoading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Process CSV
                  </Button>
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Previewing up to 10 rows. {csvData.length} rows processed. Invalid rows/cells will be highlighted or skipped upon submission.</p>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {requiredCsvHeaders.map(header => (
                               <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                               </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {currentPageData.map((row, index) => {
                            const validation = validateRow(row as CreateReportsThreatCompositionOverviewDto);
                            return (
                                <tr key={index} className={!validation.isValid ? 'bg-red-100 dark:bg-red-900' : ''}>
                                    {requiredCsvHeaders.map(header => {
                                        const value = row[header as keyof CreateReportsThreatCompositionOverviewDto];
                                        let cellClass = "px-4 py-2 whitespace-nowrap text-sm";
                                        let displayValue:any = value;
                                        if (header === 'month' && !MONTHS.includes(value as string)) cellClass += ' text-red-600 dark:text-red-400 font-semibold';
                                        if (header === 'incidentCount' && (typeof value !== 'number' || value < 0)) cellClass += ' text-red-600 dark:text-red-400 font-semibold';
                                        
                                        if (typeof value === 'number') displayValue = value.toString();
                                        else if (value === null || value === undefined) displayValue = 'N/A';

                                        return (
                                            <td key={header} className={cellClass}>
                                                {displayValue}
                                                {!validation.isValid && header === 'month' && <span className="text-xs block">({validation.error})</span>} 
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            Page {pagination.currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={previousPage} disabled={pagination.currentPage === 1 || isCsvSubmitting || isApiLoading}>Previous</Button>
                            <Button variant="outline" onClick={nextPage} disabled={pagination.currentPage === totalPages || isCsvSubmitting || isApiLoading}>Next</Button>
                        </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetData} disabled={isCsvSubmitting || isApiLoading}>Reset</Button>
                      <Button onClick={handleBulkCsvSubmit} disabled={isCsvSubmitting || isApiLoading || csvData.length === 0}>
                        {isCsvSubmitting || isApiLoading ? 'Submitting...' : `Submit All (${csvData.length}) Validated Rows`}
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
