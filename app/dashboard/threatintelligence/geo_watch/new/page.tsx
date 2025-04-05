'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateGeoWatch } from '@/lib/api/endpoints/threat-intelligence';
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
import { ArrowLeft, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { showLoadingToast, showToast } from '@/lib/utils/toast-utils';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CreateGeoWatchDto } from '@/lib/api/types';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiLoading } from '@/lib/utils/api-utils';

const severityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const statusOptions = [
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'investigating', label: 'Investigating' },
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

export default function NewGeoWatchPage() {
  const router = useRouter();
  const createGeoWatch = useCreateGeoWatch();
  const { withLoading } = useApiLoading();
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd'T'HH:mm");

  // State for single form
  const [formData, setFormData] = useState<CreateGeoWatchDto>({
    eventType: '',
    location: '',
    country: '',
    region: '',
    time: formattedDate,
    source: '',
    severity: 'medium',
    assetAffected: '',
    customAlertsTriggered: false,
    status: 'unresolved',
    actionTaken: '',
    commentsNotes: ''
  });

  // Custom event type for when "Other" is selected
  const [customEventType, setCustomEventType] = useState('');
  const [showCustomEventType, setShowCustomEventType] = useState(false);

  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CreateGeoWatchDto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'eventType' && value === 'Other') {
      setShowCustomEventType(true);
    } else if (name === 'eventType') {
      setShowCustomEventType(false);
    }
    
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

    // If "Other" is selected and custom event type is provided, use that instead
    const dataToSubmit = {
      ...formData,
      eventType: formData.eventType === 'Other' && customEventType ? customEventType : formData.eventType
    };

    try {
      await showLoadingToast(
        withLoading(createGeoWatch.mutateAsync(dataToSubmit)),
        {
          loading: 'Creating geographic threat watch entry...',
          success: 'Geographic threat watch entry created successfully',
          error: 'Failed to create geographic threat watch entry',
        }
      );
      router.push('/dashboard/threatintelligence/geo_watch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setCsvData([]);
    }
  };

  // Parse CSV file
  const parseCSV = () => {
    if (!csvFile) {
      showToast('Please select a CSV file first', 'error');
      return;
    }
    
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        
        // Get headers from first line
        const headers = lines[0].split(',').map(header => header.trim());
        
        const requiredFields = [
          'eventType', 'location', 'country', 'region', 
          'time', 'source', 'severity', 'status'
        ];
        
        // Validate headers
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
          showToast(`CSV is missing required fields: ${missingFields.join(', ')}`, 'error');
          setIsProcessing(false);
          return;
        }
        
        // Parse data rows
        const parsedData: CreateGeoWatchDto[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(value => value.trim());
          
          if (values.length !== headers.length) {
            console.error(`Line ${i+1} has incorrect number of fields`);
            continue;
          }
          
          const entry: any = {};
          
          headers.forEach((header, index) => {
            if (header === 'customAlertsTriggered') {
              entry[header] = values[index].toLowerCase() === 'true';
            } else {
              entry[header] = values[index];
            }
          });
          
          parsedData.push(entry as CreateGeoWatchDto);
        }
        
        setCsvData(parsedData);
        
        showToast(`Successfully parsed ${parsedData.length} valid Geo Watch entries`, 'success');
      } catch (error) {
        console.error('Error parsing CSV:', error);
        showToast('Failed to parse CSV file. Please check the format.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      showToast('Failed to read the file', 'error');
      setIsProcessing(false);
    };
    
    reader.readAsText(csvFile);
  };

  // Submit all parsed CSV data
  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      showToast('No valid Geo Watch data to submit', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Process each entry
      for (const entry of csvData) {
        try {
          await withLoading(createGeoWatch.mutateAsync(entry));
          successCount++;
        } catch (error) {
          console.error('Failed to add entry:', error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showToast(`Successfully added ${successCount} Geo Watch entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
        router.push('/dashboard/threatintelligence/geo_watch');
      } else {
        showToast('Failed to add any Geo Watch entries', 'error');
      }
    } catch (error) {
      console.error('Bulk import failed:', error);
      showToast('Bulk import process failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/threatintelligence/geo_watch">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add Geographic Threat Watch</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="mt-4">
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
                {showCustomEventType && (
                  <div className="mt-2">
                    <Input
                      id="customEventType"
                      value={customEventType}
                      onChange={(e) => setCustomEventType(e.target.value)}
                      placeholder="Enter custom event type"
                      required
                    />
                  </div>
                )}
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
                    <SelectValue placeholder="Select status" />
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

              <div className="space-y-2">
                <Label htmlFor="actionTaken">Action Taken</Label>
                <Input
                  id="actionTaken"
                  name="actionTaken"
                  value={formData.actionTaken}
                  onChange={handleChange}
                  placeholder="Actions taken to address the threat"
                />
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="customAlertsTriggered"
                  checked={formData.customAlertsTriggered}
                  onCheckedChange={(checked) => handleCheckboxChange('customAlertsTriggered', checked as boolean)}
                />
                <Label htmlFor="customAlertsTriggered" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Custom Alerts Triggered
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commentsNotes">Comments/Notes</Label>
              <Textarea
                id="commentsNotes"
                name="commentsNotes"
                value={formData.commentsNotes}
                onChange={handleChange}
                placeholder="Additional comments or notes"
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
                {isSubmitting ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Geo Watch Entries</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple entries. The file should contain columns for eventType, location, country, region,
                time, source, severity, assetAffected, customAlertsTriggered, status, actionTaken, and commentsNotes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csvFile">CSV File</Label>
                <Input 
                  id="csvFile" 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isProcessing || isSubmitting}
                />
              </div>
              
              <Button 
                type="button" 
                onClick={parseCSV}
                disabled={!csvFile || isProcessing || isSubmitting}
                className="mt-2"
              >
                {isProcessing ? 'Processing...' : 'Process CSV'}
              </Button>
              
              {csvData.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">Preview ({csvData.length} entries)</h3>
                  <div className="mt-2 border rounded max-h-[300px] overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvData.slice(0, 5).map((entry, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.eventType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.country}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.severity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.status}</td>
                          </tr>
                        ))}
                        {csvData.length > 5 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              ... and {csvData.length - 5} more entries
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/threatintelligence/geo_watch')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={csvData.length === 0 || isSubmitting}
              >
                {isSubmitting ? `Creating Entries (${csvData.length})...` : `Import ${csvData.length} Entries`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}