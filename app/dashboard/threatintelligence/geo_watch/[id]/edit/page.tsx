'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetGeoWatchById, useUpdateGeoWatch } from '@/lib/api/endpoints/threat-intelligence';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Link from 'next/link';
import { UpdateGeoWatchDto } from '@/lib/api/types';

const severityOptions = [
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
  { value: 'Info', label: 'Informational' },
];

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Monitoring', label: 'Monitoring' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'False Positive', label: 'False Positive' },
];

const eventTypeOptions = [
  { value: 'Suspicious Activity', label: 'Suspicious Activity' },
  { value: 'Data Breach', label: 'Data Breach' },
  { value: 'DDoS Attack', label: 'DDoS Attack' },
  { value: 'Malware Detection', label: 'Malware Detection' },
  { value: 'Phishing Campaign', label: 'Phishing Campaign' },
  { value: 'Ransomware', label: 'Ransomware' },
  { value: 'Other', label: 'Other' },
];

export default function EditGeoWatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const { data: geoWatch, isLoading, error } = useGetGeoWatchById(id);
  const updateGeoWatch = useUpdateGeoWatch();

  const [formData, setFormData] = useState<UpdateGeoWatchDto>({
    eventType: '',
    location: '',
    country: '',
    region: '',
    detectionTime: '',
    source: '',
    severity: '',
    assetAffected: '',
    customAlertsTriggered: false,
    status: '',
    actionTaken: '',
    commentsNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (geoWatch) {
      // Format the detection time for the datetime-local input
      const detectionTime = geoWatch.detectionTime ? 
        new Date(geoWatch.detectionTime).toISOString().slice(0, 16) : 
        new Date().toISOString().slice(0, 16);

      setFormData({
        eventType: geoWatch.eventType || '',
        location: geoWatch.location || '',
        country: geoWatch.country || '',
        region: geoWatch.region || '',
        detectionTime: detectionTime,
        source: geoWatch.source || '',
        severity: geoWatch.severity || 'Medium',
        assetAffected: geoWatch.assetAffected || '',
        customAlertsTriggered: geoWatch.customAlertsTriggered || false,
        status: geoWatch.status || 'Active',
        actionTaken: geoWatch.actionTaken || '',
        commentsNotes: geoWatch.commentsNotes || ''
      });
    }
  }, [geoWatch]);

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

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateGeoWatch.mutateAsync({ id, ...formData });
      toast.success('Geographic threat watch entry updated successfully');
      router.push('/dashboard/threatintelligence/geo_watch');
    } catch (error) {
      console.error('Failed to update geographic threat watch entry:', error);
      toast.error('Failed to update geographic threat watch entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading Geo Watch data...</div>;
  }

  if (error) {
    return <div className="p-4">Error loading Geo Watch data: {error.message}</div>;
  }

  if (!geoWatch) {
    return <div className="p-4">Geo Watch entry not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/threatintelligence/geo_watch">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Geographic Threat Watch</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => handleSelectChange('eventType', value)}
              required
            >
              <SelectTrigger id="eventType">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City or specific location"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              placeholder="Geographic region"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detectionTime">Detection Time</Label>
            <Input
              id="detectionTime"
              name="detectionTime"
              type="datetime-local"
              value={formData.detectionTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              placeholder="Detection source"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => handleSelectChange('severity', value)}
              required
            >
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity level" />
              </SelectTrigger>
              <SelectContent>
                {severityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetAffected">Asset Affected</Label>
            <Input
              id="assetAffected"
              name="assetAffected"
              value={formData.assetAffected}
              onChange={handleChange}
              placeholder="Affected asset or system"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
              required
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select current status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="customAlertsTriggered"
              checked={formData.customAlertsTriggered}
              onCheckedChange={(checked) => handleCheckboxChange('customAlertsTriggered', checked as boolean)}
            />
            <Label htmlFor="customAlertsTriggered" className="text-sm font-medium leading-none cursor-pointer">
              Custom Alerts Triggered
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actionTaken">Action Taken</Label>
          <Textarea
            id="actionTaken"
            name="actionTaken"
            value={formData.actionTaken}
            onChange={handleChange}
            placeholder="Describe actions taken in response to this threat"
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commentsNotes">Comments & Notes</Label>
          <Textarea
            id="commentsNotes"
            name="commentsNotes"
            value={formData.commentsNotes}
            onChange={handleChange}
            placeholder="Additional information or context about this threat"
            className="min-h-[100px]"
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/threatintelligence/geo_watch')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Geographic Threat Watch'}
          </Button>
        </div>
      </form>
    </div>
  );
}
