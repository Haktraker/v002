'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateUserRiskDistribution } from '@/lib/api/endpoints/security-breach-indicators/user-risk-distribution/user-risk-distribution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateUserRiskDistributionDto } from '@/lib/api/types';
import { ArrowLeft, Upload, Home, Plus, Trash2 } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => (CURRENT_YEAR - 2 + i).toString());
const BU_LIST = ["HO/DR", "CWC", "RAMAT", "EFS", "ETS", "Alrashed Food", "Alrashed Tires", "Jana Marine / Tanajib", "Industrials (Steel, Fast)", "Alrashed Wood", "Admirals", "YAUMI", "BMD", "Saudi Filter", "cement", "Insuwrap", "EFS/ETS", "Ubmksa", "Polystyrene"];

export default function NewUserRiskDistributionPage() {
    const router = useRouter();
    const createUserRiskDistribution = useCreateUserRiskDistribution();
    const { withLoading } = useApiLoading();

    // State for single form
    const [formData, setFormData] = useState<CreateUserRiskDistributionDto>({
        month: '',
        year: '',
        bu: []
    });

    const validateRow = (row: CreateUserRiskDistributionDto) => {
        if (!row.month || !row.year || !row.bu?.length) {
            return {
                isValid: false,
                error: 'Month, year, and at least one business unit are required'
            };
        }

        // Check if all business units have names and valid severity counts
        const invalidBu = row.bu.find(bu => {
            if (!bu.buName) return true;
            if (!bu.severities?.length) return true;
            return false;
        });

        if (invalidBu) {
            return {
                isValid: false,
                error: 'All business units must have a name and severity counts'
            };
        }

        // Check for duplicate BU names in the same month/year
        const buNames = row.bu.map(bu => bu.buName);
        const hasDuplicates = buNames.length !== new Set(buNames).size;
        if (hasDuplicates) {
            return {
                isValid: false,
                error: 'Duplicate business unit names are not allowed for the same month/year'
            };
        }

        return { isValid: true };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form data
        const validation = validateRow(formData);
        if (!validation.isValid) {
            toast.error(validation.error);
            return;
        }

        try {
            await withLoading(async () => {
                await createUserRiskDistribution.mutateAsync(formData);
                toast.success('User risk distribution created successfully');
                router.push('/dashboard/security-breach-indicators/user-risk-distribution');
            });
        } catch (error) {
            console.error('Failed to create user risk distribution:', error);
            toast.error('Failed to create user risk distribution');
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
                        await createUserRiskDistribution.mutateAsync(row);
                        successCount++;
                    } catch (error) {
                        console.error('Failed to create user risk distribution:', error);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    toast.success(`Successfully created ${successCount} user risk distributions${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
                    router.push('/dashboard/security-breach-indicators/user-risk-distribution');
                } else {
                    toast.error('Failed to create any user risk distributions');
                }
            });
        } catch (error) {
            console.error('Bulk submission failed:', error);
            toast.error('Bulk submission process failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddBusinessUnit = () => {
        setFormData(prev => ({
            ...prev,
            bu: [
                ...prev.bu,
                {
                    buName: '',
                    severities: [
                        { severity: 'Critical', count: 0 },
                        { severity: 'High', count: 0 },
                        { severity: 'Medium', count: 0 },
                        { severity: 'Low', count: 0 }
                    ]
                }
            ]
        }));
    };

    const handleRemoveBusinessUnit = (index: number) => {
        setFormData(prev => ({
            ...prev,
            bu: prev.bu.filter((_, i) => i !== index)
        }));
    };

    const handleBuNameChange = (index: number, value: string) => {
        setFormData(prev => {
            const newBu = [...prev.bu];
            newBu[index] = { ...newBu[index], buName: value };
            return { ...prev, bu: newBu };
        });
    };

    const handleSeverityChange = (buIndex: number, severityIndex: number, value: string) => {
        setFormData(prev => {
            const newBu = [...prev.bu];
            if (newBu[buIndex]?.severities?.[severityIndex]) {
                newBu[buIndex].severities[severityIndex].count = parseInt(value) || 0;
            }
            return { ...prev, bu: newBu };
        });
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
    } = useTableData<CreateUserRiskDistributionDto>({
        requiredFields: ['month', 'year', 'bu'],
        validateRow,
    });

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
                        <BreadcrumbLink href="/dashboard/security-breach-indicators">
                            Security Breach Indicators
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/security-breach-indicators/user-risk-distribution">
                            User Risk Distribution
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/security-breach-indicators/user-risk-distribution/new" className="font-semibold">
                            Add New Distribution
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-4 my-6">
                <Link href="/dashboard/security-breach-indicators/user-risk-distribution">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold">Add New User Risk Distribution</h1>
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
                                <CardTitle>Add Single Distribution</CardTitle>
                                <CardDescription>
                                    Enter the details for a single user risk distribution.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="month">Month</Label>
                                        <Select
                                            value={formData.month}
                                            onValueChange={(value) => setFormData({ ...formData, month: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTHS.map((month) => (
                                                    <SelectItem key={month} value={month}>
                                                        {month}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Year</Label>
                                        <Select
                                            value={formData.year}
                                            onValueChange={(value) => setFormData({ ...formData, year: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {YEARS.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Business Units</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddBusinessUnit}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Business Unit
                                        </Button>
                                    </div>

                                    {formData.bu.map((buItem, buIndex) => (
                                        <Card key={buIndex} className="p-4">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex-1">
                                                    <Label htmlFor={`buName-${buIndex}`}>Business Unit Name</Label>
                                                    <Select
                                                        value={buItem.buName}
                                                        onValueChange={(value) => handleBuNameChange(buIndex, value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select business unit" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {BU_LIST.map((bu) => (
                                                                <SelectItem key={bu} value={bu}>
                                                                    {bu}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="mt-6"
                                                    onClick={() => handleRemoveBusinessUnit(buIndex)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {buItem.severities.map((severity, severityIndex) => (
                                                    <div key={severity.severity} className="space-y-2">
                                                        <Label htmlFor={`severity-${buIndex}-${severity.severity}`}>
                                                            {severity.severity}
                                                        </Label>
                                                        <Input
                                                            id={`severity-${buIndex}-${severity.severity}`}
                                                            type="number"
                                                            min="0"
                                                            value={severity.count}
                                                            onChange={(e) => handleSeverityChange(buIndex, severityIndex, e.target.value)}
                                                            placeholder={`Enter ${severity.severity.toLowerCase()} count`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={createUserRiskDistribution.isPending}>
                                    {createUserRiskDistribution.isPending ? 'Creating...' : 'Create Distribution'}
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
                                Upload a CSV file with multiple user risk distributions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <Card className="bg-muted">
                                    <CardHeader>
                                        <CardTitle>CSV File Structure</CardTitle>
                                        <CardDescription>
                                            Your CSV file should follow this structure:
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="font-medium">Required Columns:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm">
                                                <li><code>month</code> - Month name (e.g., January, February)</li>
                                                <li><code>year</code> - Year in YYYY format</li>
                                                <li><code>buName</code> - Business unit name from the predefined list</li>
                                                <li><code>Critical</code> - Number of critical risk users</li>
                                                <li><code>High</code> - Number of high risk users</li>
                                                <li><code>Medium</code> - Number of medium risk users</li>
                                                <li><code>Low</code> - Number of low risk users</li>
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="font-medium">Example CSV Format:</p>
                                            <pre className="bg-background p-4 rounded-md text-xs overflow-x-auto">
                                                month,year,buName,Critical,High,Medium,Low <br />
                                                January,2024,HO/DR,5,10,15,20 <br />
                                                January,2024,CWC,3,8,12,18</pre>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            <p>Notes:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Headers must match exactly as shown above</li>
                                                <li>All fields are required</li>
                                                <li>Risk counts must be non-negative numbers</li>
                                                <li>Business unit names must match the predefined list</li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>

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
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Business Unit
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Severities
                                                        </th>
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
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {row.bu?.[0]?.buName}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {row.bu?.[0]?.severities?.map(s => `${s.severity}: ${s.count}`).join(', ')}
                                                            </td>
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