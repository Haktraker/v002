import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFileUpload, formatFileSize, UseFileUploadOptions } from '@/lib/utils/file-upload';
import { AlertCircle, CheckCircle, Upload, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps extends UseFileUploadOptions {
  className?: string;
  label?: string;
  buttonText?: string;
  onUploadComplete?: (url: string) => void;
}

export function FileUpload({
  className,
  label = "Upload file",
  buttonText = "Choose file",
  path = "uploads",
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  onUploadComplete,
}: FileUploadProps) {
  const { 
    uploadState, 
    progress, 
    fileUrl, 
    errorMessage, 
    uploadFile, 
    resetUpload 
  } = useFileUpload({ path, maxSizeMB, allowedTypes });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      const url = await uploadFile(selectedFile);
      if (onUploadComplete) {
        onUploadComplete(url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleReset = () => {
    resetUpload();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    if (selectedFile.type.startsWith('image/')) {
      return <img 
        src={selectedFile ? URL.createObjectURL(selectedFile) : ''} 
        alt="Selected file preview" 
        className="w-12 h-12 object-cover rounded-md"
      />;
    }
    
    return <File className="w-12 h-12 text-muted-foreground" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label htmlFor="file-upload">{label}</Label>
        
        <div className="mt-1 flex items-center gap-3">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleSelectFile}
            accept={allowedTypes.join(',')}
            disabled={uploadState === 'uploading'}
            className="flex-1"
          />
          
          {selectedFile && uploadState === 'idle' && (
            <Button onClick={handleUpload} type="button">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          )}
          
          {(uploadState === 'uploading' || uploadState === 'success' || uploadState === 'error') && (
            <Button variant="ghost" size="icon" onClick={handleReset} type="button">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {selectedFile && (
        <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
          {getFileIcon()}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            
            {uploadState === 'uploading' && (
              <div className="mt-2 space-y-1">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">Uploading... {progress.toFixed(0)}%</p>
              </div>
            )}
            
            {uploadState === 'success' && (
              <div className="mt-2 flex items-center text-sm text-emerald-600">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                <span>Upload complete</span>
              </div>
            )}
            
            {uploadState === 'error' && (
              <div className="mt-2 flex items-center text-sm text-destructive">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {fileUrl && uploadState === 'success' && (
        <div className="text-sm">
          <Label className="block mb-1">File URL</Label>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <p className="flex-1 overflow-x-auto whitespace-nowrap text-xs font-mono">{fileUrl}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigator.clipboard.writeText(fileUrl)}
              className="shrink-0 h-7 text-xs"
            >
              Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 