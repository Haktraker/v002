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
import { ArrowLeft, Upload } from 'lucide-react';
import { showLoadingToast, showToast } from '@/lib/utils/toast-utils';
import Link from 'next/link';
import { CreateIOCDto } from '@/lib/api/types';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiLoading } from '@/lib/utils/api-utils';

const iocTypeOptions = [
  { value: 'hash', label: 'Hash' },
  { value: 'ip', label: 'IP Address' },
  { value: 'domain', label: 'Domain' },
  { value: 'url', label: 'URL' },
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

  // Form state for single entry
  const [formData, setFormData] = useState<CreateIOCDto>({
    iOCType: '',
    indicatorValue: '',
    threatType: '',
    source: '',
    description: '',
    time: formattedDate,
  });

  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CreateIOCDto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for custom threat type
  const [customThreatType, setCustomThreatType] = useState('');
  const [showCustomThreatType, setShowCustomThreatType] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'threatType') {
      setShowCustomThreatType(value === 'other');
      if (value !== 'other') {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: customThreatType
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCustomThreatTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomThreatType(value);
    setFormData(prev => ({
      ...prev,
      threatType: value
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
          'iOCType', 'indicatorValue', 'threatType', 'source', 'description', 'time'
        ];
        
        // Validate headers
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
          showToast(`CSV is missing required fields: ${missingFields.join(', ')}`, 'error');
          setIsProcessing(false);
          return;
        }
        
        // Parse data rows
        const parsedData: CreateIOCDto[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(value => value.trim());
          
          if (values.length !== headers.length) {
            console.error(`Line ${i+1} has incorrect number of fields`);
            continue;
          }
          
          const entry: any = {};
          let isValid = true;
          
          headers.forEach((header, index) => {
            if (header === 'iOCType') {
              const iocType = values[index].toLowerCase();
              if (!['hash', 'ip', 'domain', 'url'].includes(iocType)) {
                console.error(`Line ${i+1}: Invalid IOC type '${values[index]}'`);
                isValid = false;
              }
              entry[header] = iocType;
            } else {
              entry[header] = values[index];
            }
          });
          
          if (isValid) {
            parsedData.push(entry as CreateIOCDto);
          }
        }
        
        setCsvData(parsedData);
        
        showToast(`Successfully parsed ${parsedData.length} valid IOC entries`, 'success');
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
      showToast('No valid IOC data to submit', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      // Process each entry
      for (const entry of csvData) {
        try {
          await withLoading(createIOC.mutateAsync(entry));
          successCount++;
        } catch (error) {
          console.error('Failed to add entry:', error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showToast(`Successfully added ${successCount} IOC entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
        router.push('/dashboard/threatintelligence/iocs');
      } else {
        showToast('Failed to add any IOC entries', 'error');
      }
    } catch (error) {
      console.error('Bulk import failed:', error);
      showToast('Bulk import process failed', 'error');
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
          <h1 className="text-2xl font-semibold">New IOC</h1>
        </div>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single" className="mt-4">
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
                      value={showCustomThreatType ? 'other' : formData.threatType}
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
                    {showCustomThreatType && (
                      <div className="mt-2">
                        <Input
                          id="customThreatType"
                          placeholder="Enter custom threat type"
                          value={customThreatType}
                          onChange={handleCustomThreatTypeChange}
                          required
                        />
                      </div>
                    )}
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
        </TabsContent>
        
        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import IOCs</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple entries. The file should contain columns for iOCType (hash, ip, domain, url),
                indicatorValue, threatType, source, description, and time (in ISO format).
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IOC Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indicator Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvData.slice(0, 5).map((entry, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.iOCType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.indicatorValue}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.threatType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.time}</td>
                          </tr>
                        ))}
                        {csvData.length > 5 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
                onClick={() => router.push('/dashboard/threatintelligence/iocs')}
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