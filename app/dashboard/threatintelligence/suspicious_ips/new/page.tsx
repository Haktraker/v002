'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateSuspiciousIP } from '@/lib/api/endpoints/threat-intelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload } from 'lucide-react';
import { showLoadingToast, showToast } from '@/lib/utils/toast-utils';
import Link from 'next/link';
import { CreateSuspiciousIPDto } from '@/lib/api/types';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApiLoading } from '@/lib/utils/api-utils';
import { PageContainer } from '@/components/layout/page-container';

export default function NewSuspiciousIPPage() {
  const router = useRouter();
  const createSuspiciousIP = useCreateSuspiciousIP();
  const { withLoading } = useApiLoading();
  
  // Get current date and time in ISO format
  const today = new Date();
  const formattedDate = format(today, "yyyy-MM-dd'T'HH:mm");

  // Form state for single entry
  const [formData, setFormData] = useState<CreateSuspiciousIPDto>({
    value: '',
    source: '',
    description: '',
    time: formattedDate,
  });

  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CreateSuspiciousIPDto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
    setIsSubmitting(true);

    try {
      await withLoading(async () => {
        await createSuspiciousIP.mutateAsync(formData);
        showToast('Suspicious IP entry created successfully', 'success');
        router.push('/dashboard/threatintelligence/suspicious_ips');
      });
    } catch (error) {
      console.error('Error creating suspicious IP:', error);
      showToast('Failed to create suspicious IP', 'error');
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
          'value', 'source', 'description', 'time'
        ];
        
        // Validate headers
        const missingFields = requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
          showToast(`CSV is missing required fields: ${missingFields.join(', ')}`, 'error');
          setIsProcessing(false);
          return;
        }
        
        // Parse data rows
        const parsedData: CreateSuspiciousIPDto[] = [];
        
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
            entry[header] = values[index];
          });
          
          parsedData.push(entry as CreateSuspiciousIPDto);
        }
        
        setCsvData(parsedData);
        
        showToast(`Successfully parsed ${parsedData.length} valid Suspicious IP entries`, 'success');
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
      showToast('No valid Suspicious IP data to submit', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await withLoading(async () => {
        let successCount = 0;
        let errorCount = 0;
        
        // Process each entry
        for (const entry of csvData) {
          try {
            await createSuspiciousIP.mutateAsync(entry);
            successCount++;
          } catch (error) {
            console.error('Failed to add entry:', error);
            errorCount++;
          }
        }
        
        if (successCount > 0) {
          showToast(`Successfully added ${successCount} Suspicious IP entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`, 'success');
          router.push('/dashboard/threatintelligence/suspicious_ips');
        } else {
          showToast('Failed to add any Suspicious IP entries', 'error');
        }
      });
    } catch (error) {
      console.error('Bulk import failed:', error);
      showToast('Bulk import process failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/threatintelligence/suspicious_ips">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Add Suspicious IP</h1>
        </div>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Suspicious IP Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">IP Address</Label>
                    <Input
                      id="value"
                      name="value"
                      value={formData.value}
                      onChange={handleChange}
                      placeholder="192.168.1.1"
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
                      placeholder="Threat Intel Provider"
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
                    placeholder="Information about the suspicious activity"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    Create Suspicious IP
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="advanced" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Suspicious IPs</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple entries. The file should contain columns for value (IP address), source,
                description, and time (in ISO format).
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvData.slice(0, 5).map((entry, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.source}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.time}</td>
                          </tr>
                        ))}
                        {csvData.length > 5 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
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
                onClick={() => router.push('/dashboard/threatintelligence/suspicious_ips')}
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
    </PageContainer>
  );
}