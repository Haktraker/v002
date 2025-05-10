'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; 
import { useCreateReportsDigitalRiskIntelligence } from '@/lib/api/endpoints/reports/digital-risk-intelligence';
import { CreateReportsDigitalRiskIntelligenceDto, ReportLevel, ReportIndicator } from '@/lib/api/reports-types/types';
import { MONTHS } from '@/lib/constants/months-list'; // Assuming you have this for month dropdown
import { showToast } from '@/lib/utils/toast-utils';

const reportLevelsList = ["no risk", "medium", "high", "critical"] as const;
type ReportLevelTuple = typeof reportLevelsList;

const reportIndicatorsList = ["executive protection", "situational awareness", "impersonations", "social media"] as const;
type ReportIndicatorTuple = typeof reportIndicatorsList;

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString()); // Last 5 years + next 4 years

const formSchema = z.object({
  level: z.enum(reportLevelsList as unknown as ReportLevelTuple, { required_error: "Level is required." }),
  indicator: z.enum(reportIndicatorsList as unknown as ReportIndicatorTuple, { required_error: "Indicator is required." }),
  year: z.string().min(4, { message: "Year must be 4 digits." }).max(4, { message: "Year must be 4 digits." }),
  month: z.string().min(1, { message: "Month is required." }),
});

const NewDigitalRiskIntelligenceReportPage = () => {
  const router = useRouter();
  const createMutation = useCreateReportsDigitalRiskIntelligence();

  const form = useForm<CreateReportsDigitalRiskIntelligenceDto>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: 'no risk',
      indicator: undefined, // Or a default like "executive protection"
      year: new Date().getFullYear().toString(),
      month: MONTHS[new Date().getMonth()], // Default to current month
    },
  });

  const onSubmit = async (values: CreateReportsDigitalRiskIntelligenceDto) => {
    try {
      await createMutation.mutateAsync(values);
      // Toast for success is handled by the hook
      router.push('/dashboard/reports/digital-risk-intelligence');
    } catch (error) {
      // Toast for error is handled by the hook
      console.error("Submission error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Digital Risk Intelligence Report"
        description="Fill in the details to create a new report entry."
        // breadcrumbs={[{ label: 'Digital Risk Intelligence', href: '/dashboard/reports/digital-risk-intelligence' }, { label: 'New' }]}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Provide the specific details for this intelligence report.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="indicator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indicator</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select an indicator" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportIndicatorsList.map(indicator => (
                          <SelectItem key={indicator} value={indicator}>{indicator.charAt(0).toUpperCase() + indicator.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a risk level" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportLevelsList.map(level => (
                          <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTHS.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {/* <Input placeholder="YYYY" {...field} /> // Alternative: Text input */}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/reports/digital-risk-intelligence">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending || form.formState.isSubmitting}>
              {createMutation.isPending ? 'Creating...' : 'Create Report'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewDigitalRiskIntelligenceReportPage;
