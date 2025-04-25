'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateControlCategoryPerformance } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/control-category-performance';
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
    CreateControlCategoryPerformanceDto, 
    ControlCategoryName, 
    ControlCategoryDetail,
    ControlCategoryPerformanceBu 
} from '@/lib/api/types';
import { ArrowLeft, Upload, Home } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData'; // Assuming generic hook
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

// Define control category names locally
const CONTROL_CATEGORY_NAMES: ControlCategoryName[] = [
  "Access Control",
  "Data Protection",
  "Network Security",
  "Asset Management",
  "Incident Response",
  "Business Continuity"
];

// Type for the flat CSV row structure
type CategoryPerformanceCsvRow = {
  month: string;
  year: string;
  bu_name: string;
  category: string; // Read as string initially
  score: string;    // Read as string initially
};

// Helper type for single form data state
type SingleFormData = {
  month: string;
  year: string;
  bu_name: string;
} & { [K in ControlCategoryName as `score${string}`]: string }; // Dynamically create score keys

export default function NewCategoryPerformancePage() {
  const router = useRouter();
  const createPerformanceMutation = useCreateControlCategoryPerformance();
  const { withLoading } = useApiLoading();
  
  // State for single entry form
  const initialFormState: SingleFormData = {
    month: '',
    year: '',
    bu_name: '',
    ...Object.fromEntries(CONTROL_CATEGORY_NAMES.map(name => [`score${name.replace(/\s+/g, '')}`, '']))
  } as SingleFormData;
  const [formData, setFormData] = useState<SingleFormData>(initialFormState);

  // --- Handlers for Single Form ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: 'month' | 'bu_name', value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.month || !formData.bu_name) {
      toast.error('Please select both Month and Business Unit.');
      return;
    }

    const categories: ControlCategoryDetail[] = [];
    let hasInvalidScore = false;

    for (const categoryName of CONTROL_CATEGORY_NAMES) {
      const scoreKey = `score${categoryName.replace(/\s+/g, '')}` as keyof SingleFormData;
      const scoreValue = formData[scoreKey];
      const scoreNum = parseFloat(scoreValue);

      if (isNaN(scoreNum)) {
        hasInvalidScore = true;
        break;
      }
      categories.push({ category: categoryName, score: scoreNum });
    }

    if (hasInvalidScore) {
        toast.error('Please enter valid numbers for all category scores.');
        return;
    }
    
    const newDto: CreateControlCategoryPerformanceDto = {
        month: formData.month,
        year: formData.year,
        bu: [{
            bu_name: formData.bu_name,
            categories: categories
        }]
    };

    try {
      await withLoading(async () => {
        await createPerformanceMutation.mutateAsync(newDto);
        toast.success('Performance record created successfully');
        router.push('/dashboard/cybersecurity-compliance-dashboard/category-performance');
      });
    } catch (error) {
      console.error('Failed to create performance record:', error);
      toast.error('Failed to create performance record');
    }
  };

  // --- Bulk Upload Logic ---
  const validateRow = (row: CategoryPerformanceCsvRow): { isValid: boolean; error?: string } => {
    const requiredFields: (keyof CategoryPerformanceCsvRow)[] = ['month', 'year', 'bu_name', 'category', 'score'];
    for (const field of requiredFields) {
      if (!row[field]) {
        return { isValid: false, error: `Missing required field: ${field}` };
      }
    }
    if (!MONTHS.includes(row.month)) {
        return { isValid: false, error: `Invalid month: ${row.month}` };
    }
    if (!BU_LIST.includes(row.bu_name)) {
        return { isValid: false, error: `Invalid bu_name: ${row.bu_name}` };
    }
    if (!CONTROL_CATEGORY_NAMES.includes(row.category as ControlCategoryName)) {
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
    handleProcessCSV,
    resetData,
    setIsSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
  } = useTableData<CategoryPerformanceCsvRow>({ 
    requiredFields: ['month', 'year', 'bu_name', 'category', 'score'],
    validateRow,
  });

  const handleBulkSubmit = async () => {
     if (!csvData || csvData.length === 0) {
      toast.error('No valid data processed from CSV to submit.');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    // Grouping structure: { "Month-Year": { "BU Name": [CategoryDetail] } }
    let groupedData: Record<string, Record<string, ControlCategoryDetail[]>> = {};

    csvData.forEach(row => {
        const key = `${row.month}-${row.year}`;
        const score = parseFloat(row.score);
        const category = row.category as ControlCategoryName;
        
        if (!groupedData[key]) groupedData[key] = {};
        if (!groupedData[key][row.bu_name]) groupedData[key][row.bu_name] = [];
        
        // Avoid duplicate categories for the same BU/Month/Year
        if (!groupedData[key][row.bu_name].some(c => c.category === category)) {
            groupedData[key][row.bu_name].push({ category, score });
        }
    });

    const dtosToSubmit: CreateControlCategoryPerformanceDto[] = Object.entries(groupedData).map(([key, buData]) => {
        const [month, year] = key.split('-');
        const buArray: ControlCategoryPerformanceBu[] = Object.entries(buData)
          .filter(([buName, categories]) => categories.length === CONTROL_CATEGORY_NAMES.length) // Filter out incomplete BUs here
          .map(([buName, categories]) => ({
            bu_name: buName,
            categories: categories
        }));
        // Only return DTO if it has at least one valid BU entry
        return buArray.length > 0 ? { month, year, bu: buArray } : null;
    }).filter((dto): dto is CreateControlCategoryPerformanceDto => dto !== null); // Filter out nulls

    if (dtosToSubmit.length === 0) {
        toast.error("Could not process CSV data into valid entries. Ensure each BU has all 6 category scores for a given month/year.");
        setIsSubmitting(false);
        return;
    }

    try {
      await withLoading(async () => {
        for (const dto of dtosToSubmit) {
          try {
             // Validation is now primarily done during DTO construction
            await createPerformanceMutation.mutateAsync(dto);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to create performance record for ${dto.month}-${dto.year}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} performance records${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/cybersecurity-compliance-dashboard/category-performance');
        } else {
          toast.error('Failed to create any performance records from the bulk upload.');
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
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard">Cybersecurity & Compliance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard/category-performance">Category Performance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="font-semibold text-foreground">Add New Record</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/cybersecurity-compliance-dashboard/category-performance">
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Category Performance Data</h1>
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
                <CardTitle>Add Single Performance Record</CardTitle>
                <CardDescription>
                  Enter category scores for a specific business unit, month, and year.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Row 1: Year, Month, BU */}
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" value={formData.year} onChange={handleInputChange} placeholder="e.g., 2024" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                   <Select value={formData.month} onValueChange={(value) => handleSelectChange('month', value)} name="month">
                     <SelectTrigger id="month">
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
                  <Label htmlFor="bu_name">Business Unit Name</Label>
                  <Select value={formData.bu_name} onValueChange={(value) => handleSelectChange('bu_name', value)} name="bu_name">
                     <SelectTrigger id="bu_name">
                       <SelectValue placeholder="Select Business Unit" />
                     </SelectTrigger>
                     <SelectContent>
                       {BU_LIST.map((bu) => (
                         <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
                
                {/* Row 2 & 3: Category Scores */}
                {CONTROL_CATEGORY_NAMES.map((categoryName) => {
                  const inputId = `score${categoryName.replace(/\s+/g, '')}`;
                  return (
                    <div className="space-y-2" key={inputId}>
                      <Label htmlFor={inputId}>{categoryName} Score</Label>
                      <Input 
                        id={inputId} 
                        name={inputId} 
                        type="number" 
                        step="any" 
                        value={formData[inputId as keyof SingleFormData]} 
                        onChange={handleInputChange} 
                        placeholder="Enter score" 
                        required 
                      />
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter>
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
               <CardTitle>Bulk Upload Category Performance</CardTitle>
               <CardDescription>
                 Upload a CSV file. Required columns: <strong>month, year, bu_name, category, score</strong>.
                 Values must match predefined lists (Months, BUs, Categories: {CONTROL_CATEGORY_NAMES.join(', ')}).
                 Each month/year/bu_name combination must have exactly one row for each of the {CONTROL_CATEGORY_NAMES.length} categories.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 <div className="flex items-center gap-4">
                   <Label htmlFor="csvFileBulk" className="sr-only">Choose CSV File</Label>
                   <Input
                     id="csvFileBulk" // Unique ID
                     type="file"
                     accept=".csv"
                     onChange={handleFileChange}
                     disabled={isProcessing || isSubmitting}
                     className="flex-1"
                   />
                   <Button
                     type="button"
                     onClick={handleProcessCSV}
                     disabled={!csvFile || isProcessing || isSubmitting}
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

                     <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={resetData}
                        disabled={isSubmitting}
                      >
                        Reset / Clear
                      </Button>
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={isSubmitting || isProcessing}
                      >
                        {isSubmitting ? 'Submitting...' : `Submit ${csvData?.length ?? 0} Processed Row(s)`} {/* Use processed row count */}
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
