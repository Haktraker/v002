'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateComplianceTrend } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/compliance-trend';
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
import { CreateComplianceTrendDto, ComplianceDetail, ComplianceTrendBu } from '@/lib/api/types';
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
import { FRAMEWORKS_LIST } from '@/lib/constants/framworks-list';

// Define the structure for a single row in the CSV (flat structure)
type ComplianceTrendCsvRow = {
  month: string;
  year: string;
  bu_name: string;
  complianceName: string; // Keep as string for initial parsing
  complianceScore: string; // Read as string initially from CSV
};

export default function NewComplianceTrendPage() {
  const router = useRouter();
  const createTrendMutation = useCreateComplianceTrend();
  const { withLoading } = useApiLoading();
  
  const [formData, setFormData] = useState({
    month: '', // Month will be handled by Select
    year: '',
    bu_name: '',
    isoScore: '',
    nistScore: '',
    pdplScore: '',
    cisScore: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for Select components (BU and Month)
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bu_name) {
      toast.error('Please select a Business Unit.');
      return;
    }
    if (!formData.month) {
      toast.error('Please select a Month.');
      return;
    }
    
    const isoScoreNum = parseFloat(formData.isoScore);
    const nistScoreNum = parseFloat(formData.nistScore);
    const pdplScoreNum = parseFloat(formData.pdplScore);
    const cisScoreNum = parseFloat(formData.cisScore);

    if (isNaN(isoScoreNum) || isNaN(nistScoreNum) || isNaN(pdplScoreNum) || isNaN(cisScoreNum)) {
        toast.error('Please enter valid numbers for all compliance scores.');
        return;
    }
    
    const newTrendDto: CreateComplianceTrendDto = {
        month: formData.month,
        year: formData.year,
        bu: [
            {
                bu_name: formData.bu_name,
                compliance: [
                    { complianceName: 'ISO 27001', complianceScore: isoScoreNum },
                    { complianceName: 'NIST CSF', complianceScore: nistScoreNum },
                    { complianceName: 'PDPL', complianceScore: pdplScoreNum },
                    { complianceName: 'CIS Controls', complianceScore: cisScoreNum },
                ]
            }
        ]
    };

    try {
      await withLoading(async () => {
        await createTrendMutation.mutateAsync(newTrendDto);
        toast.success('Compliance trend created successfully');
        router.push('/dashboard/cybersecurity-compliance-dashboard/compliance-trends');
      });
    } catch (error) {
      console.error('Failed to create compliance trend:', error);
      toast.error('Failed to create compliance trend');
    }
  };

  // --- Bulk Upload Logic ---
  const validateRow = (row: ComplianceTrendCsvRow): { isValid: boolean; error?: string } => {
    if (!row.month || !row.year || !row.bu_name || !row.complianceName || row.complianceScore === undefined || row.complianceScore === null) {
      return { isValid: false, error: 'Missing required fields (month, year, bu_name, complianceName, complianceScore)' };
    }
    if (!BU_LIST.includes(row.bu_name)) {
      return { isValid: false, error: `Invalid bu_name in CSV: ${row.bu_name}. Must be one of the predefined values.` };
    }
    if (!FRAMEWORKS_LIST.includes(row.complianceName as any)) {
        return { isValid: false, error: `Invalid complianceName: ${row.complianceName}. Must be one of ${FRAMEWORKS_LIST.join(', ')}` };
    }
    const score = parseFloat(row.complianceScore);
    if (isNaN(score)) {
        return { isValid: false, error: `Invalid complianceScore (must be a number): ${row.complianceScore}` };
    }
    if (!MONTHS.includes(row.month)) {
      return { isValid: false, error: `Invalid month in CSV: ${row.month}.` };
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
  } = useTableData<ComplianceTrendCsvRow>({ 
    requiredFields: ['month', 'year', 'bu_name', 'complianceName', 'complianceScore'],
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
    let groupedData: Record<string, Record<string, ComplianceDetail[]>> = {};

    csvData.forEach(row => {
        const key = `${row.month}-${row.year}`;
        const score = parseFloat(row.complianceScore);
        const validatedComplianceName = row.complianceName as 'ISO 27001' | 'NIST CSF' | 'PDPL' | 'CIS Controls'; 
        
        if (!groupedData[key]) {
            groupedData[key] = {};
        }
        if (!groupedData[key][row.bu_name]) {
            groupedData[key][row.bu_name] = [];
        }
        groupedData[key][row.bu_name].push({ 
            complianceName: validatedComplianceName,
            complianceScore: score 
        });
    });

    const dtosToSubmit: CreateComplianceTrendDto[] = Object.entries(groupedData).map(([key, buData]) => {
        const [month, year] = key.split('-');
        const buArray: ComplianceTrendBu[] = Object.entries(buData).map(([buName, complianceDetails]) => ({
            bu_name: buName,
            compliance: complianceDetails
        }));
        return { month, year, bu: buArray };
    });

    if (dtosToSubmit.length === 0) {
        toast.error("Could not process CSV data into valid trend entries.");
        setIsSubmitting(false);
        return;
    }

    try {
      await withLoading(async () => {
        for (const dto of dtosToSubmit) {
          try {
            dto.bu.forEach(bu => {
                const frameworkNames = bu.compliance.map(c => c.complianceName);
                const requiredFrameworks: Array<ComplianceDetail['complianceName']> = [...FRAMEWORKS_LIST] as any;
                if (
                    frameworkNames.length !== FRAMEWORKS_LIST.length || 
                    !requiredFrameworks.every(f => frameworkNames.includes(f))
                   ) {
                    throw new Error(`BU '${bu.bu_name}' for ${dto.month}-${dto.year} is missing compliance scores or has duplicates.`);
                }
            });

            await createTrendMutation.mutateAsync(dto);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to create compliance trend for ${dto.month}-${dto.year}:`, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} compliance trend entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/cybersecurity-compliance-dashboard/compliance-trends');
        } else {
          toast.error('Failed to create any compliance trends from the bulk upload.');
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
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
           <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard">Cybersecurity & Compliance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard/compliance-trends">Compliance Trends</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="font-semibold text-foreground">Add New Trend</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/cybersecurity-compliance-dashboard/compliance-trends">
          <Button variant="outline" size="icon" aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Compliance Trend Data</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Trend Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        {/* Single Entry Form Updated */}
        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmitSingle}>
              <CardHeader>
                <CardTitle>Add Single Trend Entry</CardTitle>
                <CardDescription>
                  Enter compliance scores for a specific business unit, month, and year.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" value={formData.year} onChange={handleInputChange} placeholder="e.g., 2024" required />
                </div>
                {/* Month Dropdown */}
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
                <div className="space-y-2 md:col-span-2">
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
                 <div className="space-y-2">
                  <Label htmlFor="isoScore">ISO 27001 Score</Label>
                  <Input id="isoScore" name="isoScore" type="number" step="any" value={formData.isoScore} onChange={handleInputChange} placeholder="Enter score" required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="nistScore">NIST CSF Score</Label>
                  <Input id="nistScore" name="nistScore" type="number" step="any" value={formData.nistScore} onChange={handleInputChange} placeholder="Enter score" required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="pdplScore">PDPL Score</Label>
                  <Input id="pdplScore" name="pdplScore" type="number" step="any" value={formData.pdplScore} onChange={handleInputChange} placeholder="Enter score" required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="cisScore">CIS Controls Score</Label>
                  <Input id="cisScore" name="cisScore" type="number" step="any" value={formData.cisScore} onChange={handleInputChange} placeholder="Enter score" required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createTrendMutation.isPending}>
                  {createTrendMutation.isPending ? 'Creating...' : 'Create Trend Entry'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Bulk Upload Form (Logic Updated, UI mostly same) */}
        <TabsContent value="bulk">
           <Card>
             <CardHeader>
               <CardTitle>Bulk Upload Compliance Trends</CardTitle>
               <CardDescription>
                 Upload a CSV file. Required columns: <strong>month, year, bu_name, complianceName, complianceScore</strong>.
                 The <strong>bu_name</strong> must match one of the predefined Business Units. The <strong>month</strong> must be a valid full month name (e.g., January). The <strong>complianceName</strong> must be one of {FRAMEWORKS_LIST.join(', ')}.
                 Each month/year/bu_name combination must have exactly one row for each of the 4 compliance frameworks.
               </CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="csvFile" className="sr-only">Choose CSV File</Label>
                    <Input
                      id="csvFile"
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
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Compliance Name</th>
                             <th className="px-4 py-2 text-left font-medium text-muted-foreground">Score</th>
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-gray-100">
                           {currentPageData.map((row, index) => (
                             <tr key={index}>
                               <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.year}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.bu_name}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.complianceName}</td>
                               <td className="px-4 py-2 whitespace-nowrap">{row.complianceScore}</td>
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
                         {isSubmitting ? 'Submitting...' : `Submit ${csvData.length} Rows`}
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
