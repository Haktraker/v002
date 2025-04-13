'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateComplianceScore } from '@/lib/api/endpoints/security-breach-indicators/compliance-scores/compliance-scores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
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

type ComplianceFormData = {
  month: string;
  year: string;
  bu: Array<{
    buName: string;
    compliances: Array<{
      complianceName: string;
      count: number;
    }>;
  }>;
};

const COMPLIANCE_TYPES = ['PCI', 'HIPAA', 'GDRR', 'ISO', 'NIST'];

export default function NewComplianceScorePage() {
  const router = useRouter();
  const createComplianceScore = useCreateComplianceScore();
  const { withLoading } = useApiLoading();
  
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: 5 }, (_, i) => (CURRENT_YEAR - 2 + i).toString());
  const BU_LIST = ["HO/DR", "CWC", "RAMAT", "EFS", "ETS", "Alrashed Food", "Alrashed Tires", "Jana Marine / Tanajib", "Industrials (Steel, Fast)", "Alrashed Wood", "Admirals", "YAUMI", "BMD", "Saudi Filter", "cement", "Insuwrap", "EFS/ETS", "Ubmksa", "Polystyrene"];

  const [formData, setFormData] = useState<ComplianceFormData>({
    month: MONTHS[new Date().getMonth()],
    year: CURRENT_YEAR.toString(),
    bu: []
  });

  const [selectedBU, setSelectedBU] = useState("");
  const [selectedCompliance, setSelectedCompliance] = useState("");
  const [complianceCount, setComplianceCount] = useState(0);

  const validateRow = (row: ComplianceFormData) => {
    if (!row.month || !row.year) {
      return {
        isValid: false,
        error: 'Month and year are required'
      };
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
  } = useTableData<ComplianceFormData>({
    requiredFields: ['month', 'year', 'bu'],
    validateRow,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(async () => {
        await createComplianceScore.mutateAsync(formData);
        toast.success('Compliance score created successfully');
        router.push('/dashboard/security-breach-indicators/compliance-scores');
      });
    } catch (error) {
      console.error('Failed to create compliance score:', error);
      toast.error('Failed to create compliance score');
    }
  };

  const handleBulkSubmit = async () => {
    if (!csvData.length) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      await withLoading(async () => {
        for (const row of csvData) {
          try {
            await createComplianceScore.mutateAsync(row);
            successCount++;
          } catch (error) {
            console.error('Failed to create compliance score:', error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} compliance scores${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/security-breach-indicators/compliance-scores');
        } else {
          toast.error('Failed to create any compliance scores');
        }
      });
    } catch (error) {
      console.error('Bulk submission failed:', error);
      toast.error('Bulk submission process failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplianceChange = (buIndex: number, complianceIndex: number, value: number) => {
    const newFormData = { ...formData };
    newFormData.bu[buIndex].compliances[complianceIndex].count = value;
    setFormData(newFormData);
  };

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
            <BreadcrumbLink href="/dashboard/security-breach-indicators">Security Breach Indicators</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/security-breach-indicators/compliance-scores">Compliance Scores</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/security-breach-indicators/compliance-scores/new" className="font-semibold">
              Add New Score
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/security-breach-indicators/compliance-scores">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Compliance Score</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList>
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Single Compliance Score</CardTitle>
                <CardDescription>
                  Enter the details for a single compliance score entry.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <select
                      id="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      {MONTHS.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <select
                      id="year"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      {YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bu">Business Unit</Label>
                      <select
                        id="bu"
                        value={selectedBU}
                        onChange={(e) => setSelectedBU(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Business Unit</option>
                        {BU_LIST.map((bu) => (
                          <option key={bu} value={bu}>{bu}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compliance">Compliance Type</Label>
                      <select
                        id="compliance"
                        value={selectedCompliance}
                        onChange={(e) => setSelectedCompliance(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Compliance Type</option>
                        {COMPLIANCE_TYPES.filter(type => 
                          !formData.bu.find(b => b.buName === selectedBU)?.compliances.some(c => c.complianceName === type)
                        ).map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="count">Compliance Count</Label>
                    <Input
                      id="count"
                      type="number"
                      value={complianceCount}
                      onChange={(e) => setComplianceCount(parseInt(e.target.value))}
                      min={0}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!selectedBU || !selectedCompliance) {
                        toast.error('Please select both Business Unit and Compliance Type');
                        return;
                      }
                      const existingBUIndex = formData.bu.findIndex(b => b.buName === selectedBU);
                      if (existingBUIndex >= 0) {
                        const newFormData = { ...formData };
                        newFormData.bu[existingBUIndex].compliances.push({
                          complianceName: selectedCompliance,
                          count: complianceCount
                        });
                        setFormData(newFormData);
                      } else {
                        setFormData({
                          ...formData,
                          bu: [...formData.bu, {
                            buName: selectedBU,
                            compliances: [{
                              complianceName: selectedCompliance,
                              count: complianceCount
                            }]
                          }]
                        });
                      }
                      setSelectedCompliance('');
                      setComplianceCount(0);
                    }}
                  >
                    Add Compliance
                  </Button>
                </div>

                {formData.bu.length > 0 && (
                  <div className="space-y-4">
                    <Label>Added Compliances</Label>
                    {formData.bu.map((bu, buIndex) => (
                      <div key={`${bu.buName}-${buIndex}`} className="border p-4 rounded-md">
                        <h3 className="font-medium mb-2">{bu.buName}</h3>
                        {bu.compliances.map((compliance, complianceIndex) => (
                          <div key={`${compliance.complianceName}-${complianceIndex}`} className="flex items-center justify-between py-2">
                            <span>{compliance.complianceName}: {compliance.count}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFormData = { ...formData };
                                newFormData.bu[buIndex].compliances.splice(complianceIndex, 1);
                                if (newFormData.bu[buIndex].compliances.length === 0) {
                                  newFormData.bu.splice(buIndex, 1);
                                }
                                setFormData(newFormData);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createComplianceScore.isPending}>
                  {createComplianceScore.isPending ? 'Creating...' : 'Create Compliance Score'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple compliance scores. Please follow the format instructions below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h3 className="font-medium">CSV File Format Instructions:</h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Required columns: Month, Year, Business Unit, Compliance Name, Count</li>
                    <li>Month format: Full month name (e.g., January, February)</li>
                    <li>Year format: YYYY (e.g., 2024)</li>
                    <li>Business Unit: Must match one of the predefined business units</li>
                    <li>Compliance Name: Must be one of: PCI, HIPAA, GDRR, ISO, NIST</li>
                    <li>Count: Must be a positive number</li>
                  </ul>
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Example CSV Format:</h4>
                    <code className="block bg-background p-2 rounded text-xs">
                      Month,Year,Business Unit,Compliance Name,Count<br/>
                      January,2024,HO/DR,PCI,95<br/>
                      January,2024,HO/DR,HIPAA,88<br/>
                      January,2024,CWC,ISO,92
                    </code>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isProcessing || isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={handleProcessCSV}
                    disabled={!csvFile || isProcessing || isSubmitting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Process CSV
                  </Button>
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Year
                            </th>
                            {COMPLIANCE_TYPES.map(type => (
                              <th key={type} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {type}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.month}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.year}
                              </td>
                              {COMPLIANCE_TYPES.map(type => (
                                <td key={type} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {row.bu[0].compliances.find(c => c.complianceName === type)?.count || 0}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Page {pagination.currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={previousPage}
                          disabled={pagination.currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={nextPage}
                          disabled={pagination.currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={resetData}
                        disabled={isSubmitting}
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit All'}
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