'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateRiskScoreDistribution } from '@/lib/api/endpoints/user-behavior-analytics/user-risk-score-distributions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner'; // Direct import is fine, showToast wrapper can be used too
import { CreateRiskScoreDistributionDto } from '@/lib/api/types';
import { ArrowLeft, Home } from 'lucide-react';
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

// Define a type for the form state to handle number inputs potentially being strings
type RiskScoreFormDataState = {
  year: string;
  month: string;
  low: string;
  medium: string;
  high: string;
  critical: string;
};

export default function NewRiskScoreDistributionPage() {
  const router = useRouter();
  const createRiskScoreDistribution = useCreateRiskScoreDistribution();
  const { withLoading } = useApiLoading();

  // Use the FormDataState type for useState
  const [formData, setFormData] = useState<RiskScoreFormDataState>({
    year: '', 
    month: '',
    low: '', 
    medium: '',   
    high: '', 
    critical: '', 
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse numeric fields
    const yearNum = parseInt(formData.year, 10);
    const lowNum = parseInt(formData.low, 10);
    const mediumNum = parseInt(formData.medium, 10);
    const highNum = parseInt(formData.high, 10);
    const criticalNum = parseInt(formData.critical, 10);

    // Simple validation for required fields and numbers
    if (!formData.year || !formData.month || 
        formData.low === '' || formData.medium === '' || 
        formData.high === '' || formData.critical === '') {
      toast.error('All fields are required.');
      return;
    }

    if (isNaN(yearNum) || isNaN(lowNum) || isNaN(mediumNum) || 
        isNaN(highNum) || isNaN(criticalNum)) {
      toast.error('Please ensure all numeric fields contain valid numbers.');
      return;
    }
    
    // Validate year format (optional but good)
    if (formData.year.length !== 4 || yearNum < 1000 || yearNum > 9999) { 
        toast.error('Year must be a valid 4-digit number.');
        return;
    }

    // Construct the DTO with parsed numbers
    const dto: CreateRiskScoreDistributionDto = {
      year: formData.year, // DTO expects string year
      month: formData.month,
      low: lowNum,
      medium: mediumNum,
      high: highNum,
      critical: criticalNum,
    };

    try {
      await withLoading(async () => {
        await createRiskScoreDistribution.mutateAsync(dto);
        // Assuming success toast is handled by the hook
        router.push('/dashboard/user-behavior-analytics/user-risk-score-distributions'); // Navigate to the list page
      });
      
      // Reset form data upon successful navigation triggered by the hook's onSuccess 
      // (or place reset logic within the hook's onSuccess if preferred)
       setFormData({ 
          year: '', month: '', low: '', medium: '', high: '', critical: '' 
       });

    } catch (error) {
      // Error toast is likely handled by the hook's onError
      console.error('Failed to create Risk Score Distribution record:', error);
      // Fallback toast can be added here if needed
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
            {/* Link to the parent page */}
            <BreadcrumbLink href="/dashboard/user-behavior-analytics/user-risk-score-distributions">
              User Risk Score Distributions
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
             {/* Current Page */}
            <BreadcrumbLink href="/dashboard/user-behavior-analytics/user-risk-score-distributions/new" className="font-semibold">
              Add New Distribution
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
         {/* Back button to the parent page */}
        <Link href="/dashboard/user-behavior-analytics/user-risk-score-distributions">
          <Button variant="outline" size="icon" aria-label="Go back to User Risk Score Distributions">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Risk Score Distribution</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Distribution Details</CardTitle>
            <CardDescription>
              Enter the distribution counts for each risk score level for a specific month and year.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year Input */}
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
             {/* Month Select */}
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
            {/* Low Input */}
            <div className="space-y-2">
              <Label htmlFor="low">Low Count</Label>
              <Input
                id="low"
                type="number"
                value={formData.low}
                onChange={handleInputChange}
                placeholder="Enter count for Low risk"
                required
                min="0"
                aria-required="true"
              />
            </div>
            {/* Medium Input */}
            <div className="space-y-2">
              <Label htmlFor="medium">Medium Count</Label>
              <Input
                id="medium"
                type="number"
                value={formData.medium}
                onChange={handleInputChange}
                placeholder="Enter count for Medium risk"
                required
                min="0"
                aria-required="true"
              />
            </div>
            {/* High Input */}
            <div className="space-y-2">
              <Label htmlFor="high">High Count</Label>
              <Input
                id="high"
                type="number"
                value={formData.high}
                onChange={handleInputChange}
                placeholder="Enter count for High risk"
                required
                min="0"
                aria-required="true"
              />
            </div>
             {/* Critical Input */}
            <div className="space-y-2">
              <Label htmlFor="critical">Critical Count</Label>
              <Input
                id="critical"
                type="number"
                value={formData.critical}
                onChange={handleInputChange}
                placeholder="Enter count for Critical risk"
                required
                min="0"
                aria-required="true"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={createRiskScoreDistribution.isPending}>
              {createRiskScoreDistribution.isPending ? 'Creating...' : 'Create Distribution Record'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
