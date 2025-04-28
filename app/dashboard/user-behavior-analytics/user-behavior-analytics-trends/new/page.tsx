'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateUserBehaviorAnalytics } from '@/lib/api/endpoints/user-behavior-analytics/user-behavior-analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreateUserBehaviorAnalyticsDto } from '@/lib/api/types';
import { ArrowLeft, Home, Upload } from 'lucide-react';
import Link from 'next/link';
import { useApiLoading } from '@/lib/utils/api-utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS } from '@/lib/constants/months-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTableData } from '@/hooks/useTableData';

// Define a type for the form state to handle number inputs potentially being strings
type FormDataState = {
  year: string;
  month: string;
  criticalAlerts: string;
  AvgRiskScore: string;
  suspiciousUsers: string;
  dataAccessAnomalies: string;
  networkAnomalies: string;
  responseTime: string;
};

// Define expected CSV Headers/DTO keys for useTableData
const requiredFields: (keyof CreateUserBehaviorAnalyticsDto)[] = [
    'year', 'month', 'criticalAlerts', 'AvgRiskScore', 'suspiciousUsers',
    'dataAccessAnomalies', 'networkAnomalies', 'responseTime'
];

export default function NewUserBehaviorAnalyticsPage() {
  const router = useRouter();
  const createUBA = useCreateUserBehaviorAnalytics();
  const { withLoading } = useApiLoading();

  // State for single record form
  const [formData, setFormData] = useState<FormDataState>({
    year: '',
    month: '',
    criticalAlerts: '',
    AvgRiskScore: '',
    suspiciousUsers: '',
    dataAccessAnomalies: '',
    networkAnomalies: '',
    responseTime: '',
  });

  // Validation function for CSV rows
  const validateRow = (row: CreateUserBehaviorAnalyticsDto) => {
    // Check year format
    if (!/^\d{4}$/.test(String(row.year))) {
      return { isValid: false, error: `Invalid Year format: ${row.year}. Must be 4 digits.` };
    }
    // Check month validity (case-insensitive)
    if (!MONTHS.some(m => m.toLowerCase() === String(row.month).toLowerCase())) {
        return { isValid: false, error: `Invalid Month: ${row.month}.` };
    }
    // Check if numeric fields are valid numbers (handle potential strings from CSV)
    const numericFields: (keyof CreateUserBehaviorAnalyticsDto)[] = [
        'criticalAlerts', 'AvgRiskScore', 'suspiciousUsers',
        'dataAccessAnomalies', 'networkAnomalies', 'responseTime'
    ];
    for (const field of numericFields) {
        const value = row[field];
        if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
            return { isValid: false, error: `Invalid number for ${field}: ${value}.` };
        }
    }
    return { isValid: true };
  };

  // Table data handling with custom hook for bulk upload
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
    goToPage,
  } = useTableData<CreateUserBehaviorAnalyticsDto>({
    requiredFields: requiredFields,
    validateRow,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      // Store raw value; conversion happens on submit
      [id]: value,
    }));
  };

  // Handler specifically for the month Select component
  const handleMonthChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      month: value,
    }));
  };

  // Handler for single record submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Explicitly assert type to potentially help linter
    const currentFormData: FormDataState = formData;

    // Parse numeric fields AFTER validation
    const yearNum = parseInt(currentFormData.year, 10);
    const criticalAlertsNum = parseInt(currentFormData.criticalAlerts, 10);
    const avgRiskScoreNum = parseInt(currentFormData.AvgRiskScore, 10);
    const suspiciousUsersNum = parseInt(currentFormData.suspiciousUsers, 10);
    const dataAccessAnomaliesNum = parseInt(currentFormData.dataAccessAnomalies, 10);
    const networkAnomaliesNum = parseInt(currentFormData.networkAnomalies, 10);
    const responseTimeNum = parseInt(currentFormData.responseTime, 10);

    // Simple validation for required fields
    if (!currentFormData.year || !currentFormData.month) {
      toast.error('Year and Month are required.');
      return;
    }

    // Validation for numeric fields (check for empty string before NaN check)
    if (currentFormData.criticalAlerts === '' || isNaN(criticalAlertsNum) ||
        currentFormData.AvgRiskScore === '' || isNaN(avgRiskScoreNum) ||
        currentFormData.suspiciousUsers === '' || isNaN(suspiciousUsersNum) ||
        currentFormData.dataAccessAnomalies === '' || isNaN(dataAccessAnomaliesNum) ||
        currentFormData.networkAnomalies === '' || isNaN(networkAnomaliesNum) ||
        currentFormData.responseTime === '' || isNaN(responseTimeNum)) {
      toast.error('Please ensure all numeric fields contain valid numbers and are not empty.');
      return;
    }

    // Construct the DTO with parsed numbers
    const dto: CreateUserBehaviorAnalyticsDto = {
      year: yearNum.toString(),
      month: currentFormData.month,
      criticalAlerts: criticalAlertsNum,
      AvgRiskScore: avgRiskScoreNum,
      suspiciousUsers: suspiciousUsersNum,
      dataAccessAnomalies: dataAccessAnomaliesNum,
      networkAnomalies: networkAnomaliesNum,
      responseTime: responseTimeNum,
    };

    try {
      await withLoading(async () => {
        await createUBA.mutateAsync(dto);
        // Toast is handled by the hook's onSuccess
        router.push('/dashboard/user-behavior-analytics/user-behavior-analytics-trends');
      });
    } catch (error) {
      // Error toast is handled by the hook's onError, but console log might be useful
      console.error('Failed to create UBA record:', error);
      // Optionally add a generic fallback toast here if the hook doesn't cover all cases
      // toast.error('Failed to create record. Please try again.');
    }

    // Reset form data
    setFormData({
      year: '',
      month: '',
      criticalAlerts: '',
      AvgRiskScore: '',
      suspiciousUsers: '',
      dataAccessAnomalies: '',
      networkAnomalies: '',
      responseTime: '',
    });
  };

  // Handler for bulk record submission
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
          // Prepare DTO: Convert numeric fields from string (as read by CSV parser) to numbers
          const dto: CreateUserBehaviorAnalyticsDto = {
              year: String(row.year), // Ensure year is string
              month: String(row.month), // Ensure month is string
              criticalAlerts: Number(row.criticalAlerts),
              AvgRiskScore: Number(row.AvgRiskScore),
              suspiciousUsers: Number(row.suspiciousUsers),
              dataAccessAnomalies: Number(row.dataAccessAnomalies),
              networkAnomalies: Number(row.networkAnomalies),
              responseTime: Number(row.responseTime),
          };

          // Re-validate just before submission (optional, but good practice)
          const validationResult = validateRow(dto);
          if (!validationResult.isValid) {
              console.error(`Skipping row due to error: ${validationResult.error}`, row);
              errorCount++;
              continue; // Skip this row
          }

          try {
            await createUBA.mutateAsync(dto);
            successCount++;
          } catch (error) {
            console.error('Failed to create UBA record:', error, 'Row:', row);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} UBA records${errorCount > 0 ? `, ${errorCount} failed` : ''}.`);
          router.push('/dashboard/user-behavior-analytics/user-behavior-analytics-trends');
        } else if (errorCount > 0) {
          toast.error('Failed to create any UBA records. Check console for details.');
        } else {
            toast.info("No records were processed.") // Should not happen if csvData has length
        }
      });
    } catch (error) {
      console.error('Bulk submission process failed:', error);
      toast.error('Bulk submission process failed. Check console for details.');
    } finally {
      setIsSubmitting(false);
      resetData(); // Clear data after submission attempt
    }
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
            <BreadcrumbLink href="/dashboard/user-behavior-analytics">
                User Behavior Analytics
            </BreadcrumbLink>
          </BreadcrumbItem>
           <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/user-behavior-analytics/user-behavior-analytics-trends">
              UBA Trends
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/user-behavior-analytics/user-behavior-analytics-trends/new" className="font-semibold">
              Add New Record
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/user-behavior-analytics/user-behavior-analytics-trends">
          <Button variant="outline" size="icon" aria-label="Go back to UBA Trends">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New UBA Record</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList>
          <TabsTrigger value="single">Single Record</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Single UBA Record Details</CardTitle>
                <CardDescription>
                  Enter the details for one User Behavior Analytics record.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="Enter year (e.g., 2024)"
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select
                    value={formData.month}
                    onValueChange={handleMonthChange}
                    required
                  >
                    <SelectTrigger id="month" aria-label="Select month" aria-required="true">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((monthName) => (
                        <SelectItem key={monthName} value={monthName}>
                          {monthName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="criticalAlerts">Critical Alerts</Label>
                  <Input
                    id="criticalAlerts"
                    type="number"
                    value={formData.criticalAlerts}
                    onChange={handleInputChange}
                    placeholder="Enter number of critical alerts"
                    required
                    min="0"
                    aria-required="true"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="AvgRiskScore">Average Risk Score</Label>
                  <Input
                    id="AvgRiskScore"
                    type="number"
                    step="any"
                    value={formData.AvgRiskScore}
                    onChange={handleInputChange}
                    placeholder="Enter average risk score"
                    required
                    min="0"
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suspiciousUsers">Suspicious Users</Label>
                  <Input
                    id="suspiciousUsers"
                    type="number"
                    value={formData.suspiciousUsers}
                    onChange={handleInputChange}
                    placeholder="Enter number of suspicious users"
                    required
                    min="0"
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataAccessAnomalies">Data Access Anomalies</Label>
                  <Input
                    id="dataAccessAnomalies"
                    type="number"
                    value={formData.dataAccessAnomalies}
                    onChange={handleInputChange}
                    placeholder="Enter number of data access anomalies"
                    required
                    min="0"
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="networkAnomalies">Network Anomalies</Label>
                  <Input
                    id="networkAnomalies"
                    type="number"
                    value={formData.networkAnomalies}
                    onChange={handleInputChange}
                    placeholder="Enter number of network anomalies"
                    required
                    min="0"
                    aria-required="true"
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="responseTime">Response Time (ms)</Label>
                  <Input
                    id="responseTime"
                    type="number"
                    value={formData.responseTime}
                    onChange={handleInputChange}
                    placeholder="Enter average response time in milliseconds"
                    required
                    min="0"
                    aria-required="true"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={createUBA.isPending}>
                  {createUBA.isPending ? 'Creating...' : 'Create Record'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
           <Card>
            <CardHeader>
              <CardTitle>Bulk Upload UBA Records</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple UBA records. Required columns: {requiredFields.join(', ')}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isProcessing || isSubmitting}
                    aria-label="CSV file input"
                  />
                  <Button
                    type="button"
                    onClick={handleProcessCSV}
                    disabled={!csvFile || isProcessing || isSubmitting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Process CSV'}
                  </Button>
                </div>

                {csvData.length > 0 && !isProcessing && (
                  <div className="space-y-4">
                    <p>Previewing {currentPageData.length} of {csvData.length} processed records.</p>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Critical Alerts</TableHead>
                            <TableHead>Avg Risk Score</TableHead>
                            <TableHead>Suspicious Users</TableHead>
                            <TableHead>Data Access Anomalies</TableHead>
                            <TableHead>Network Anomalies</TableHead>
                            <TableHead>Response Time (ms)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentPageData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{String(row.year)}</TableCell>
                              <TableCell>{String(row.month)}</TableCell>
                              <TableCell>{String(row.criticalAlerts)}</TableCell>
                              <TableCell>{String(row.AvgRiskScore)}</TableCell>
                              <TableCell>{String(row.suspiciousUsers)}</TableCell>
                              <TableCell>{String(row.dataAccessAnomalies)}</TableCell>
                              <TableCell>{String(row.networkAnomalies)}</TableCell>
                              <TableCell>{String(row.responseTime)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Page {pagination.currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={previousPage}
                          disabled={pagination.currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                           size="sm"
                          onClick={nextPage}
                          disabled={pagination.currentPage === totalPages}
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
                        Reset / Cancel
                      </Button>
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={isSubmitting || csvData.length === 0}
                      >
                        {isSubmitting ? 'Submitting...' : `Submit ${csvData.length} Records`}
                      </Button>
                    </div>
                  </div>
                )}
                 {isProcessing && <p>Processing CSV file...</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
