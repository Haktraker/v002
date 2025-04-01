'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIPSAsset } from '@/lib/api/endpoints/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { CreateIPSDto } from '@/lib/api/types';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewIPPage() {
  const router = useRouter();
  const createIPSAsset = useCreateIPSAsset();
  
  // State for single IP form
  const [formData, setFormData] = useState<CreateIPSDto>({
    value: '',
    location: '',
    description: '',
  });
  
  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CreateIPSDto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle single IP submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createIPSAsset.mutateAsync(formData);
      toast({
        title: 'Success',
        description: 'IP asset created successfully',
      });
      router.push('/dashboard/assets/ips');
    } catch (error) {
      console.error('Failed to create IP asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to create IP asset',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: 'Please select a CSV file first',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setIsProcessing(false);
        return;
      }
      
      try {
        // Split by lines and remove empty lines
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        // Check if there's a header row (first row)
        const firstLine = lines[0].toLowerCase();
        const hasHeader = firstLine.includes('value') || 
                          firstLine.includes('ip') || 
                          firstLine.includes('location') || 
                          firstLine.includes('description');
        
        // Start from index 1 if header exists, otherwise from 0
        const startIndex = hasHeader ? 1 : 0;
        
        const parsedData: CreateIPSDto[] = [];
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const values = line.split(',').map(val => val.trim());
          
          // Assuming CSV format: value,location,description
          // If fewer columns, we'll use defaults
          const ipData: CreateIPSDto = {
            value: values[0] || '',
            location: values[1] || 'Unknown',
            description: values[2] || '',
          };
          
          // Basic validation for IP format
          if (ipData.value && /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ipData.value)) {
            parsedData.push(ipData);
          }
        }
        
        setCsvData(parsedData);
        
        toast({
          title: 'CSV Parsed',
          description: `Successfully parsed ${parsedData.length} valid IP entries`,
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast({
          title: 'Error',
          description: 'Failed to parse CSV file. Please check the format.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read the file',
        variant: 'destructive',
      });
      setIsProcessing(false);
    };
    
    reader.readAsText(csvFile);
  };
  
  // Submit all parsed CSV data
  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      toast({
        title: 'Error',
        description: 'No valid IP data to submit',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Process each IP entry sequentially
      for (const ipData of csvData) {
        try {
          await createIPSAsset.mutateAsync(ipData);
          successCount++;
        } catch (error) {
          console.error(`Failed to create IP asset ${ipData.value}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast({
          title: 'Bulk Import Complete',
          description: `Successfully added ${successCount} IP assets${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
        router.push('/dashboard/assets/ips');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add any IP assets',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Bulk import failed:', error);
      toast({
        title: 'Error',
        description: 'Bulk import process failed',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/dashboard/assets/ips" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to IP Assets
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Add New IP Asset</h1>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Add Single IP</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import (CSV)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Add IP Asset</CardTitle>
              <CardDescription>
                Enter the details for the new IP asset
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="value">IP Address</Label>
                  <Input
                    id="value"
                    name="value"
                    placeholder="e.g. 192.168.1.1"
                    value={formData.value}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g. US East Data Center"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter a description..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save IP Asset'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import IP Assets</CardTitle>
              <CardDescription>
                Upload a CSV file with IP assets data. The CSV should have columns for IP address, location, and description.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isProcessing || isSubmitting}
                />
                <Button 
                  type="button" 
                  onClick={parseCSV} 
                  disabled={!csvFile || isProcessing || isSubmitting}
                  variant="secondary"
                >
                  {isProcessing ? 'Processing...' : 'Parse CSV'}
                </Button>
              </div>
              
              {csvData.length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Preview ({csvData.length} entries)</h3>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">IP Address</th>
                          <th className="text-left py-2">Location</th>
                          <th className="text-left py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 10).map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.value}</td>
                            <td className="py-2">{item.location}</td>
                            <td className="py-2">{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 10 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Showing 10 of {csvData.length} entries
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleBulkSubmit} 
                disabled={csvData.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Importing...' : `Import ${csvData.length} IP Assets`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}