'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateThreatIntelligenceFeed } from '@/lib/api/endpoints/threat-intelligence';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PageContainer } from '@/components/layout/page-container';
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
import Link from 'next/link';
import { CreateThreatIntelligenceFeedDto } from '@/lib/api/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiLoading } from '@/lib/utils/api-utils';

const severityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const threatTypeOptions = [
  { value: 'malware', label: 'Malware' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'ransomware', label: 'Ransomware' },
  { value: 'apt', label: 'APT' },
  { value: 'ddos', label: 'DDoS' },
  { value: 'other', label: 'Other' },
];

export default function NewThreatFeedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createThreatFeed = useCreateThreatIntelligenceFeed();
  const { withLoading } = useApiLoading();
  
  // Get current date and time in ISO format
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd'T'HH:mm");

  // Form state
  const [formData, setFormData] = useState<CreateThreatIntelligenceFeedDto>({
    threatType: '',
    severity: 'medium',
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await withLoading(async () => {
        await createThreatFeed.mutateAsync(formData);
        toast({
          title: "Success",
          description: "Threat feed created successfully",
        });
        router.push('/dashboard/threatintelligence/threat_feeds');
      });
    } catch (error) {
      console.error('Error creating threat feed:', error);
      toast({
        title: "Error",
        description: "Failed to create threat feed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/threatintelligence/threat_feeds">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Add Threat Feed</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Threat Feed Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => handleSelectChange('severity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((option) => (
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
                Create Threat Feed
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}