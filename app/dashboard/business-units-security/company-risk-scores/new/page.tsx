'use client';

import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/layout/page-container';
import { useCreateCompanyRiskScore } from '@/lib/api/endpoints/business-units-security/company-risk-scores';
import { CreateCompanyRiskScoreDto } from '@/lib/api/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';

// Validation Schema
const buSchema = z.object({
  name: z.string().min(1, 'Business unit name is required'),
  count: z.coerce.number().int().min(0, 'Count must be a non-negative integer'),
});

const schema = z.object({
  month: z.string().min(1, 'Month is required').regex(/^\d{1,2}$/, 'Month must be 1 or 2 digits'),
  year: z.string().min(4, 'Year must be 4 digits').regex(/^\d{4}$/, 'Year must be 4 digits'),
  bus: z.array(buSchema).min(1, 'At least one business unit is required'),
});

type FormData = z.infer<typeof schema>;

export default function NewCompanyRiskScorePage() {
  const router = useRouter();
  const createMutation = useCreateCompanyRiskScore();

  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      month: '',
      year: '',
      bus: [{ name: '', count: 0 }], // Start with one BU entry
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bus',
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync(data as CreateCompanyRiskScoreDto);
      toast.success('Company Risk Score created successfully!');
      reset(); // Reset form after successful submission
      router.push('/dashboard/business-units-security/company-risk-scores'); // Navigate back to the list
    } catch (error) {
      // Error handling is done within the mutation hook
      console.error("Submission error:", error);
    }
  };

  return (
    <PageContainer>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Company Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Month Input */}
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input 
                  id="month" 
                  type="number"
                  placeholder="e.g., 1 for January" 
                  {...register('month')} 
                  aria-invalid={errors.month ? "true" : "false"}
                  className={errors.month ? 'border-destructive' : ''}
                />
                {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
              </div>

              {/* Year Input */}
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input 
                  id="year" 
                  type="number"
                  placeholder="e.g., 2024" 
                  {...register('year')} 
                  aria-invalid={errors.year ? "true" : "false"}
                  className={errors.year ? 'border-destructive' : ''}
                />
                {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
              </div>
            </div>

            {/* Dynamic Business Units Array */}
            <div className="space-y-4">
              <Label>Business Units</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3 p-3 border rounded-md relative">
                  <div className="grid grid-cols-2 gap-3 flex-grow">
                    <div className="space-y-1">
                      <Label htmlFor={`bus.${index}.name`} className="text-xs">Name</Label>
                      <Input 
                        id={`bus.${index}.name`}
                        placeholder="BU Name" 
                        {...register(`bus.${index}.name`)} 
                        aria-invalid={errors.bus?.[index]?.name ? "true" : "false"}
                        className={errors.bus?.[index]?.name ? 'border-destructive' : ''}
                      />
                       {errors.bus?.[index]?.name && <p className="text-xs text-destructive">{errors.bus?.[index]?.name?.message}</p>}
                    </div>
                    <div className="space-y-1">
                       <Label htmlFor={`bus.${index}.count`} className="text-xs">Risk Count</Label>
                      <Input 
                        id={`bus.${index}.count`}
                        type="number" 
                        placeholder="Count" 
                        {...register(`bus.${index}.count`)} 
                        aria-invalid={errors.bus?.[index]?.count ? "true" : "false"}
                         className={errors.bus?.[index]?.count ? 'border-destructive' : ''}
                      />
                       {errors.bus?.[index]?.count && <p className="text-xs text-destructive">{errors.bus?.[index]?.count?.message}</p>}
                    </div>
                  </div>
                   {fields.length > 1 && (
                     <Button
                       type="button"
                       variant="ghost"
                       size="icon"
                       onClick={() => remove(index)}
                       className="h-8 w-8 text-destructive hover:bg-destructive/10"
                       aria-label={`Remove Business Unit ${index + 1}`}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   )}
                 </div>
               ))}
               {errors.bus?.root && <p className="text-sm text-destructive">{errors.bus.root.message}</p>}
               {errors.bus?.message && <p className="text-sm text-destructive">{errors.bus.message}</p>} 
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', count: 0 })}
                className="mt-2"
                aria-label="Add Business Unit"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Business Unit
              </Button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Score Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
