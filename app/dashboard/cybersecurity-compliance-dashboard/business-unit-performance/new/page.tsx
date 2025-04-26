'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBusinessUnitPerformance } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/business-unit-performance';
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
    CreateBusinessUnitPerformanceDto,
    BusinessUnitPerformanceBu,
    BusinessUnitPerformanceCategoryDetail,
    ControlCategoryName
} from '@/lib/api/types';
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
import { CATEGORY_LIST } from '@/lib/constants/category-list';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

type BusinessUnitPerformanceCsvRow = {
  month: string;
  year: string;
  bu_name: string;
  category: string;
  score: string;
};

type SingleFormData = Omit<CreateBusinessUnitPerformanceDto, 'bu'> & {
    bu: Array<{
        bu_name: string;
        categoryScores: { [K in ControlCategoryName]?: string };
    }>
};


export default function NewBusinessUnitPerformancePage() {
  const router = useRouter();
  const createPerformanceMutation = useCreateBusinessUnitPerformance();
  const { withLoading } = useApiLoading();
  const currentYear = new Date().getFullYear();
  const [validDtoCount, setValidDtoCount] = useState(0); // State for DTO count

  const initialCategoryScores = Object.fromEntries(
      CATEGORY_LIST.map(name => [name, ''])
  ) as { [K in ControlCategoryName]?: string };

  const [formData, setFormData] = useState<SingleFormData>({
    month: MONTHS[new Date().getMonth()],
    year: currentYear.toString(),
    bu: [{ bu_name: '', categoryScores: { ...initialCategoryScores } }],
  });

  // --- Single Form Handlers ---
  const handleTopLevelChange = (field: 'month' | 'year', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleBuNameChange = (index: number, value: string) => {
     setFormData(prev => {
        const updatedBu = [...prev.bu];
        updatedBu[index] = { ...updatedBu[index], bu_name: value };
        return { ...prev, bu: updatedBu };
     });
  };
  const handleCategoryScoreChange = (buIndex: number, category: ControlCategoryName, value: string) => {
    setFormData(prev => {
        const updatedBu = [...prev.bu];
        const targetBu = { ...updatedBu[buIndex] };
        targetBu.categoryScores = { ...targetBu.categoryScores, [category]: value };
        updatedBu[buIndex] = targetBu;
        return { ...prev, bu: updatedBu };
    });
  };
  const addBuEntry = () => {
    setFormData(prev => ({
      ...prev,
      bu: [...prev.bu, { bu_name: '', categoryScores: { ...initialCategoryScores } }],
    }));
  };
  const removeBuEntry = (index: number) => {
    if (formData.bu.length <= 1) return; // Keep at least one BU entry
    setFormData(prev => ({
      ...prev,
      bu: prev.bu.filter((_, i) => i !== index),
    }));
  };
  const validateSingleEntry = (): CreateBusinessUnitPerformanceDto | null => {
    if (!formData.month || !formData.year) {
      toast.error('Please select Month and enter Year.');
      return null;
    }

    const finalBuArray: BusinessUnitPerformanceBu[] = [];
    let formIsValid = true;

    for (const buEntry of formData.bu) {
        if (!buEntry.bu_name) {
            toast.error('Please select a Business Unit for all entries.');
            formIsValid = false;
            break;
        }

        const categories: BusinessUnitPerformanceCategoryDetail[] = [];
        let buHasInvalidScore = false;
        for (const categoryName of CATEGORY_LIST) {
            const scoreString = buEntry.categoryScores[categoryName];
            if (scoreString === undefined || scoreString === '') {
                 toast.error(`Score for category "${categoryName}" in BU "${buEntry.bu_name}" cannot be empty.`);
                 buHasInvalidScore = true;
                 break;
            }
            const scoreNum = parseFloat(scoreString);
            if (isNaN(scoreNum)) {
                toast.error(`Invalid score entered for category "${categoryName}" in BU "${buEntry.bu_name}". Please enter a number.`);
                buHasInvalidScore = true;
                break;
            }
            categories.push({ category: categoryName, score: scoreNum });
        }

        if (buHasInvalidScore) {
            formIsValid = false;
            break;
        }

        // Only add if all categories have valid scores
        finalBuArray.push({ bu_name: buEntry.bu_name, categories });
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
    if (!validatedDto) return; // Validation failed, toasts shown in validation function

    try {
      await withLoading(async () => {
        await createPerformanceMutation.mutateAsync(validatedDto);
        toast.success('Business Unit performance record created successfully');
        router.push('/dashboard/cybersecurity-compliance-dashboard/business-unit-performance'); // Navigate back
      });
    } catch (error) {
      console.error('Failed to create performance record:', error);
      toast.error('Failed to create performance record');
    }
  };

  // --- Bulk Upload Logic ---
  const validateRow = (row: BusinessUnitPerformanceCsvRow): ValidationResult => {
    const requiredFields: (keyof BusinessUnitPerformanceCsvRow)[] = ['month', 'year', 'bu_name', 'category', 'score'];
    for (const field of requiredFields) {
      if (!row[field]) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    // No need to validate BU name against BU_LIST if any BU name is allowed
    // if (!BU_LIST.includes(row.bu_name)) {
    //     return { isValid: false, error: `Invalid bu_name: ${row.bu_name}` };
    // }
    if (!CATEGORY_LIST.includes(row.category as ControlCategoryName)) {
         return { isValid: false, error: `Invalid category: ${row.category}` };
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
    handleProcessCSV: originalHandleProcessCSV, // Rename original hook function
    resetData: originalResetData, // Rename original hook function
    setIsSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
  } = useTableData<BusinessUnitPerformanceCsvRow>({
    requiredFields: ['month', 'year', 'bu_name', 'category', 'score'],
    validateRow,
  });

  // Wrap process CSV to calculate DTO count afterwards
  const handleProcessCSVAndCount = async () => {
      await originalHandleProcessCSV(); // Process the CSV first

      // Now calculate the DTOs based on the processed csvData (which is now populated)
       if (csvData && csvData.length > 0) {
          let groupedData: Record<string, Record<string, Map<ControlCategoryName, number>>> = {};
          csvData.forEach(row => {
              // Grouping logic... (same as in handleBulkSubmit)
              const key = `${row.month}-${row.year}`;
              const score = parseFloat(row.score);
              const category = row.category as ControlCategoryName;
              if (!groupedData[key]) groupedData[key] = {};
              if (!groupedData[key][row.bu_name]) groupedData[key][row.bu_name] = new Map();
              groupedData[key][row.bu_name].set(category, score);
          });

          const dtosToSubmit: CreateBusinessUnitPerformanceDto[] = [];
          let skippedBuCount = 0;
           Object.entries(groupedData).forEach(([key, buData]) => {
                const [month, year] = key.split('-');
                const buArray: BusinessUnitPerformanceBu[] = [];
                Object.entries(buData).forEach(([buName, categoryMap]) => {
                     if (CATEGORY_LIST.every(catName => categoryMap.has(catName))) {
                         const categories: BusinessUnitPerformanceCategoryDetail[] = CATEGORY_LIST.map(catName => ({
                             category: catName,
                             score: categoryMap.get(catName)!,
                         }));
                         buArray.push({ bu_name: buName, categories });
                     } else {
                         skippedBuCount++;
                     }
                });
                if (buArray.length > 0) {
                    dtosToSubmit.push({ month, year, bu: buArray });
                }
           });
           setValidDtoCount(dtosToSubmit.length); // Update state with the count
           if (skippedBuCount > 0) {
               toast.warning(`${skippedBuCount} BU entries were skipped during processing due to missing category scores.`);
           }
           if (dtosToSubmit.length === 0 && csvData.length > 0) {
               toast.error("No complete records could be formed from the CSV data. Please check the file content and requirements.");
           }
      } else {
           setValidDtoCount(0); // Reset count if csvData is empty
      }
  };

  // Wrap resetData to also reset the count
  const resetDataAndCount = () => {
    originalResetData();
    setValidDtoCount(0);
  }

  const handleBulkSubmit = async () => {
     if (!csvData || csvData.length === 0 || validDtoCount === 0) { // Check count too
      toast.error('No valid records processed from CSV to submit.');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    // Recalculate DTOs just before submission to be safe, though state should be accurate
    let groupedData: Record<string, Record<string, Map<ControlCategoryName, number>>> = {};
     csvData.forEach(row => {
        const key = `${row.month}-${row.year}`;
        const score = parseFloat(row.score);
        const category = row.category as ControlCategoryName;
        if (!groupedData[key]) groupedData[key] = {};
        if (!groupedData[key][row.bu_name]) groupedData[key][row.bu_name] = new Map();
        groupedData[key][row.bu_name].set(category, score);
    });
     const dtosToSubmit: CreateBusinessUnitPerformanceDto[] = [];
     Object.entries(groupedData).forEach(([key, buData]) => {
        const [month, year] = key.split('-');
        const buArray: BusinessUnitPerformanceBu[] = [];
        Object.entries(buData).forEach(([buName, categoryMap]) => {
             if (CATEGORY_LIST.every(catName => categoryMap.has(catName))) {
                 const categories: BusinessUnitPerformanceCategoryDetail[] = CATEGORY_LIST.map(catName => ({
                     category: catName,
                     score: categoryMap.get(catName)!,
                 }));
                 buArray.push({ bu_name: buName, categories });
             }
             // No need to count skipped here, already warned during processing
        });
        if (buArray.length > 0) {
            dtosToSubmit.push({ month, year, bu: buArray });
        }
    });

    // Sanity check - should match validDtoCount
    if (dtosToSubmit.length !== validDtoCount) {
        console.warn("Mismatch between calculated DTO count and state count before submission.");
        // Optionally re-set state, though it might cause flicker: setValidDtoCount(dtosToSubmit.length);
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
            await createPerformanceMutation.mutateAsync(dto);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to create performance record for ${dto.month}-${dto.year}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} performance records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/cybersecurity-compliance-dashboard/business-unit-performance');
        } else {
          toast.error('Failed to create any performance records from the bulk upload.');
        }
      });
    } catch (error) {
      console.error('Bulk submission process failed:', error);
      toast.error('Bulk submission process failed');
    } finally {
      setIsSubmitting(false);
      // Optionally reset count here too, or rely on navigating away/reset button
      // setValidDtoCount(0);
    }
  };

  // --- Render Logic ---
  return (
    <div className="p-6">
      {/* Breadcrumbs */}
       <Breadcrumb>
         {/* ... breadcrumb items ... */}
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" /> Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
           <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard">Cybersecurity & Compliance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             {/* Update link */}
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard/business-unit-performance">Business Unit Performance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="font-semibold text-foreground">Add New Record</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
       <div className="flex items-center gap-4 my-6">
         {/* ... header content ... */}
         <Link href="/dashboard/cybersecurity-compliance-dashboard/business-unit-performance">
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
         {/* Update title */}
        <h1 className="text-2xl font-semibold">Add New Business Unit Performance Data</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Record Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        {/* Single Entry Form */}
        <TabsContent value="single">
           {/* ... Single entry card ... */}
          <Card>
            <form onSubmit={handleSubmitSingle}>
              <CardHeader>
                 {/* Update title */}
                <CardTitle>Add Single Business Unit Performance Record</CardTitle>
                 {/* Update description */}
                <CardDescription>
                  Enter performance scores across categories for specific business units, month, and year.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 {/* Month and Year Selection */}
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

                 {/* Dynamic Business Units Section */}
                 <div className="space-y-4">
                    <Label className="text-base font-medium">Business Unit Scores</Label>
                    {formData.bu.map((buEntry, buIndex) => (
                        <Card key={buIndex} className="p-4 space-y-4 relative">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-grow mr-2">
                                    <Label htmlFor={`bu_name-${buIndex}`}>Business Unit</Label>
                                    <Select value={buEntry.bu_name} onValueChange={(value) => handleBuNameChange(buIndex, value)}>
                                        <SelectTrigger id={`bu_name-${buIndex}`}>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {CATEGORY_LIST.map((categoryName) => {
                                    const inputId = `bu-${buIndex}-score-${categoryName.replace(/\s+/g, '')}`;
                                    return (
                                        <div className="space-y-2" key={inputId}>
                                            <Label htmlFor={inputId}>{categoryName}</Label>
                                            <Input
                                                id={inputId}
                                                name={inputId}
                                                type="number"
                                                step="any"
                                                value={buEntry.categoryScores[categoryName] || ''}
                                                onChange={(e) => handleCategoryScoreChange(buIndex, categoryName, e.target.value)}
                                                placeholder="Score"
                                                required
                                                min="0"
                                                // Add max if applicable, e.g., max="100"
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
                 {/* Update button text */}
                <Button type="submit" disabled={createPerformanceMutation.isPending}>
                  {createPerformanceMutation.isPending ? 'Creating...' : 'Create Performance Record'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Bulk Upload Form */}
        <TabsContent value="bulk">
          <Card>
             <CardHeader>
                 {/* ... Bulk CardHeader ... */}
                 <CardTitle>Bulk Upload Business Unit Performance</CardTitle>
                 <CardDescription>
                 Upload a CSV file. Required columns: <strong>month, year, bu_name, category, score</strong>.
                 Values must match predefined lists (Months, Categories: {CATEGORY_LIST.join(', ')}).
                 Each month/year/bu_name combination must have exactly one row for each of the {CATEGORY_LIST.length} categories.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                  {/* ... File Input and Process Button ... */}
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
                         // Use the wrapped function here
                         onClick={handleProcessCSVAndCount}
                         disabled={!csvFile || isProcessing || isSubmitting}
                         className="w-full sm:w-auto mt-4 sm:mt-0"
                         aria-label="Process CSV file"
                     >
                         <Upload className="mr-2 h-4 w-4" />
                         {isProcessing ? 'Processing...' : 'Process CSV'}
                     </Button>
                  </div>
                 {/* Data Preview Table */}
                  {csvData && csvData.length > 0 && (
                     <div className="space-y-4">
                         {/* ... Preview Table ... */}
                         <h3 className="text-lg font-medium">Preview Processed Data ({csvData.length} rows)</h3>
                     <div className="border rounded-lg overflow-auto max-h-[400px]">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Month</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Year</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">BU Name</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Score</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{row.year}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{row.bu_name}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{row.category}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{row.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                     </div>
                         {/* ... Pagination ... */}
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
             {/* Footer with Submit/Reset */}
              <CardFooter className="flex justify-end gap-2 pt-4">
                  <Button
                      variant="outline"
                      // Use wrapped reset function
                      onClick={resetDataAndCount}
                      disabled={isSubmitting || !csvData || csvData.length === 0}
                  >
                      Reset / Clear Preview
                  </Button>
                  <Button
                      onClick={handleBulkSubmit}
                      disabled={isSubmitting || !csvData || csvData.length === 0 || isProcessing}
                  >
                      {/* Use state variable for count */}
                      {isSubmitting ? 'Submitting...' : `Submit ${validDtoCount} Record(s)`}
                  </Button>
             </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}