'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreateSupplyChainThreatExposure } from '@/lib/api/endpoints/reports/supply-chain-threat-exposure';
import { CreateSupplyChainThreatExposureDto, SeverityLevel } from '@/lib/api/reports-types/types';

const SEVERITY_LEVELS: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

const NewSupplyChainThreatExposurePage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<CreateSupplyChainThreatExposureDto>>({
    chain: '',
    severity: undefined,
    month: '',
    year: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateSupplyChainThreatExposure();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, severity: value as SeverityLevel }));
    if (errors.severity) {
      setErrors(prev => ({ ...prev, severity: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.chain?.trim()) {
      newErrors.chain = 'Chain/Asset is required.';
    }
    if (!formData.severity) {
      newErrors.severity = 'Severity is required.';
    }
    // Optional: Add validation for month/year if specific formats are needed
    // e.g., if (formData.year && !/^^\d{4}$/.test(formData.year)) newErrors.year = 'Invalid year format.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      return;
    }

    const payload: CreateSupplyChainThreatExposureDto = {
      chain: formData.chain!,
      severity: formData.severity!,
      month: formData.month?.trim() || undefined, // Send undefined if empty
      year: formData.year?.trim() || undefined,   // Send undefined if empty
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Supply Chain Threat Exposure record created successfully!');
      router.push('/dashboard/reports/supply-chain-threat-exposure');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create record. Please try again.';
      toast.error(errorMessage);
      console.error('Failed to create record:', error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/reports/supply-chain-threat-exposure">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Create New Supply Chain Record</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Details</CardTitle>
          <CardDescription>Fill in the details for the new supply chain threat exposure record.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="chain">Chain/Asset <span className="text-destructive">*</span></Label>
              <Input 
                id="chain" 
                name="chain" 
                value={formData.chain || ''} 
                onChange={handleInputChange} 
                placeholder="e.g., Supplier XYZ, Software ABC"
                className={errors.chain ? 'border-destructive' : ''}
              />
              {errors.chain && <p className="text-sm text-destructive mt-1">{errors.chain}</p>}
            </div>

            <div>
              <Label htmlFor="severity">Severity <span className="text-destructive">*</span></Label>
              <Select 
                name="severity" 
                value={formData.severity || ''} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className={errors.severity ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.severity && <p className="text-sm text-destructive mt-1">{errors.severity}</p>}
            </div>

            <div>
              <Label htmlFor="month">Month (Optional)</Label>
              <Input 
                id="month" 
                name="month" 
                value={formData.month || ''} 
                onChange={handleInputChange} 
                placeholder="e.g., January, 01, Mar"
              />
              {/* Add month validation error display if needed */}
            </div>

            <div>
              <Label htmlFor="year">Year (Optional)</Label>
              <Input 
                id="year" 
                name="year" 
                value={formData.year || ''} 
                onChange={handleInputChange} 
                placeholder="e.g., 2024"
                type="text" // Keep as text to allow flexible input, or change to number with validation
              />
              {/* Add year validation error display if needed */}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Link href="/dashboard/reports/supply-chain-threat-exposure">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewSupplyChainThreatExposurePage;
