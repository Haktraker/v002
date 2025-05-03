'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttackSurface, UpdateAttackSurfaceDto, AttackSurfaceStatus, OpenPortDetail } from '@/lib/api/types';
import { useUpdateAttackSurface } from '@/lib/api/endpoints/attack-surface/attack-surface';
import { toast } from 'sonner';
import { Loader2, PlusCircle, X, Upload, Image, FileText } from 'lucide-react';
import { uploadFile, UploadResult } from '@/lib/utils/file-upload';
import { Progress } from '@/components/ui/progress';
import { FirebaseStatus } from '@/components/firebase-status';

interface EditAttackSurfaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attackSurface: AttackSurface;
  onSuccess: () => void;
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

// Define possible statuses
const STATUS_OPTIONS: AttackSurfaceStatus[] = ["investigating", "resolved", "unresolved"];

export function EditAttackSurfaceDialog({
  isOpen,
  onClose,
  attackSurface,
  onSuccess,
}: EditAttackSurfaceDialogProps) {
  const [formData, setFormData] = useState<Partial<UpdateAttackSurfaceDto>>({});
  const [ports, setPorts] = useState<string[]>([]);
  const [newPort, setNewPort] = useState<string>('');
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);
  
  // State for file uploads
  const [screenshotUpload, setScreenshotUpload] = useState<FileUploadState>({...initialFileState});
  const [sampleFileUpload, setSampleFileUpload] = useState<FileUploadState>({...initialFileState});
  
  const updateMutation = useUpdateAttackSurface();

  // Reset form data when attackSurface changes or dialog opens
  useEffect(() => {
    if (attackSurface) {
      // Initialize form data with existing values (excluding _id, createdAt, updatedAt)
      const { _id, createdAt, updatedAt, openPorts, ...editableData } = attackSurface;
      setFormData({
        ...editableData,
        // Convert detectionTime to format accepted by datetime-local input if needed
        detectionTime: editableData.detectionTime ? new Date(editableData.detectionTime).toISOString().slice(0, 16) : '',
        status: editableData.status || 'unresolved', // Ensure status has a default
      });
      
      // Initialize ports array
      if (openPorts && openPorts.length > 0) {
        setPorts(openPorts.map(p => p.port));
      } else {
        setPorts([]);
      }
      
      // Reset file upload states
      setScreenshotUpload({
        ...initialFileState,
        result: editableData.screenshot ? { 
          url: editableData.screenshot,
          path: '',
          fileName: 'Existing screenshot',
          contentType: ''
        } : null
      });
      
      setSampleFileUpload({
        ...initialFileState,
        result: editableData.sampleFile ? { 
          url: editableData.sampleFile,
          path: '',
          fileName: 'Existing sample file',
          contentType: ''
        } : null
      });
    }
  }, [attackSurface, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: AttackSurfaceStatus) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleAddPort = () => {
    if (!newPort.trim()) return;
    
    // Check if port already exists
    if (ports.includes(newPort.trim())) {
      toast.error("Port already exists");
      return;
    }
    
    setPorts(prev => [...prev, newPort.trim()]);
    setNewPort('');
  };

  const handleRemovePort = (portToRemove: string) => {
    setPorts(prev => prev.filter(port => port !== portToRemove));
  };

  const handlePortKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPort();
    }
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
    
    console.log(`[EDIT-${fileType.toUpperCase()}] Starting upload process`, {
      fileName: uploadState.file?.name,
      fileSize: uploadState.file?.size,
      fileType: uploadState.file?.type,
      folder
    });
    
    if (!uploadState.file) {
      console.error(`[EDIT-${fileType.toUpperCase()}] No file selected`);
      setUploadState({
        ...uploadState,
        error: 'No file selected'
      });
      return;
    }
    
    // Start upload
    console.log(`[EDIT-${fileType.toUpperCase()}] Setting upload state to uploading`);
    setUploadState({
      ...uploadState,
      uploading: true,
      progress: 0,
      error: null
    });
    
    try {
      console.log(`[EDIT-${fileType.toUpperCase()}] Calling uploadFile function`);
      // Upload file to Firebase
      const result = await uploadFile(
        uploadState.file,
        folder,
        (progress) => {
          console.log(`[EDIT-${fileType.toUpperCase()}] Progress update:`, progress);
          setUploadState(prev => ({
            ...prev,
            progress
          }));
        }
      );
      
      console.log(`[EDIT-${fileType.toUpperCase()}] Upload result:`, result);
      
      if (!result || !result.url) {
        console.error(`[EDIT-${fileType.toUpperCase()}] Upload result missing URL`, result);
        throw new Error('Failed to get download URL from Firebase');
      }
      
      // Set result and update form data with URL
      console.log(`[EDIT-${fileType.toUpperCase()}] Setting upload state with result`);
      setUploadState({
        ...uploadState,
        uploading: false,
        progress: 100,
        result
      });
      
      // Update form data with the file URL
      console.log(`[EDIT-${fileType.toUpperCase()}] Updating form data with URL:`, result.url);
      setFormData(prev => {
        const newData = {
          ...prev,
          [fileType]: result.url
        };
        console.log(`[EDIT-${fileType.toUpperCase()}] New form data:`, newData);
        return newData;
      });
      
      toast.success(`${fileType === 'screenshot' ? 'Screenshot' : 'Sample file'} uploaded successfully`);
    } catch (error) {
      console.error(`[EDIT-${fileType.toUpperCase()}] Error uploading file:`, error);
      console.error(`[EDIT-${fileType.toUpperCase()}] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setUploadState({
        ...uploadState,
        uploading: false,
        progress: 0,
        error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast.error(`Failed to upload ${fileType === 'screenshot' ? 'screenshot' : 'sample file'}`);
    }
  }, [screenshotUpload, sampleFileUpload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attackSurface) return;

    // Prepare data for API
    const updateData: UpdateAttackSurfaceDto & { id: string } = {
      id: attackSurface._id,
      ...formData,
      // Convert detectionTime back to ISO string
      detectionTime: formData.detectionTime ? new Date(formData.detectionTime).toISOString() : undefined,
      // Convert ports array to openPorts array of objects
      openPorts: ports.map(port => ({ port })),
    };

    // Remove empty strings
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === '') {
        delete updateData[key as keyof typeof updateData];
      }
    });

    try {
      await updateMutation.mutateAsync(updateData);
      toast.success("Attack Surface entry updated successfully.");
      onSuccess(); // Trigger refetch on the parent page
      onClose(); // Close the dialog
    } catch (error) {
      console.error("Failed to update Attack Surface:", error);
      toast.error("Failed to update entry. Please try again.");
    }
  };

  // Prevent dialog close on background click during submission
  const handleInteractOutside = (event: Event) => {
    if (updateMutation.isPending) {
      event.preventDefault();
    }
  };
  
  // Reset file and apply new URL
  const handleResetFile = (fileType: 'screenshot' | 'sampleFile') => {
    if (fileType === 'screenshot') {
      setFormData({...formData, screenshot: ''});
      setScreenshotUpload({...initialFileState});
    } else {
      setFormData({...formData, sampleFile: ''});
      setSampleFileUpload({...initialFileState});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]" onInteractOutside={handleInteractOutside}>
        <DialogHeader>
          <DialogTitle>Edit Attack Surface Entry</DialogTitle>
        </DialogHeader>
        
        {/* Add Firebase Status alert */}
        <FirebaseStatus />
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="detectionTime" className="text-right">
              Detection Time
            </Label>
            <Input
              id="detectionTime"
              name="detectionTime"
              type="datetime-local"
              value={formData.detectionTime || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="affectedSystems" className="text-right">
              Affected Systems
            </Label>
            <Input
              id="affectedSystems"
              name="affectedSystems"
              value={formData.affectedSystems || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          {/* Open Ports - Now editable */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="openPorts" className="text-right pt-2">
              Open Ports
            </Label>
            <div className="col-span-3 space-y-2">
              {/* Port input with add button */}
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
                  <PlusCircle className="h-4 w-4" /> Add
                </Button>
              </div>

              {/* Display current ports with remove option */}
              <div className="flex flex-wrap gap-2 pt-2">
                {ports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No ports added</p>
                ) : (
                  ports.map((port, index) => (
                    <div 
                      key={`${port}-${index}`} 
                      className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                    >
                      <span>{port}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 ml-1 p-0" 
                        onClick={() => handleRemovePort(port)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="services" className="text-right">
              Services
            </Label>
            <Input
              id="services"
              name="services"
              value={formData.services || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="mitigationSteps" className="text-right pt-2">
              Mitigation Steps
            </Label>
            <div className="col-span-3 space-y-2">
              <Textarea
                id="mitigationSteps"
                name="mitigationSteps"
                value={formData.mitigationSteps || ''}
                onChange={handleChange}
                className="w-full"
                rows={isTextareaExpanded ? 10 : 3}
              />
              {(formData.mitigationSteps?.length || 0) > 150 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsTextareaExpanded(!isTextareaExpanded)}
                  className="text-xs"
                >
                  {isTextareaExpanded ? "Show Less" : "Show More"}
                </Button>
              )}
            </div>
          </div>

          {/* Screenshot Upload */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="screenshot" className="text-right pt-2">
              Screenshot
            </Label>
            <div className="col-span-3 space-y-2">
              {formData.screenshot ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center space-x-2 rounded-md border p-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">{screenshotUpload.result?.fileName || 'Screenshot uploaded'}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleResetFile('screenshot')}
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
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2">
                  <Input
                    id="screenshotFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'screenshot')}
                    disabled={screenshotUpload.uploading}
                  />
                  <Button 
                    type="button" 
                    onClick={() => handleUploadFile('screenshot')}
                    disabled={!screenshotUpload.file || screenshotUpload.uploading}
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4 mr-1" /> Upload
                  </Button>
                </div>
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
            </div>
          </div>
          
          {/* Sample File Upload */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="sampleFile" className="text-right pt-2">
              Sample File
            </Label>
            <div className="col-span-3 space-y-2">
              {formData.sampleFile ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center space-x-2 rounded-md border p-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate flex-1">{sampleFileUpload.result?.fileName || 'File uploaded'}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleResetFile('sampleFile')}
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
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2">
                  <Input
                    id="sampleFileInput"
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={(e) => handleFileSelect(e, 'sampleFile')}
                    disabled={sampleFileUpload.uploading}
                  />
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
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={formData.status || 'unresolved'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="col-span-3">
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

          <DialogFooter>
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                disabled={updateMutation.isPending || screenshotUpload.uploading || sampleFileUpload.uploading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || screenshotUpload.uploading || sampleFileUpload.uploading}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 