'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAPTFeed } from '@/lib/api/endpoints/threat-intelligence';
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
import { CreateAPTFeedDto } from '@/lib/api/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiLoading } from '@/lib/utils/api-utils';

export default function NewAPTFeedPage() {
  const router = useRouter();
  const createAPTFeed = useCreateAPTFeed();
  const { withLoading } = useApiLoading();
  
  // Get current date and time in ISO format
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd'T'HH:mm");

  // Form state
  const [formData, setFormData] = useState<CreateAPTFeedDto>({
    aptGroupName: '',
    threatType: '',
    ttps: '',
    targetSectors: '',
    geographicFocus: '',
    iocs: '',
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
        withLoading(createAPTFeed.mutateAsync(formData)),
        {
          loading: 'Creating APT feed entry...',
          success: 'APT feed entry created successfully',
          error: 'Failed to create APT feed entry',
        }
      );
      router.push('/dashboard/threatintelligence/apt_feeds');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/threatintelligence/apt_feeds">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">New APT Feed</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create APT Feed Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aptGroupName">APT Group Name</Label>
                <Input
                  id="aptGroupName"
                  name="aptGroupName"
                  value={formData.aptGroupName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="threatType">Threat Type</Label>
                <Input
                  id="threatType"
                  name="threatType"
                  value={formData.threatType}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetSectors">Target Sectors</Label>
                <Input
                  id="targetSectors"
                  name="targetSectors"
                  value={formData.targetSectors}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geographicFocus">Geographic Focus</Label>
                <Input
                  id="geographicFocus"
                  name="geographicFocus"
                  value={formData.geographicFocus}
                  onChange={handleChange}
                />
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
              <Label htmlFor="ttps">TTPs</Label>
              <Textarea
                id="ttps"
                name="ttps"
                value={formData.ttps}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iocs">IOCs</Label>
              <Textarea
                id="iocs"
                name="iocs"
                value={formData.iocs}
                onChange={handleChange}
                rows={3}
              />
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
                Create APT Feed
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}