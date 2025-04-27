'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateNetworkSecurity } from '@/lib/api/endpoints/business-units-security/network-security'; // Use correct endpoint
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    CreateNetworkSecurityDto,
    NetworkSecurityBu,
    NetworkSecurityActivity,
    NetworkSecurityActivityName
} from '@/lib/api/types'; // Use correct types
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
import { BU_LIST } from '@/lib/constants/bu-list';
import { MONTHS } from '@/lib/constants/months-list';

// Define activity names for form generation
const ACTIVITY_NAMES: NetworkSecurityActivityName[] = [
    "Active Connections",
    "Blocked Traffic",
    "SSL/TLS Traffic",
    "DNS Queries"
];

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

type NetworkSecurityCsvRow = {
  month: string;
  year: string;
  buName: string;
  activityName: string;
  score: string;
};

type SingleFormData = Omit<CreateNetworkSecurityDto, 'bu'> & {
    bu: Array<{
        buName: string;
        activityScores: { [K in NetworkSecurityActivityName]?: string };
    }>;
};


export default function NewNetworkSecurityPage() {
  const router = useRouter();
  const createNetworkSecurityMutation = useCreateNetworkSecurity();
  const { withLoading } = useApiLoading();
  const currentYear = new Date().getFullYear();
  const [validDtoCount, setValidDtoCount] = useState(0);

  // Initialize scores for all defined activities
  const initialActivityScores = Object.fromEntries(
      ACTIVITY_NAMES.map(name => [name, ''])
  ) as { [K in NetworkSecurityActivityName]?: string };

  const [formData, setFormData] = useState<SingleFormData>({
    month: MONTHS[new Date().getMonth()],
    year: currentYear.toString(),
    bu: [{ buName: '', activityScores: { ...initialActivityScores } }],
  });

  // --- Single Form Handlers ---
  const handleTopLevelChange = (field: 'month' | 'year', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleBuNameChange = (index: number, value: string) => {
     setFormData(prev => {
        const updatedBu = [...prev.bu];
        updatedBu[index] = { ...updatedBu[index], buName: value }; // Changed bu_name to buName
        return { ...prev, bu: updatedBu };
     });
  };
  const handleActivityScoreChange = (buIndex: number, activity: NetworkSecurityActivityName, value: string) => {
    setFormData(prev => {
        const updatedBu = [...prev.bu];
        const targetBu = { ...updatedBu[buIndex] };
        targetBu.activityScores = { ...targetBu.activityScores, [activity]: value };
        updatedBu[buIndex] = targetBu;
        return { ...prev, bu: updatedBu };
    });
  };
  const addBuEntry = () => {
    setFormData(prev => ({
      ...prev,
      bu: [...prev.bu, { buName: '', activityScores: { ...initialActivityScores } }], // Changed bu_name to buName
    }));
  };
  const removeBuEntry = (index: number) => {
    if (formData.bu.length <= 1) return; 
    setFormData(prev => ({
      ...prev,
      bu: prev.bu.filter((_, i) => i !== index),
    }));
  };
  const validateSingleEntry = (): CreateNetworkSecurityDto | null => {
    if (!formData.month || !formData.year) {
      toast.error('Please select Month and enter Year.');
      return null;
    }

    const finalBuArray: NetworkSecurityBu[] = [];
    let formIsValid = true;

    for (const buEntry of formData.bu) {
        if (!buEntry.buName) { // Changed bu_name to buName
            toast.error('Please select a Business Unit for all entries.');
            formIsValid = false;
            break;
        }

        const activities: NetworkSecurityActivity[] = [];
        let buHasInvalidScore = false;
        for (const activityName of ACTIVITY_NAMES) {
            const scoreString = buEntry.activityScores[activityName];
            if (scoreString === undefined || scoreString === '') {
                 toast.error(`Score for activity "${activityName}" in BU "${buEntry.buName}" cannot be empty.`);
                 buHasInvalidScore = true;
                 break;
            }
            const scoreNum = parseFloat(scoreString);
            if (isNaN(scoreNum)) {
                toast.error(`Invalid score entered for activity "${activityName}" in BU "${buEntry.buName}". Please enter a number.`);
                buHasInvalidScore = true;
                break;
            }
            activities.push({ activityName: activityName, score: scoreNum });
        }

        if (buHasInvalidScore) {
            formIsValid = false;
            break;
        }

        finalBuArray.push({ buName: buEntry.buName, activity: activities }); // Changed bu_name to buName
    }

     if (!formIsValid) return null;

     if (finalBuArray.length === 0) {
        toast.error('At least one complete Business Unit entry is required.');
        return null;
     }

     return {
        month: formData.month,
        year: formData.year,
        bu: finalBuArray
     };
  };
  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const validatedDto = validateSingleEntry();
    if (!validatedDto) return;

    try {
      await withLoading(async () => {
        await createNetworkSecurityMutation.mutateAsync(validatedDto);
        toast.success('Network Security record created successfully');
        router.push('/dashboard/business-units-security/network-security'); // Navigate back
      });
    } catch (error) {
      console.error('Failed to create record:', error);
      toast.error('Failed to create record');
    }
  };

  // --- Bulk Upload Logic ---
  const validateRow = (row: NetworkSecurityCsvRow): ValidationResult => {
    const requiredFields: (keyof NetworkSecurityCsvRow)[] = ['month', 'year', 'buName', 'activityName', 'score']; // Use buName
    for (const field of requiredFields) {
      if (!row[field]) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    // Optional: Validate buName against BU_LIST if strict matching is required
    // if (!BU_LIST.includes(row.buName)) {
    //     return { isValid: false, error: `Invalid buName: ${row.buName}` };
    // }
    if (!ACTIVITY_NAMES.includes(row.activityName as NetworkSecurityActivityName)) {
         return { isValid: false, error: `Invalid activityName: ${row.activityName}` };
    }
    if (isNaN(parseFloat(row.score))) {
        return { isValid: false, error: `Invalid score (must be a number): ${row.score}` };
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
  } = useTableData<NetworkSecurityCsvRow>({
    requiredFields: ['month', 'year', 'buName', 'activityName', 'score'], // Use buName
    validateRow,
  });

  const handleProcessCSVAndCount = async () => {
      await originalHandleProcessCSV(); 
      
       if (csvData && csvData.length > 0) {
          let groupedData: Record<string, Record<string, Map<NetworkSecurityActivityName, number>>> = {};
          csvData.forEach(row => {
              const key = `${row.month}-${row.year}`;
              const score = parseFloat(row.score);
              const activity = row.activityName as NetworkSecurityActivityName;
              if (!groupedData[key]) groupedData[key] = {};
              if (!groupedData[key][row.buName]) groupedData[key][row.buName] = new Map();
              groupedData[key][row.buName].set(activity, score);
          });

          const dtosToSubmit: CreateNetworkSecurityDto[] = [];
          let skippedBuCount = 0;
           Object.entries(groupedData).forEach(([key, buData]) => {
                const [month, year] = key.split('-');
                const buArray: NetworkSecurityBu[] = [];
                Object.entries(buData).forEach(([buName, activityMap]) => {
                     // Check if ALL required activities are present for this BU
                     if (ACTIVITY_NAMES.every(actName => activityMap.has(actName))) {
                         const activities: NetworkSecurityActivity[] = ACTIVITY_NAMES.map(actName => ({
                             activityName: actName,
                             score: activityMap.get(actName)!, 
                         }));
                         buArray.push({ buName: buName, activity: activities });
                     } else {
                         skippedBuCount++;
                     }
                });
                if (buArray.length > 0) {
                    dtosToSubmit.push({ month, year, bu: buArray });
                }
           });
           setValidDtoCount(dtosToSubmit.length); 
           if (skippedBuCount > 0) {
               toast.warning(`${skippedBuCount} BU entries were skipped during processing due to missing activity scores.`);
           }
           if (dtosToSubmit.length === 0 && csvData.length > 0) {
               toast.error("No complete records could be formed from the CSV data. Ensure each BU has a score for all activities within a given month/year.");
           }
      } else {
           setValidDtoCount(0); 
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

    // Recalculate DTOs just before submission (logic copied from handleProcessCSVAndCount)
    let groupedData: Record<string, Record<string, Map<NetworkSecurityActivityName, number>>> = {};
     csvData.forEach(row => {
        const key = `${row.month}-${row.year}`;
        const score = parseFloat(row.score);
        const activity = row.activityName as NetworkSecurityActivityName;
        if (!groupedData[key]) groupedData[key] = {};
        if (!groupedData[key][row.buName]) groupedData[key][row.buName] = new Map();
        groupedData[key][row.buName].set(activity, score);
    });
     const dtosToSubmit: CreateNetworkSecurityDto[] = [];
     Object.entries(groupedData).forEach(([key, buData]) => {
        const [month, year] = key.split('-');
        const buArray: NetworkSecurityBu[] = [];
        Object.entries(buData).forEach(([buName, activityMap]) => {
             if (ACTIVITY_NAMES.every(actName => activityMap.has(actName))) {
                 const activities: NetworkSecurityActivity[] = ACTIVITY_NAMES.map(actName => ({
                     activityName: actName,
                     score: activityMap.get(actName)!,
                 }));
                 buArray.push({ buName: buName, activity: activities });
             }
        });
        if (buArray.length > 0) {
            dtosToSubmit.push({ month, year, bu: buArray });
        }
    });
    
    if (dtosToSubmit.length !== validDtoCount) {
        console.warn("Mismatch between calculated DTO count and state count before submission.");
        if (dtosToSubmit.length === 0) {
             toast.error("Internal error: No valid DTOs found before submission.");
             setIsSubmitting(false);
             return;
        }
    }

    try {
      await withLoading(async () => {
        for (const dto of dtosToSubmit) {
          try {
            await createNetworkSecurityMutation.mutateAsync(dto);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to create record for ${dto.month}-${dto.year}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/business-units-security/network-security');
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
             <BreadcrumbLink href="/dashboard/business-units-security/network-security">Network Security</BreadcrumbLink>
           </BreadcrumbItem>
           <BreadcrumbSeparator />
           <BreadcrumbItem>
             <span className="font-semibold text-foreground">Add New Record</span>
           </BreadcrumbItem>
         </BreadcrumbList>
       </Breadcrumb>

       <div className="flex items-center gap-4 my-6">
         <Link href="/dashboard/business-units-security/network-security">
           <Button variant="outline" size="icon" aria-label="Go back">
             <ArrowLeft className="h-4 w-4" />
           </Button>
         </Link>
         <h1 className="text-2xl font-semibold">Add New Network Security Data</h1>
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
                <CardTitle>Add Single Network Security Record</CardTitle>
                <CardDescription>
                  Enter network activity scores for specific business units, month, and year.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label htmlFor="month-single">Month</Label>
                         <Select value={formData.month} onValueChange={(value) => handleTopLevelChange('month', value)}>
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
                             onChange={(e) => handleTopLevelChange('year', e.target.value)}
                             placeholder={`e.g., ${currentYear}`}
                             required
                             min="2000"
                             max={currentYear + 5}
                         />
                     </div>
                 </div>

                 <div className="space-y-4">
                     <Label className="text-base font-medium">Business Unit Scores</Label>
                     {formData.bu.map((buEntry, buIndex) => (
                         <Card key={buIndex} className="p-4 space-y-4 relative">
                             <div className="flex justify-between items-start">
                                 <div className="space-y-2 flex-grow mr-2">
                                     <Label htmlFor={`buName-${buIndex}`}>Business Unit</Label> 
                                     <Select value={buEntry.buName} onValueChange={(value) => handleBuNameChange(buIndex, value)}>
                                         <SelectTrigger id={`buName-${buIndex}`}>
                                             <SelectValue placeholder="Select Business Unit" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {BU_LIST.map((bu) => (
                                                 <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>
                                 {formData.bu.length > 1 && (
                                     <Button
                                         type="button"
                                         variant="ghost"
                                         size="icon"
                                         className="text-destructive hover:text-destructive absolute top-2 right-2"
                                         onClick={() => removeBuEntry(buIndex)}
                                         aria-label="Remove this Business Unit entry"
                                     >
                                         <XCircle className="h-5 w-5" />
                                     </Button>
                                 )}
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4"> 
                                 {ACTIVITY_NAMES.map((activityName) => {
                                     const inputId = `bu-${buIndex}-score-${activityName.replace(/\W+/g, '')}`;
                                     return (
                                         <div className="space-y-2" key={inputId}>
                                             <Label htmlFor={inputId}>{activityName}</Label>
                                             <Input
                                                 id={inputId}
                                                 name={inputId}
                                                 type="number"
                                                 step="any"
                                                 value={buEntry.activityScores[activityName] || ''}
                                                 onChange={(e) => handleActivityScoreChange(buIndex, activityName, e.target.value)}
                                                 placeholder="Score"
                                                 required
                                                 min="0" 
                                             />
                                         </div>
                                     );
                                 })}
                             </div>
                         </Card>
                     ))}
                     <Button type="button" variant="outline" size="sm" onClick={addBuEntry} className="mt-2">
                         <PlusCircle className="mr-2 h-4 w-4" /> Add Another Business Unit
                     </Button>
                 </div>

              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createNetworkSecurityMutation.isPending}>
                   {createNetworkSecurityMutation.isPending ? 'Creating...' : 'Create Record'}
                 </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Bulk Upload Form */}
        <TabsContent value="bulk">
          <Card>
              <CardHeader>
                  <CardTitle>Bulk Upload Network Security Data</CardTitle>
                  <CardDescription>
                  Upload a CSV file. Required columns: <strong>month, year, buName, activityName, score</strong>.
                  Activity names must be one of: {ACTIVITY_NAMES.join(', ')}. 
                  Each month/year/buName combination must have exactly one row for each of the {ACTIVITY_NAMES.length} activities.
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
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Year</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">BU Name</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Activity Name</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Score</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-100">
                           {currentPageData.map((row, index) => (
                             <tr key={index}>
                               <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.year}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.buName}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.activityName}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.score}</td>
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
