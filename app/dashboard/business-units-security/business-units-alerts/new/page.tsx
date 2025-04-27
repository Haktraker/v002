'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBuAlerts } from '@/lib/api/endpoints/business-units-security/business-units-alerts'; // Use correct hook
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For comments
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    CreateBuAlertsDto,
    BuAlertsSeverityDetail
} from '@/lib/api/types'; // Use correct types
import { ArrowLeft, Upload, Home } from 'lucide-react';
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

// Define severity levels for form generation
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
const SEVERITY_LEVELS: SeverityLevel[] = ["critical", "high", "medium", "low"];

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

type BuAlertsCsvRow = {
  month: string;
  year: string;
  bu: string;
  critical_count: string;
  critical_comment?: string;
  high_count: string;
  high_comment?: string;
  medium_count: string;
  medium_comment?: string;
  low_count: string;
  low_comment?: string;
};

// Type for the single form data
type SingleFormData = Omit<CreateBuAlertsDto, 'high' | 'medium' | 'low' | 'critical'> & {
    critical_count: string;
    critical_comment?: string;
    high_count: string;
    high_comment?: string;
    medium_count: string;
    medium_comment?: string;
    low_count: string;
    low_comment?: string;
};

export default function NewBuAlertsPage() {
  const router = useRouter();
  const createBuAlertsMutation = useCreateBuAlerts();
  const { withLoading } = useApiLoading();
  const currentYear = new Date().getFullYear();
  const [validDtoCount, setValidDtoCount] = useState(0);

  const [formData, setFormData] = useState<SingleFormData>({
    bu: '',
    month: MONTHS[new Date().getMonth()],
    year: currentYear.toString(),
    critical_count: '0', critical_comment: '',
    high_count: '0', high_comment: '',
    medium_count: '0', medium_comment: '',
    low_count: '0', low_comment: '',
  });

  // --- Single Form Handlers ---
  const handleInputChange = (field: keyof SingleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateSingleEntry = (): CreateBuAlertsDto | null => {
    if (!formData.bu || !formData.month || !formData.year) {
      toast.error('Please select Business Unit, Month, and enter Year.');
      return null;
    }

    const dto: Partial<CreateBuAlertsDto> = {
        bu: formData.bu,
        month: formData.month,
        year: formData.year
    };
    let isValid = true;

    for (const level of SEVERITY_LEVELS) {
        const countField = `${level}_count` as keyof SingleFormData;
        const commentField = `${level}_comment` as keyof SingleFormData;
        const countStr = formData[countField];
        const comment = formData[commentField];
        
        if (countStr === undefined || countStr === '') {
            toast.error(`Count for ${level} alerts cannot be empty.`);
            isValid = false;
            break;
        }
        const countNum = parseInt(countStr, 10);
        if (isNaN(countNum) || countNum < 0) {
            toast.error(`Invalid count for ${level} alerts. Must be a non-negative number.`);
            isValid = false;
            break;
        }

        // Construct the severity detail object correctly
        const severityDetail: BuAlertsSeverityDetail = { 
            count: countNum,
            // Conditionally include the comment field based on its existence
            ...(comment && { [`${level}Comment`]: comment })
        };

        dto[level] = severityDetail;
    }

     if (!isValid) return null;

     return dto as CreateBuAlertsDto; // Cast to full type after validation
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const validatedDto = validateSingleEntry();
    if (!validatedDto) return;

    try {
      await withLoading(async () => {
        await createBuAlertsMutation.mutateAsync(validatedDto);
        toast.success('BU Alert record created successfully');
        router.push('/dashboard/business-units-security/business-units-alerts'); 
      });
    } catch (error) {
      console.error('Failed to create record:', error);
      toast.error('Failed to create record');
    }
  };

  // --- Bulk Upload Logic ---
  const requiredCsvFields: (keyof BuAlertsCsvRow)[] = [
      'month', 'year', 'bu', 
      'critical_count', 'high_count', 'medium_count', 'low_count'
  ];
  const validateRow = (row: BuAlertsCsvRow): ValidationResult => {
    for (const field of requiredCsvFields) {
      if (row[field] === undefined || row[field] === null || row[field] === '') { // Check explicitly for empty string too
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    // Optional: Validate bu against BU_LIST if needed
    // if (!BU_LIST.includes(row.bu)) {
    //     return { isValid: false, error: `Invalid bu: ${row.bu}` };
    // }
    for (const level of SEVERITY_LEVELS) {
        const countField = `${level}_count` as keyof BuAlertsCsvRow;
        const countNum = parseInt(row[countField]!, 10);
        if (isNaN(countNum) || countNum < 0) {
             return { isValid: false, error: `Invalid count for ${level} (must be non-negative number): ${row[countField]}` };
        }
    }
    return { isValid: true };
  };

  const {
    data: csvData,
    isProcessing,
    isSubmitting,
    csvFile,
    handleFileChange,
    handleProcessCSV: originalHandleProcessCSV, 
    resetData: originalResetData, 
    setIsSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
  } = useTableData<BuAlertsCsvRow>({
    requiredFields: requiredCsvFields,
    validateRow,
  });

  const handleProcessCSVAndCount = async () => {
      await originalHandleProcessCSV(); 
      // DTO count is simply the number of valid rows after processing
      setValidDtoCount(csvData ? csvData.length : 0);
       if (csvData && csvData.length === 0 && csvFile) {
           toast.error("CSV processed, but no valid records found. Please check file content and validation rules.");
       }
  };

  const resetDataAndCount = () => {
    originalResetData();
    setValidDtoCount(0);
  }

  const handleBulkSubmit = async () => {
     if (!csvData || csvData.length === 0 || validDtoCount === 0) { 
      toast.error('No valid records processed from CSV to submit.');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    const dtosToSubmit: CreateBuAlertsDto[] = csvData.map(row => ({
        bu: row.bu,
        month: row.month,
        year: row.year,
        critical: { count: parseInt(row.critical_count!, 10), criticalComment: row.critical_comment },
        high: { count: parseInt(row.high_count!, 10), highComment: row.high_comment },
        medium: { count: parseInt(row.medium_count!, 10), mediumComment: row.medium_comment },
        low: { count: parseInt(row.low_count!, 10), lowComment: row.low_comment },
    }));

    // Sanity check
    if (dtosToSubmit.length !== validDtoCount) {
        console.warn("Mismatch between calculated DTO count and state count before submission.");
    }

    try {
      await withLoading(async () => {
        for (const dto of dtosToSubmit) {
          try {
            await createBuAlertsMutation.mutateAsync(dto);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to create record for ${dto.bu} ${dto.month}-${dto.year}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/business-units-security/business-units-alerts');
        } else {
          toast.error('Failed to create any records from the bulk upload.');
        }
      });
    } catch (error) {
      console.error('Bulk submission process failed:', error);
      toast.error('Bulk submission process failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  return (
    <div className="p-6">
       <Breadcrumb>
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
             <BreadcrumbLink href="/dashboard/business-units-security/business-units-alerts">Business Unit Alerts</BreadcrumbLink>
           </BreadcrumbItem>
           <BreadcrumbSeparator />
           <BreadcrumbItem>
             <span className="font-semibold text-foreground">Add New Record</span>
           </BreadcrumbItem>
         </BreadcrumbList>
       </Breadcrumb>

       <div className="flex items-center gap-4 my-6">
         <Link href="/dashboard/business-units-security/business-units-alerts">
           <Button variant="outline" size="icon" aria-label="Go back">
             <ArrowLeft className="h-4 w-4" />
           </Button>
         </Link>
         <h1 className="text-2xl font-semibold">Add New Business Unit Alert Data</h1>
       </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Record Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        {/* Single Entry Form */}
        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmitSingle}>
              <CardHeader>
                <CardTitle>Add Single BU Alert Record</CardTitle>
                <CardDescription>
                  Enter alert counts and optional comments for a specific business unit, month, and year.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 {/* BU, Month, Year */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                         <Label htmlFor="bu-single">Business Unit</Label>
                         <Select value={formData.bu} onValueChange={(value) => handleInputChange('bu', value)}>
                             <SelectTrigger id="bu-single">
                                 <SelectValue placeholder="Select BU" />
                             </SelectTrigger>
                             <SelectContent>
                                 {BU_LIST.map((bu) => (
                                     <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="month-single">Month</Label>
                         <Select value={formData.month} onValueChange={(value) => handleInputChange('month', value)}>
                             <SelectTrigger id="month-single">
                                 <SelectValue placeholder="Select Month" />
                             </SelectTrigger>
                             <SelectContent>
                                 {MONTHS.map((month) => (
                                     <SelectItem key={month} value={month}>{month}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="year-single">Year</Label>
                         <Input
                             id="year-single"
                             name="year"
                             type="number"
                             value={formData.year}
                             onChange={(e) => handleInputChange('year', e.target.value)}
                             placeholder={`e.g., ${currentYear}`}
                             required
                             min="2000"
                             max={currentYear + 5}
                         />
                     </div>
                 </div>

                 {/* Severity Counts and Comments */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     {SEVERITY_LEVELS.map((level) => (
                         <div key={level} className="space-y-4 border p-4 rounded-md">
                             <h3 className="text-lg font-medium capitalize">{level} Alerts</h3>
                             <div className="space-y-2">
                                 <Label htmlFor={`${level}_count`}>Count</Label>
                                 <Input
                                     id={`${level}_count`}
                                     name={`${level}_count`}
                                     type="number"
                                     value={formData[`${level}_count` as keyof SingleFormData] || '0'}
                                     onChange={(e) => handleInputChange(`${level}_count` as keyof SingleFormData, e.target.value)}
                                     required
                                     min="0"
                                 />
                             </div>
                             <div className="space-y-2">
                                 <Label htmlFor={`${level}_comment`}>Comment (Optional)</Label>
                                 <Textarea
                                     id={`${level}_comment`}
                                     name={`${level}_comment`}
                                     value={formData[`${level}_comment` as keyof SingleFormData] || ''}
                                     onChange={(e) => handleInputChange(`${level}_comment` as keyof SingleFormData, e.target.value)}
                                     placeholder={`Add any comments for ${level} alerts...`}
                                     rows={2}
                                 />
                             </div>
                         </div>
                     ))}
                 </div>

              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createBuAlertsMutation.isPending}>
                   {createBuAlertsMutation.isPending ? 'Creating...' : 'Create Record'}
                 </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Bulk Upload Form */}
        <TabsContent value="bulk">
          <Card>
              <CardHeader>
                  <CardTitle>Bulk Upload BU Alert Data</CardTitle>
                  <CardDescription>
                      Upload a CSV file. Required columns: <strong>{requiredCsvFields.join(', ')}</strong>.
                      Optional columns: <strong>critical_comment, high_comment, medium_comment, low_comment</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                          <Label htmlFor="csvFileBulk">Choose CSV File</Label>
                          <Input
                              id="csvFileBulk"
                              type="file"
                              accept=".csv"
                              onChange={handleFileChange}
                              disabled={isProcessing || isSubmitting}
                              className="cursor-pointer file:cursor-pointer"
                          />
                      </div>
                      <Button
                          type="button"
                          onClick={handleProcessCSVAndCount}
                          disabled={!csvFile || isProcessing || isSubmitting}
                          className="w-full sm:w-auto mt-4 sm:mt-0"
                          aria-label="Process CSV file"
                      >
                          <Upload className="mr-2 h-4 w-4" />
                          {isProcessing ? 'Processing...' : 'Process CSV'}
                      </Button>
                   </div>
                   {csvData && csvData.length > 0 && (
                      <div className="space-y-4">
                          <h3 className="text-lg font-medium">Preview Processed Data ({csvData.length} rows)</h3>
                      <div className="border rounded-lg overflow-auto max-h-[400px]">
                       <table className="min-w-full divide-y divide-gray-200 text-sm">
                         <thead className="bg-gray-50 sticky top-0">
                           <tr>
                             {/* Dynamically generate headers from CsvRow type? Or list manually */}
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Year</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">BU</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Crit Cnt</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Crit Cmt</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">High Cnt</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">High Cmt</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Med Cnt</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Med Cmt</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Low Cnt</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Low Cmt</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-100">
                           {currentPageData.map((row, index) => (
                             <tr key={index}>
                               <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.year}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.bu}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.critical_count}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.critical_comment}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.high_count}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.high_comment}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.medium_count}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.medium_comment}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.low_count}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.low_comment}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                      </div>
                          <div className="flex justify-between items-center pt-2">
                          <div className="text-sm text-muted-foreground">
                              Page {pagination.currentPage} of {totalPages}
                          </div>
                          <div className="flex gap-2">
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={previousPage}
                                  disabled={pagination.currentPage === 1 || isSubmitting}
                              >
                                  Previous
                              </Button>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={nextPage}
                                  disabled={pagination.currentPage === totalPages || isSubmitting}
                              >
                                  Next
                              </Button>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </CardContent>
               <CardFooter className="flex justify-end gap-2 pt-4">
                   <Button
                       variant="outline"
                       onClick={resetDataAndCount}
                       disabled={isSubmitting || !csvData || csvData.length === 0}
                   >
                       Reset / Clear Preview
                   </Button>
                   <Button
                       onClick={handleBulkSubmit}
                       disabled={isSubmitting || !csvData || csvData.length === 0 || isProcessing || validDtoCount === 0}
                   >
                       {isSubmitting ? 'Submitting...' : `Submit ${validDtoCount} Record(s)`}
                   </Button>
              </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
