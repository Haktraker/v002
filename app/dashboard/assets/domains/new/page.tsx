'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDomainAsset } from '@/lib/api/endpoints/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateDomainDto } from '@/lib/api/types';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewDomainPage() {
  const router = useRouter();
  const createDomainAsset = useCreateDomainAsset();
  
  // State for single domain form
  const [formData, setFormData] = useState<CreateDomainDto>({
    value: '',
    location: '',
    description: '',
  });
  
  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CreateDomainDto[]>([]);
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
  
  // Handle single domain submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createDomainAsset.mutateAsync(formData);
      // Toast is now handled in the API layer
      router.push('/dashboard/assets/domains');
    } catch (error) {
      console.error('Failed to create domain asset:', error);
      // Error toast is handled in the API layer
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
      toast.error('Please select a CSV file first');
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
                          firstLine.includes('domain') || 
                          firstLine.includes('location') || 
                          firstLine.includes('description');
        
        // Start from index 1 if header exists, otherwise from 0
        const startIndex = hasHeader ? 1 : 0;
        
        const parsedData: CreateDomainDto[] = [];
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const values = line.split(',').map(val => val.trim());
          
          // Assuming CSV format: value,location,description
          // If fewer columns, we'll use defaults
          const domainData: CreateDomainDto = {
            value: values[0] || '',
            location: values[1] || 'Unknown',
            description: values[2] || '',
          };
          
          // Basic validation for domain format
          if (domainData.value && /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domainData.value)) {
            parsedData.push(domainData);
          }
        }
        
        setCsvData(parsedData);
        
        toast.success(`Successfully parsed ${parsedData.length} valid domain entries`);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error('Failed to parse CSV file. Please check the format.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read the file');
      setIsProcessing(false);
    };
    
    reader.readAsText(csvFile);
  };
  
  // Submit all parsed CSV data
  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      toast.error('No valid domain data to submit');
      return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Process each domain entry sequentially
      for (const domainData of csvData) {
        try {
          await createDomainAsset.mutateAsync(domainData);
          successCount++;
        } catch (error) {
          console.error(`Failed to create domain asset ${domainData.value}:`, error);
          errorCount++;
        }
      }
      
      // Show a summary toast at the end
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} domain assets${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        router.push('/dashboard/assets/domains');
      } else {
        toast.error('Failed to add any domain assets');
      }
    } catch (error) {
      console.error('Bulk import failed:', error);
      toast.error('Bulk import process failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Link href="/dashboard/assets/domains" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Domain Assets
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Add New Domain Asset</h1>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Add Single Domain</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import (CSV)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Add Domain Asset</CardTitle>
              <CardDescription>
                Enter the details for the new domain asset
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Domain Name</Label>
                  <Input
                    id="value"
                    name="value"
                    placeholder="e.g. example.com"
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
                  {isSubmitting ? 'Saving...' : 'Save Domain Asset'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Domain Assets</CardTitle>
              <CardDescription>
                Upload a CSV file with domain assets data. The CSV should have columns for domain name, location, and description.
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
                          <th className="text-left py-2">Domain Name</th>
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
                {isSubmitting ? 'Importing...' : `Import ${csvData.length} Domain Assets`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}