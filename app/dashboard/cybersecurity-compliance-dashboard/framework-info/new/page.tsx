'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateFrameworkInfo } from '@/lib/api/endpoints/cybersecurity-compliance-dashboard/framework-info';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    CreateFrameworkInfoDto,
    FrameworkDetail,
    FrameworkBuDetail,
    MitigationPlan,
    FrameworkName,
    FrameworkBuStatus,
    FrameworkSeverity
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
import { MONTHS } from '@/lib/constants/months-list';
import { FRAMEWORK_NAMES, FRAMEWORK_BU_STATUSES, FRAMEWORK_SEVERITIES } from '@/lib/constants/framework-info-constants';
import { BU_LIST } from '@/lib/constants/bu-list'; // Re-use if applicable
import { Progress } from '@/components/ui/progress';

// Define ValidationResult interface locally
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Define the expected structure for a row in the CSV after parsing
// This structure needs careful design based on how nested data is represented flatly.
// Option 1: One row per BU detail, repeating month/year/framework info.
interface CsvRowData {
    month: string;
    year: string;
    frame_work_name: FrameworkName;
    frame_work_header: string;
    frame_work_subtitle: string;
    bu_name: string;
    bu_id: string;
    bu_status: FrameworkBuStatus;
    gap_discription: string;
    affected_systems: string; // Comma-separated string
    severity: FrameworkSeverity;
    // Mitigation Plan fields
    short_term_actions: string;
    long_term_strategy: string;
    time_line: string;
    budget: string;
    progress: string; // PapaParse reads numbers as strings
    required_resources: string;
}

export default function NewFrameworkInfoPage() {
    const router = useRouter();
    const createMutation = useCreateFrameworkInfo();
    const { withLoading } = useApiLoading();
    const currentYear = new Date().getFullYear();

    // --- State for Single Entry Form ---
    const initialBuDetail: FrameworkBuDetail = {
        bu_name: '', bu_id: '', bu_status: 'Non-Compliant', gap_discription: '',
        affected_systems: [], severity: 'Medium' as unknown as FrameworkSeverity,
        mitigation_plan: { short_term_actions: '', long_term_strategy: '', time_line: '', budget: '', progress: 0, required_resources: '' }
    };
    const initialFrameworkDetail: FrameworkDetail = {
        frame_work_name: 'ISO 27001', frame_work_header: '', frame_work_subtitle: '', bu: [initialBuDetail]
    };
    const [formData, setFormData] = useState<CreateFrameworkInfoDto>({
        month: MONTHS[new Date().getMonth()],
        year: currentYear.toString(),
        frameWorks: [initialFrameworkDetail],
    });

    // --- Form Handlers (Single Entry) ---
    const handleFormChange = (field: keyof CreateFrameworkInfoDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFrameworkChange = (fwIndex: number, field: keyof FrameworkDetail, value: any) => {
        const updatedFrameworks = [...formData.frameWorks];
        (updatedFrameworks[fwIndex] as any)[field] = value;
        setFormData(prev => ({ ...prev, frameWorks: updatedFrameworks }));
    };

    const handleBuChange = (fwIndex: number, buIndex: number, field: keyof FrameworkBuDetail | keyof MitigationPlan | 'affected_systems_string', value: any) => {
        const updatedFrameworks = [...formData.frameWorks];
        const targetBu = updatedFrameworks[fwIndex].bu[buIndex];

        if (field in targetBu.mitigation_plan) {
            // Handle mitigation plan changes
            if (field === 'progress') {
                (targetBu.mitigation_plan as any)[field] = parseInt(value, 10) || 0;
            } else {
                (targetBu.mitigation_plan as any)[field] = value;
            }
        } else if (field === 'affected_systems_string') {
             targetBu.affected_systems = value.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
        } else if (field in targetBu) {
            // Handle direct BU changes
            (targetBu as any)[field] = value;
        }

        setFormData(prev => ({ ...prev, frameWorks: updatedFrameworks }));
    };

    const addFrameworkField = () => {
        setFormData(prev => ({
            ...prev,
            frameWorks: [...prev.frameWorks, { ...initialFrameworkDetail, bu: [{ ...initialBuDetail }] }],
        }));
    };

    const removeFrameworkField = (fwIndex: number) => {
        if (formData.frameWorks.length <= 1) return; // Keep at least one framework
        setFormData(prev => ({
            ...prev,
            frameWorks: prev.frameWorks.filter((_, i) => i !== fwIndex),
        }));
    };

    const addBuField = (fwIndex: number) => {
        const updatedFrameworks = [...formData.frameWorks];
        updatedFrameworks[fwIndex].bu.push({ ...initialBuDetail });
        setFormData(prev => ({ ...prev, frameWorks: updatedFrameworks }));
    };

    const removeBuField = (fwIndex: number, buIndex: number) => {
        const updatedFrameworks = [...formData.frameWorks];
        if (updatedFrameworks[fwIndex].bu.length <= 1) return; // Keep at least one BU per framework
        updatedFrameworks[fwIndex].bu = updatedFrameworks[fwIndex].bu.filter((_, i) => i !== buIndex);
        setFormData(prev => ({ ...prev, frameWorks: updatedFrameworks }));
    };

    // --- Validation (Single Entry) ---
    const validateSingleEntry = (): boolean => {
        if (!formData.month || !formData.year) {
            toast.error("Month and Year are required.");
            return false;
        }
        for (const fw of formData.frameWorks) {
            if (!fw.frame_work_name || !fw.frame_work_header) {
                toast.error(`Framework Name and Header are required for all frameworks.`);
                return false;
            }
            if (!fw.bu || fw.bu.length === 0) {
                 toast.error(`At least one Business Unit is required for framework: ${fw.frame_work_header}`);
                return false;
            }
            for (const bu of fw.bu) {
                if (!bu.bu_name || !bu.bu_id || !bu.gap_discription || !bu.mitigation_plan.short_term_actions || !bu.mitigation_plan.long_term_strategy || !bu.mitigation_plan.time_line || !bu.mitigation_plan.budget || !bu.mitigation_plan.required_resources) {
                    toast.error(`All fields (BU Name, ID, Gap, Mitigation details) are required for BU: ${bu.bu_name || '(New BU)'} under ${fw.frame_work_header}.`);
                    return false;
                }
                if (bu.affected_systems.length === 0) {
                     toast.error(`Affected Systems cannot be empty for BU: ${bu.bu_name} under ${fw.frame_work_header}.`);
                    return false;
                }
                 if (isNaN(bu.mitigation_plan.progress) || bu.mitigation_plan.progress < 0 || bu.mitigation_plan.progress > 100) {
                    toast.error(`Progress must be between 0 and 100 for BU: ${bu.bu_name} under ${fw.frame_work_header}.`);
                    return false;
                }
            }
        }
        return true;
    };

    // --- Submission (Single Entry) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateSingleEntry()) return;

        try {
            await withLoading(async () => {
                await createMutation.mutateAsync(formData);
                toast.success('Framework Info entry created successfully');
                router.push('/dashboard/cybersecurity-compliance-dashboard/framework-info');
            });
        } catch (error) {
            console.error('Failed to create entry:', error);
            // More specific error from API response if available
            const apiError = error as any;
            const message = apiError?.response?.data?.message || 'Failed to create entry';
            toast.error(message);
        }
    };

    // --- Bulk Upload Logic ---
    const validateCsvRow = (row: CsvRowData): ValidationResult => {
        // Basic presence checks
        const requiredFields: (keyof CsvRowData)[] = [
            'month', 'year', 'frame_work_name', 'frame_work_header', 'frame_work_subtitle', 'bu_name',
             'bu_id', 'bu_status', 'gap_discription', 'affected_systems', 'severity', 'short_term_actions',
             'long_term_strategy', 'time_line', 'budget', 'progress', 'required_resources'
        ];
        for (const field of requiredFields) {
            if (!row[field]) {
                // Use a generic row identifier since index is removed
                return { isValid: false, error: `Missing value for ${field} in one row` }; 
            }
        }

        // Type/Enum checks - use generic row identifier in errors
        if (!MONTHS.includes(row.month)) return { isValid: false, error: `Invalid month: ${row.month} in one row` };
        if (isNaN(parseInt(row.year)) || row.year.length !== 4) return { isValid: false, error: `Invalid year: ${row.year} in one row` };
        if (!FRAMEWORK_NAMES.includes(row.frame_work_name)) return { isValid: false, error: `Invalid framework name: ${row.frame_work_name} in one row` };
        if (!FRAMEWORK_BU_STATUSES.includes(row.bu_status)) return { isValid: false, error: `Invalid BU status: ${row.bu_status} in one row` };
        if (!FRAMEWORK_SEVERITIES.includes(row.severity)) return { isValid: false, error: `Invalid severity: ${row.severity} in one row` };
        const progress = parseInt(row.progress, 10);
        if (isNaN(progress) || progress < 0 || progress > 100) return { isValid: false, error: `Invalid progress value: ${row.progress} in one row` };

        return { isValid: true };
    };

    const { data: csvData, isProcessing, isSubmitting, csvFile, handleFileChange, handleProcessCSV, resetData, setIsSubmitting, currentPageData, pagination, totalPages, nextPage, previousPage } = useTableData<CsvRowData>({
        requiredFields: [ // List required CSV headers here
            'month', 'year', 'frame_work_name', 'frame_work_header', 'frame_work_subtitle', 'bu_name',
             'bu_id', 'bu_status', 'gap_discription', 'affected_systems', 'severity', 'short_term_actions',
             'long_term_strategy', 'time_line', 'budget', 'progress', 'required_resources'
         ],
        validateRow: validateCsvRow,
    });

    const handleBulkSubmit = async () => {
        if (!csvData.length) {
            toast.error('No processed data to submit');
            return;
        }

        setIsSubmitting(true);
        let successCount = 0;
        let errorCount = 0;

        // Group validated CSV rows into CreateFrameworkInfoDto structure
        const groupedData = csvData.reduce<Record<string, CreateFrameworkInfoDto>>((acc, row) => {
            const key = `${row.month}-${row.year}`;
            if (!acc[key]) {
                acc[key] = { month: row.month, year: row.year, frameWorks: [] };
            }

            let framework = acc[key].frameWorks.find(fw => fw.frame_work_name === row.frame_work_name && fw.frame_work_header === row.frame_work_header);
            if (!framework) {
                framework = {
                    frame_work_name: row.frame_work_name,
                    frame_work_header: row.frame_work_header,
                    frame_work_subtitle: row.frame_work_subtitle,
                    bu: [],
                };
                acc[key].frameWorks.push(framework);
            }

            // Avoid adding duplicate BU details if CSV structure allows it
            if (!framework.bu.some(bu => bu.bu_id === row.bu_id)) {
                 framework.bu.push({
                    bu_name: row.bu_name,
                    bu_id: row.bu_id,
                    bu_status: row.bu_status,
                    gap_discription: row.gap_discription,
                    affected_systems: row.affected_systems.split(',').map(s => s.trim()).filter(s => s !== ''),
                    severity: row.severity as unknown as FrameworkSeverity,
                    mitigation_plan: {
                        short_term_actions: row.short_term_actions,
                        long_term_strategy: row.long_term_strategy,
                        time_line: row.time_line,
                        budget: row.budget,
                        progress: parseInt(row.progress, 10),
                        required_resources: row.required_resources,
                    },
                });
            }

            return acc;
        }, {});

        const entriesToSubmit = Object.values(groupedData);

        try {
            await withLoading(async () => {
                for (const entry of entriesToSubmit) {
                    // Remove duplicate validation call inside the loop
                    // Validation is already done via useTableData hook
                    // if (!validateSingleEntry()) { ... }
                    try {
                        await createMutation.mutateAsync(entry);
                        successCount++;
                    } catch (error) {
                         const apiError = error as any;
                         const message = apiError?.response?.data?.message || `Failed to create entry for ${entry.month}/${entry.year}`;
                        console.error(message, error);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    toast.success(`Successfully created ${successCount} Framework Info entries${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`);
                    router.push('/dashboard/cybersecurity-compliance-dashboard/framework-info');
                } else if (errorCount > 0) {
                    toast.error(`Failed to create ${errorCount} Framework Info entries.`);
                } else {
                    toast.info("No entries were submitted.");
                }
            });
        } catch (error) {
            console.error('Bulk submission process failed:', error);
            toast.error('Bulk submission process failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Component ---
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
                        <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard/framework-info">Framework Information</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/cybersecurity-compliance-dashboard/framework-info/new" className="font-semibold">
                            Add New Entry
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-4 my-6">
                <Link href="/dashboard/cybersecurity-compliance-dashboard/framework-info">
                    <Button variant="outline" size="icon" aria-label="Go back">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold">Add New Framework Information Entry</h1>
            </div>

             <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Entry</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
                </TabsList>

                {/* Single Entry Tab */}
                <TabsContent value="single">
                    <Card>
                        <form onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle>Add Single Framework Info Entry</CardTitle>
                                <CardDescription>
                                    Enter the compliance details for a specific month and year, including frameworks and business units.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Month and Year Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="month">Month</Label>
                                        <Select
                                            value={formData.month}
                                            onValueChange={(value) => handleFormChange('month', value)}
                                        >
                                            <SelectTrigger id="month">
                                                <SelectValue placeholder="Select month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Year</Label>
                                        <Input
                                            id="year"
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => handleFormChange('year', e.target.value)}
                                            placeholder={`Enter year (e.g., ${currentYear})`}
                                            required
                                            min={currentYear - 10}
                                            max={currentYear + 1}
                                        />
                                    </div>
                                </div>

                                {/* Frameworks Section */}
                                <div className="space-y-4">
                                    <Label className="text-lg font-semibold">Frameworks</Label>
                                    {formData.frameWorks.map((fwItem, fwIndex) => (
                                        <Card key={fwIndex} className="border p-4 rounded-md relative bg-muted/20">
                                            <CardHeader className="p-0 mb-4 flex flex-row justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">Framework #{fwIndex + 1}</CardTitle>
                                                    {/* <CardDescription>Details for this framework.</CardDescription> */} 
                                                </div>
                                                {formData.frameWorks.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive absolute top-2 right-2 h-7 w-7"
                                                        onClick={() => removeFrameworkField(fwIndex)}
                                                        aria-label="Remove Framework entry"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </Button>
                                                )}
                                            </CardHeader>
                                            <CardContent className="p-0 space-y-4">
                                                {/* Framework Details */}
                                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`fwName-${fwIndex}`}>Framework Name</Label>
                                                         <Select
                                                            value={fwItem.frame_work_name}
                                                            onValueChange={(value) => handleFrameworkChange(fwIndex, 'frame_work_name', value)}
                                                        >
                                                            <SelectTrigger id={`fwName-${fwIndex}`}>
                                                                <SelectValue placeholder="Select Framework" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {FRAMEWORK_NAMES.map((name: string) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`fwHeader-${fwIndex}`}>Header</Label>
                                                        <Input
                                                            id={`fwHeader-${fwIndex}`}
                                                            value={fwItem.frame_work_header}
                                                            onChange={(e) => handleFrameworkChange(fwIndex, 'frame_work_header', e.target.value)}
                                                            placeholder="e.g., A.9.4.1 Access Control"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`fwSubtitle-${fwIndex}`}>Subtitle</Label>
                                                        <Input
                                                            id={`fwSubtitle-${fwIndex}`}
                                                            value={fwItem.frame_work_subtitle}
                                                            onChange={(e) => handleFrameworkChange(fwIndex, 'frame_work_subtitle', e.target.value)}
                                                            placeholder="e.g., Information Access Restriction"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Business Units within Framework */}
                                                <div className="space-y-3 pl-4 border-l-2 border-border ml-1">
                                                    <Label className="text-md font-semibold">Business Units</Label>
                                                    {fwItem.bu.map((buItem, buIndex) => (
                                                         <Card key={buIndex} className="border p-4 rounded-md relative bg-background shadow-sm">
                                                            <CardHeader className="p-0 mb-4 flex flex-row justify-between items-start">
                                                                <CardTitle className="text-sm">BU #{buIndex + 1} ({buItem.bu_name || 'New BU'})</CardTitle>
                                                                {fwItem.bu.length > 1 && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive hover:text-destructive absolute top-1 right-1 h-6 w-6"
                                                                        onClick={() => removeBuField(fwIndex, buIndex)}
                                                                        aria-label="Remove Business Unit entry"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                             </CardHeader>
                                                            <CardContent className="p-0 space-y-4">
                                                                {/* BU Details */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                     <div className="space-y-2">
                                                                        <Label htmlFor={`buName-${fwIndex}-${buIndex}`}>BU Name</Label>
                                                                         <Select
                                                                            value={buItem.bu_name}
                                                                            onValueChange={(value) => handleBuChange(fwIndex, buIndex, 'bu_name', value)}
                                                                        >
                                                                            <SelectTrigger id={`buName-${fwIndex}-${buIndex}`}>
                                                                                <SelectValue placeholder="Select BU" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {BU_LIST.map(bu => <SelectItem key={bu} value={bu}>{bu}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`buId-${fwIndex}-${buIndex}`}>BU ID</Label>
                                                                        <Input id={`buId-${fwIndex}-${buIndex}`} value={buItem.bu_id} onChange={(e) => handleBuChange(fwIndex, buIndex, 'bu_id', e.target.value)} placeholder="e.g., ISO-HO-941-1" required />
                                                                    </div>
                                                                     <div className="space-y-2">
                                                                        <Label htmlFor={`buStatus-${fwIndex}-${buIndex}`}>Status</Label>
                                                                         <Select
                                                                            value={buItem.bu_status as unknown as string}
                                                                            onValueChange={(value) => handleBuChange(fwIndex, buIndex, 'bu_status', value as unknown as FrameworkBuStatus)}
                                                                        >
                                                                            <SelectTrigger id={`buStatus-${fwIndex}-${buIndex}`}>
                                                                                <SelectValue placeholder="Select Status" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {FRAMEWORK_BU_STATUSES.map((s: FrameworkBuStatus) => (
                                                                                    <SelectItem key={s as unknown as string} value={s as unknown as string}>{`${s}`}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                                 <div className="space-y-2">
                                                                    <Label htmlFor={`gapDesc-${fwIndex}-${buIndex}`}>Gap Description</Label>
                                                                    <Textarea id={`gapDesc-${fwIndex}-${buIndex}`} value={buItem.gap_discription} onChange={(e) => handleBuChange(fwIndex, buIndex, 'gap_discription', e.target.value)} placeholder="Describe the compliance gap..." required />
                                                                </div>
                                                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                     <div className="space-y-2">
                                                                        <Label htmlFor={`affSystems-${fwIndex}-${buIndex}`}>Affected Systems (comma-separated)</Label>
                                                                        <Input id={`affSystems-${fwIndex}-${buIndex}`} value={buItem.affected_systems.join(', ')} onChange={(e) => handleBuChange(fwIndex, buIndex, 'affected_systems_string', e.target.value)} placeholder="e.g., ERP, CRM, Billing" required />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`severity-${fwIndex}-${buIndex}`}>Severity</Label>
                                                                         <Select
                                                                            value={buItem.severity as unknown as string}
                                                                            onValueChange={(value) => handleBuChange(fwIndex, buIndex, 'severity', value as unknown as FrameworkSeverity)}
                                                                        >
                                                                            <SelectTrigger id={`severity-${fwIndex}-${buIndex}`}>
                                                                                <SelectValue placeholder="Select Severity" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {FRAMEWORK_SEVERITIES.map((s: FrameworkSeverity) => (
                                                                                     <SelectItem key={s as unknown as string} value={s as unknown as string}>{`${s}`}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                {/* Mitigation Plan */}
                                                                <div className="space-y-3 pt-3 border-t border-border">
                                                                     <Label className="text-base font-semibold">Mitigation Plan</Label>
                                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                             <Label htmlFor={`mit-short-${fwIndex}-${buIndex}`}>Short-term Actions</Label>
                                                                             <Textarea id={`mit-short-${fwIndex}-${buIndex}`} value={buItem.mitigation_plan.short_term_actions} onChange={(e) => handleBuChange(fwIndex, buIndex, 'short_term_actions', e.target.value)} placeholder="Immediate steps..." required />
                                                                         </div>
                                                                         <div className="space-y-2">
                                                                             <Label htmlFor={`mit-long-${fwIndex}-${buIndex}`}>Long-term Strategy</Label>
                                                                             <Textarea id={`mit-long-${fwIndex}-${buIndex}`} value={buItem.mitigation_plan.long_term_strategy} onChange={(e) => handleBuChange(fwIndex, buIndex, 'long_term_strategy', e.target.value)} placeholder="Overall approach..." required />
                                                                         </div>
                                                                         <div className="space-y-2">
                                                                             <Label htmlFor={`mit-timeline-${fwIndex}-${buIndex}`}>Timeline</Label>
                                                                             <Input id={`mit-timeline-${fwIndex}-${buIndex}`} value={buItem.mitigation_plan.time_line} onChange={(e) => handleBuChange(fwIndex, buIndex, 'time_line', e.target.value)} placeholder="e.g., 3 months" required />
                                                                         </div>
                                                                          <div className="space-y-2">
                                                                             <Label htmlFor={`mit-budget-${fwIndex}-${buIndex}`}>Budget</Label>
                                                                             <Input id={`mit-budget-${fwIndex}-${buIndex}`} value={buItem.mitigation_plan.budget} onChange={(e) => handleBuChange(fwIndex, buIndex, 'budget', e.target.value)} placeholder="e.g., $10,000" required />
                                                                         </div>
                                                                          <div className="space-y-2">
                                                                             <Label htmlFor={`mit-resources-${fwIndex}-${buIndex}`}>Required Resources</Label>
                                                                             <Input id={`mit-resources-${fwIndex}-${buIndex}`} value={buItem.mitigation_plan.required_resources} onChange={(e) => handleBuChange(fwIndex, buIndex, 'required_resources', e.target.value)} placeholder="e.g., IT Team, Security Tools" required />
                                                                         </div>
                                                                          <div className="space-y-2">
                                                                             <Label htmlFor={`mit-progress-${fwIndex}-${buIndex}`}>Progress (%)</Label>
                                                                             <Input id={`mit-progress-${fwIndex}-${buIndex}`} type="number" min="0" max="100" value={buItem.mitigation_plan.progress} onChange={(e) => handleBuChange(fwIndex, buIndex, 'progress', e.target.value)} placeholder="0-100" required />
                                                                             <Progress value={buItem.mitigation_plan.progress} className="h-2 mt-1"/>
                                                                         </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                    <Button type="button" variant="outline" size="sm" onClick={() => addBuField(fwIndex)} className="mt-2 w-full sm:w-auto">
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Business Unit to Framework #{fwIndex + 1}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={addFrameworkField} className="mt-4 w-full sm:w-auto">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Another Framework
                                    </Button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? 'Creating...' : 'Create Framework Info Entry'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                {/* Bulk Upload Tab */}
                <TabsContent value="bulk">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bulk Upload via CSV</CardTitle>
                            <CardDescription>
                                Upload a CSV file with columns for each field in the flattened structure (one row per BU). Required columns:
                                <code className="font-mono bg-muted px-1 rounded text-xs block mt-1 break-words">month, year, frame_work_name, frame_work_header, frame_work_subtitle, bu_name, bu_id, bu_status, gap_discription, affected_systems, severity, short_term_actions, long_term_strategy, time_line, budget, progress, required_resources</code>.
                                Ensure enum values match allowed options (e.g., Status: '{FRAMEWORK_BU_STATUSES.join(', ')}').
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="csv-upload">Upload CSV File</Label>
                                        <Input
                                            id="csv-upload"
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            disabled={isProcessing || isSubmitting}
                                            className="cursor-pointer file:cursor-pointer"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleProcessCSV}
                                        disabled={!csvFile || isProcessing || isSubmitting}
                                        className="w-full sm:w-auto mt-4 sm:mt-0"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {isProcessing ? 'Processing...' : 'Process CSV'}
                                    </Button>
                                </div>

                                {csvData.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Preview Data (Page {pagination.currentPage} of {totalPages})</h3>
                                        <div className="border rounded-lg overflow-x-auto">
                                            {/* Simple Table for Preview - Adjust columns as needed */}
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Header</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BU Name</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BU ID</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gap (Truncated)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {currentPageData.map((row, index) => (
                                                        <tr key={`${row.month}-${row.year}-${row.frame_work_name}-${row.bu_id}-${index}`}>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm">{row.month}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm">{row.year}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm">{row.frame_work_name}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm truncate max-w-xs">{row.frame_work_header}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm">{row.bu_name}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm">{row.bu_id}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm">{row.bu_status}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm">{`${row.severity}`}</td>
                                                            <td className="px-2 py-2 whitespace-nowrap text-sm truncate max-w-xs">{row.gap_discription}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-muted-foreground">
                                                Total Valid Rows: {csvData.length}
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
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={nextPage}
                                                    disabled={pagination.currentPage === totalPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={resetData}
                                disabled={isSubmitting || csvData.length === 0}
                            >
                                Reset
                            </Button>
                            <Button
                                onClick={handleBulkSubmit}
                                disabled={isSubmitting || csvData.length === 0 || isProcessing}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit All Entries'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
