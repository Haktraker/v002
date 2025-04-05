'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateThreatNews } from '@/lib/api/endpoints/threat-intelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateThreatNewsDto } from '@/lib/api/types';
import { useApiLoading } from '@/lib/utils/api-utils';
import { format } from 'date-fns';
import { showToast } from '@/lib/utils/toast-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewThreatNewsPage() {
  const router = useRouter();
  const createThreatNews = useCreateThreatNews();
  const { withLoading } = useApiLoading();
  
  // Get current date and time in ISO format
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd'T'HH:mm");

  const [formData, setFormData] = useState<CreateThreatNewsDto>({
    threatType: '',
    description: '',
    time: formattedDate
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(async () => {
        await createThreatNews.mutateAsync(formData);
        showToast('Threat news created successfully', 'success');
        router.push('/dashboard/threatintelligence/threat_news');
      });
    } catch (error) {
      console.error('Failed to create threat news:', error);
      showToast('Failed to create threat news', 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/threatintelligence/threat_news">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">New Threat News</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Threat News Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threatType">Threat Type</Label>
                <Input
                  id="threatType"
                  name="threatType"
                  value={formData.threatType}
                  onChange={handleChange}
                  placeholder="Enter threat type"
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
                placeholder="Provide detailed description of the threat news"
                className="min-h-[200px]"
                required
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/threatintelligence/threat_news')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Threat News'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}