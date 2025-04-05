'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIOC } from '@/lib/api/endpoints/threat-intelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { showLoadingToast } from '@/lib/utils/toast-utils';
import Link from 'next/link';
import { CreateIOCDto } from '@/lib/api/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiLoading } from '@/lib/utils/api-utils';

const iocTypeOptions = [
  { value: 'ip', label: 'IP Address' },
  { value: 'domain', label: 'Domain' },
  { value: 'url', label: 'URL' },
  { value: 'hash', label: 'File Hash' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

const threatTypeOptions = [
  { value: 'malware', label: 'Malware' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'ransomware', label: 'Ransomware' },
  { value: 'apt', label: 'APT' },
  { value: 'ddos', label: 'DDoS' },
  { value: 'other', label: 'Other' },
];

export default function NewIOCPage() {
  const router = useRouter();
  const createIOC = useCreateIOC();
  const { withLoading } = useApiLoading();
  
  // Get current date and time in ISO format
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd'T'HH:mm");

  // Form state
  const [formData, setFormData] = useState<CreateIOCDto>({
    iOCType: '',
    indicatorValue: '',
    threatType: '',
    source: '',
    description: '',
    time: formattedDate,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await showLoadingToast(
        withLoading(createIOC.mutateAsync(formData)),
        {
          loading: 'Creating IOC entry...',
          success: 'IOC entry created successfully',
          error: 'Failed to create IOC entry',
        }
      );
      router.push('/dashboard/threatintelligence/iocs');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/threatintelligence/iocs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">New Indicator of Compromise</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create IOC Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iOCType">IOC Type</Label>
                <Select
                  value={formData.iOCType}
                  onValueChange={(value) => handleSelectChange('iOCType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select IOC type" />
                  </SelectTrigger>
                  <SelectContent>
                    {iocTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indicatorValue">Indicator Value</Label>
                <Input
                  id="indicatorValue"
                  name="indicatorValue"
                  value={formData.indicatorValue}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threatType">Threat Type</Label>
                <Select
                  value={formData.threatType}
                  onValueChange={(value) => handleSelectChange('threatType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select threat type" />
                  </SelectTrigger>
                  <SelectContent>
                    {threatTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="datetime-local"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                Create IOC
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}