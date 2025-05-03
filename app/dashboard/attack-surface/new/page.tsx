'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAttackSurface } from '@/lib/api/endpoints/attack-surface/attack-surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CreateAttackSurfaceDto, AttackSurfaceStatus } from '@/lib/api/types';
import { ArrowLeft, Upload, Home, Plus, X, FileText, Image } from 'lucide-react';
import { useTableData } from '@/hooks/useTableData';
import Link from 'next/link';
import { useApiLoading } from '@/lib/utils/api-utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadFile, UploadResult, testFirebaseStorage } from '@/lib/utils/file-upload';
import { Progress } from '@/components/ui/progress';
import { FirebaseStatus } from '@/components/firebase-status';

// Define possible statuses
const STATUS_OPTIONS: AttackSurfaceStatus[] = ["investigating", "resolved", "unresolved"];

// Interface for port entries
interface PortEntry {
  port: string;
}

// Interface for file uploads
interface FileUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

// Initial state for file uploads
const initialFileState: FileUploadState = {
  file: null,
  uploading: false,
  progress: 0,
  error: null,
  result: null
};

export default function NewAttackSurfacePage() {
  const router = useRouter();
  const createAttackSurface = useCreateAttackSurface();
  const { withLoading } = useApiLoading();
  
  // State for form
  const [formData, setFormData] = useState<CreateAttackSurfaceDto>({
    detectionTime: new Date().toISOString().slice(0, 16),
    affectedSystems: '',
    openPorts: [],
    services: '',
    screenshot: '',
    sampleFile: '',
    mitigationSteps: '',
    status: 'unresolved',
  });

  // State for file uploads
  const [screenshotUpload, setScreenshotUpload] = useState<FileUploadState>({...initialFileState});
  const [sampleFileUpload, setSampleFileUpload] = useState<FileUploadState>({...initialFileState});

  // State for ports management
  const [newPort, setNewPort] = useState<string>('');
  
  // Validate CSV rows
  const validateRow = (row: CreateAttackSurfaceDto) => {
    if (!row.affectedSystems) {
      return {
        isValid: false,
        error: 'Affected Systems is required'
      };
    }
    return { isValid: true };
  };

  // Table data handling with custom hook for CSV upload
  const {
    data: csvData,
    isProcessing,
    isSubmitting,
    csvFile,
    handleFileChange,
    handleProcessCSV,
    resetData,
    setIsSubmitting,
    currentPageData,
    pagination,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
    sortConfig,
    handleSort,
  } = useTableData<CreateAttackSurfaceDto>({
    requiredFields: ['affectedSystems'],
    validateRow,
  });

  // Handle port operations
  const handleAddPort = () => {
    if (!newPort.trim()) return;
    
    // Check if port already exists
    if (formData.openPorts.some(p => p.port === newPort.trim())) {
      toast.error("Port already exists");
      return;
    }
    
    setFormData({
      ...formData,
      openPorts: [...formData.openPorts, { port: newPort.trim() }]
    });
    setNewPort('');
  };

  const handleRemovePort = (portToRemove: string) => {
    setFormData({
      ...formData,
      openPorts: formData.openPorts.filter(p => p.port !== portToRemove)
    });
  };

  const handlePortKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPort();
    }
  };

  // Form input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Status selection handler
  const handleStatusChange = (value: AttackSurfaceStatus) => {
    setFormData({ ...formData, status: value });
  };

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'screenshot' | 'sampleFile') => {
    const file = e.target.files?.[0] || null;
    const uploadState = fileType === 'screenshot' ? screenshotUpload : sampleFileUpload;
    const setUploadState = fileType === 'screenshot' ? setScreenshotUpload : setSampleFileUpload;
    
    if (file) {
      // Validate file type based on fileType
      let validTypes: string[] = [];
      
      if (fileType === 'screenshot') {
        validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
          setUploadState({
            ...uploadState,
            file: null,
            error: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, WEBP).'
          });
          return;
        }
      } else {
        validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
          setUploadState({
            ...uploadState,
            file: null,
            error: 'Invalid file type. Please upload a document file (PDF, TXT, DOC, DOCX).'
          });
          return;
        }
      }
      
      // Set file to state
      setUploadState({
        ...uploadState,
        file,
        error: null
      });
    }
  };

  const handleUploadFile = useCallback(async (fileType: 'screenshot' | 'sampleFile') => {
    const uploadState = fileType === 'screenshot' ? screenshotUpload : sampleFileUpload;
    const setUploadState = fileType === 'screenshot' ? setScreenshotUpload : setSampleFileUpload;
    const folder = fileType === 'screenshot' ? 'screenshots' : 'sample-files';
    
    console.log(`[${fileType.toUpperCase()}] Starting upload process`, {
      fileName: uploadState.file?.name,
      fileSize: uploadState.file?.size,
      fileType: uploadState.file?.type,
      folder
    });
    
    if (!uploadState.file) {
      console.error(`[${fileType.toUpperCase()}] No file selected`);
      setUploadState({
        ...uploadState,
        error: 'No file selected'
      });
      return;
    }
    
    // Start upload
    console.log(`[${fileType.toUpperCase()}] Setting upload state to uploading`);
    setUploadState({
      ...uploadState,
      uploading: true,
      progress: 0,
      error: null
    });
    
    try {
      console.log(`[${fileType.toUpperCase()}] Calling uploadFile function`);
      // Upload file to Firebase
      const result = await uploadFile(
        uploadState.file,
        folder,
        (progress) => {
          console.log(`[${fileType.toUpperCase()}] Progress update:`, progress);
          setUploadState(prev => ({
            ...prev,
            progress
          }));
        }
      );
      
      console.log(`[${fileType.toUpperCase()}] Upload result:`, result);
      
      if (!result || !result.url) {
        console.error(`[${fileType.toUpperCase()}] Upload result missing URL`, result);
        throw new Error('Failed to get download URL from Firebase');
      }
      
      // Set result and update form data with URL
      console.log(`[${fileType.toUpperCase()}] Setting upload state with result`);
      setUploadState({
        ...uploadState,
        uploading: false,
        progress: 100,
        result
      });
      
      // Update form data with the file URL
      console.log(`[${fileType.toUpperCase()}] Updating form data with URL:`, result.url);
      setFormData(prev => {
        const newData = {
          ...prev,
          [fileType]: result.url
        };
        console.log(`[${fileType.toUpperCase()}] New form data:`, newData);
        return newData;
      });
      
      toast.success(`${fileType === 'screenshot' ? 'Screenshot' : 'Sample file'} uploaded successfully`);
    } catch (error) {
      console.error(`[${fileType.toUpperCase()}] Error uploading file:`, error);
      console.error(`[${fileType.toUpperCase()}] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Check for CORS errors specifically
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let displayError = `Failed to upload file: ${errorMessage}`;
      
      if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
        displayError = 'Permission Error: Not authorized to upload files. Check Firebase Storage rules.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connect')) {
        displayError = 'Network Error: Could not connect to Firebase Storage. Check your internet connection.';
      }
      
      setUploadState({
        ...uploadState,
        uploading: false,
        progress: 0,
        error: displayError
      });
      toast.error(`Failed to upload ${fileType === 'screenshot' ? 'screenshot' : 'sample file'}: ${displayError}`);
    }
  }, [screenshotUpload, sampleFileUpload]);

  // Handle single form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(async () => {
        await createAttackSurface.mutateAsync(formData);
        toast.success('Attack Surface entry created successfully');
        router.push('/dashboard/attack-surface');
      });
    } catch (error) {
      console.error('Failed to create Attack Surface entry:', error);
      toast.error('Failed to create Attack Surface entry');
    }
  };

  // Handle bulk submission from CSV
  const handleBulkSubmit = async () => {
    if (!csvData.length) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      await withLoading(async () => {
        for (const row of csvData) {
          try {
            await createAttackSurface.mutateAsync(row);
            successCount++;
          } catch (error) {
            console.error('Failed to create Attack Surface entry:', error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} entries${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          router.push('/dashboard/attack-surface');
        } else {
          toast.error('Failed to create any entries');
        }
      });
    } catch (error) {
      console.error('Bulk submission failed:', error);
      toast.error('Bulk submission process failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/attack-surface">Attack Surface</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/attack-surface/new" className="font-semibold">
              Add New Entry
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4 my-6">
        <Link href="/dashboard/attack-surface">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add New Attack Surface Entry</h1>
      </div>

      {/* Add Firebase Status alert */}
      <FirebaseStatus />

      <Tabs defaultValue="single" className="w-full">
        <TabsList>
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Add Attack Surface Entry</CardTitle>
                <CardDescription>
                  Enter the details for a new attack surface entry.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="affectedSystems">Affected Systems</Label>
                  <Input
                    id="affectedSystems"
                    name="affectedSystems"
                    value={formData.affectedSystems}
                    onChange={handleChange}
                    placeholder="Enter affected systems"
                    required
                  />
                </div>
                
                {/* Open Ports - Editable field */}
                <div className="space-y-2">
                  <Label htmlFor="openPorts">Open Ports</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newPort"
                      placeholder="Add port (e.g., 80, 443, 8080)"
                      value={newPort}
                      onChange={(e) => setNewPort(e.target.value)}
                      onKeyDown={handlePortKeyDown}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddPort}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  
                  {/* Display current ports with remove option */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.openPorts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No ports added</p>
                    ) : (
                      formData.openPorts.map((portObj, index) => (
                        <div 
                          key={`${portObj.port}-${index}`} 
                          className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                        >
                          <span>{portObj.port}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 ml-1 p-0" 
                            onClick={() => handleRemovePort(portObj.port)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="services">Services</Label>
                  <Input
                    id="services"
                    name="services"
                    value={formData.services}
                    onChange={handleChange}
                    placeholder="Enter services information"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mitigationSteps">Mitigation Steps</Label>
                  <Textarea
                    id="mitigationSteps"
                    name="mitigationSteps"
                    value={formData.mitigationSteps}
                    onChange={handleChange}
                    placeholder="Enter mitigation steps"
                    rows={4}
                  />
                </div>
                
                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <Label htmlFor="screenshot">Screenshot</Label>
                  <div className="grid gap-2">
                    {formData.screenshot ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center space-x-2 rounded-md border p-2">
                          <Image className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate flex-1">{screenshotUpload.result?.fileName || 'Screenshot uploaded'}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setFormData({...formData, screenshot: ''});
                              setScreenshotUpload({...initialFileState});
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <a 
                          href={formData.screenshot} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                          <div className="flex-1">
                            <Input
                              id="screenshotFile"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(e, 'screenshot')}
                              disabled={screenshotUpload.uploading}
                            />
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => handleUploadFile('screenshot')}
                            disabled={!screenshotUpload.file || screenshotUpload.uploading}
                            className="flex items-center gap-1"
                          >
                            <Upload className="h-4 w-4 mr-1" /> Upload
                          </Button>
                        </div>
                        
                        {/* Test Firebase Storage Button */}
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            toast.info("Testing Firebase connection...");
                            const success = await testFirebaseStorage();
                            if (success) {
                              toast.success("Firebase storage connection successful!");
                            } else {
                              toast.error("Firebase storage connection failed. Check console for details.");
                            }
                          }}
                          className="text-xs"
                        >
                          Test Firebase Connection
                        </Button>
                      </>
                    )}
                    
                    {/* Progress bar for screenshot upload */}
                    {screenshotUpload.uploading && (
                      <div className="space-y-1">
                        <Progress value={screenshotUpload.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Uploading: {Math.round(screenshotUpload.progress)}%
                        </p>
                      </div>
                    )}
                    
                    {/* Error message for screenshot upload */}
                    {screenshotUpload.error && (
                      <p className="text-sm text-destructive">{screenshotUpload.error}</p>
                    )}
                    
                    <Input
                      id="screenshot"
                      name="screenshot"
                      type="hidden"
                      value={formData.screenshot}
                    />
                  </div>
                </div>
                
                {/* Sample File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="sampleFile">Sample File</Label>
                  <div className="grid gap-2">
                    {formData.sampleFile ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center space-x-2 rounded-md border p-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate flex-1">{sampleFileUpload.result?.fileName || 'File uploaded'}</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setFormData({...formData, sampleFile: ''});
                              setSampleFileUpload({...initialFileState});
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <a 
                          href={formData.sampleFile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                        <div className="flex-1">
                          <Input
                            id="sampleFileInput"
                            type="file"
                            accept=".pdf,.txt,.doc,.docx"
                            onChange={(e) => handleFileSelect(e, 'sampleFile')}
                            disabled={sampleFileUpload.uploading}
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => handleUploadFile('sampleFile')}
                          disabled={!sampleFileUpload.file || sampleFileUpload.uploading}
                          className="flex items-center gap-1"
                        >
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </Button>
                      </div>
                    )}
                    
                    {/* Progress bar for sample file upload */}
                    {sampleFileUpload.uploading && (
                      <div className="space-y-1">
                        <Progress value={sampleFileUpload.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Uploading: {Math.round(sampleFileUpload.progress)}%
                        </p>
                      </div>
                    )}
                    
                    {/* Error message for sample file upload */}
                    {sampleFileUpload.error && (
                      <p className="text-sm text-destructive">{sampleFileUpload.error}</p>
                    )}
                    
                    <Input
                      id="sampleFile"
                      name="sampleFile"
                      type="hidden"
                      value={formData.sampleFile}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={
                    createAttackSurface.isPending || 
                    screenshotUpload.uploading || 
                    sampleFileUpload.uploading
                  }
                >
                  {createAttackSurface.isPending ? 'Creating...' : 'Create Entry'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with multiple attack surface entries.
                The CSV should contain columns: detectionTime, affectedSystems, services, status, mitigationSteps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isProcessing || isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={handleProcessCSV}
                    disabled={!csvFile || isProcessing || isSubmitting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Process CSV
                  </Button>
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Detection Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Affected Systems
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Services
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentPageData.map((row, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.detectionTime}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.affectedSystems}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.services}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.status || 'unresolved'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Page {pagination.currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={previousPage}
                          disabled={pagination.currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={nextPage}
                          disabled={pagination.currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={resetData}
                        disabled={isSubmitting}
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit All'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 