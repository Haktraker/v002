'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateThreatNews, useGetThreatNewsById } from '@/lib/api/endpoints/threat-intelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { UpdateThreatNewsDto } from '@/lib/api/types';
import { useApiLoading } from '@/lib/utils/api-utils';

interface EditThreatNewsPageProps {
  params: {
    id: string;
  };
}

export default function EditThreatNewsPage({ params }: EditThreatNewsPageProps) {
  const { id } = params;
  const router = useRouter();
  const updateThreatNews = useUpdateThreatNews();
  const { data: threatNewsData, isLoading, error } = useGetThreatNewsById(id);
  const { withLoading } = useApiLoading();

  const [formData, setFormData] = useState<UpdateThreatNewsDto>({
    threatType: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (threatNewsData) {
      setFormData({
        threatType: threatNewsData.threatType,
        description: threatNewsData.description
      });
    }
  }, [threatNewsData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      toast.promise(
        withLoading(updateThreatNews.mutateAsync({ id, ...formData })),
        {
          loading: 'Updating threat news entry...',
          success: 'Threat news entry updated successfully',
          error: 'Failed to update threat news entry',
        }
      );
      
      await updateThreatNews.mutateAsync({ id, ...formData });
      router.push('/dashboard/threatintelligence/threat_news');
    } catch (error) {
      console.error('Failed to update threat news entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full p-6">
        <div className="flex flex-col items-center gap-2">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading threat news data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline">
            <Link href="/dashboard/threatintelligence/threat_news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-red-500">Error Loading Threat News</h1>
        </div>
        <p className="text-muted-foreground">Failed to load threat news data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/threatintelligence/threat_news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Threat News</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
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
            {isSubmitting ? 'Updating...' : 'Update Threat News'}
          </Button>
        </div>
      </form>
    </div>
  );
}
