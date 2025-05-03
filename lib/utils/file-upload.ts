import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
  contentType: string;
}

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export interface UseFileUploadOptions {
  path?: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

export interface UseFileUploadReturn {
  uploadState: UploadState;
  progress: number;
  fileUrl: string | null;
  errorMessage: string | null;
  uploadFile: (file: File) => Promise<string>;
  resetUpload: () => void;
}

/**
 * Check if the required Firebase environment variables are present
 */
const isFirebaseConfigured = (): boolean => {
  const requiredEnvVars = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ];
  
  return requiredEnvVars.every(value => !!value);
};

/**
 * Check if the storage bucket URL is malformed
 */
const checkStorageBucket = (): boolean => {
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    console.error('[UPLOAD] Missing storage bucket configuration');
    return false;
  }
  
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.trim();
  
  // Check for common issues
  if (storageBucket.includes(',')) {
    console.error('[UPLOAD] Storage bucket contains commas which will cause errors:', storageBucket);
    console.error('[UPLOAD] Please fix the NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable');
    return false;
  }
  
  if (storageBucket.includes(' ')) {
    console.error('[UPLOAD] Storage bucket contains spaces which can cause errors:', storageBucket);
    console.error('[UPLOAD] Please fix the NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable');
    return false;
  }
  
  console.log('[UPLOAD] Storage bucket appears to be correctly formatted:', storageBucket);
  return true;
};

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param folder The folder path in Firebase Storage (e.g., "screenshots", "sample-files")
 * @param onProgress Optional callback for upload progress updates
 * @returns Promise with the download URL and path
 */
export const uploadFile = async (
  file: File,
  folder: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> => {
  console.log('[UPLOAD] Starting upload process', { fileName: file.name, folder, fileType: file.type, fileSize: file.size });
  
  if (!file) {
    console.error('[UPLOAD] No file provided');
    throw new Error('No file provided');
  }
  
  // Validate Firebase configuration
  if (!isFirebaseConfigured()) {
    console.error('[UPLOAD] Firebase not configured', { 
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
    });
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }
  
  // Check storage bucket format
  if (!checkStorageBucket()) {
    throw new Error('Firebase storage bucket is malformed. Check console for details.');
  }
  
  // Validate Firebase storage initialization
  if (!testFirebaseStorage()) {
    console.error('[UPLOAD] Firebase storage validation failed');
    throw new Error('Firebase storage is not properly initialized');
  }

  try {
    // Create a unique file name to prevent collisions
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${folder}/${uniqueFileName}`;
    
    console.log('[UPLOAD] Generated file path', { filePath, uniqueFileName });

    // Create storage reference
    console.log('[UPLOAD] Creating storage reference', { storagePath: filePath });
    const storageRef = ref(storage, filePath);
    console.log('[UPLOAD] Storage reference created', { storageRef });

    // Create upload task
    console.log('[UPLOAD] Starting uploadBytesResumable');
    
    // Try to detect if we're getting upload or connection errors
    let uploadAttempts = 0;
    const maxAttempts = 3;
    
    const attemptUpload = async (): Promise<UploadResult> => {
      uploadAttempts++;
      console.log(`[UPLOAD] Attempt ${uploadAttempts} of ${maxAttempts}`);
      
      try {
        const uploadTask = uploadBytesResumable(storageRef, file);
        console.log('[UPLOAD] Upload task created', { uploadTask });
        
        // Return promise that resolves when upload completes
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Get upload progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              const state = snapshot.state;
              
              console.log('[UPLOAD] Progress update', { 
                progress: Math.round(progress), 
                state,
                bytesTransferred: snapshot.bytesTransferred, 
                totalBytes: snapshot.totalBytes 
              });
              
              // Call progress callback if provided
              if (onProgress) {
                onProgress(progress);
              }
            },
            (error) => {
              // Handle upload errors
              console.error('[UPLOAD] Error during upload', error);
              console.error('[UPLOAD] Error code:', error.code);
              console.error('[UPLOAD] Error message:', error.message);
              
              // If we have more attempts, retry after delay
              if (uploadAttempts < maxAttempts) {
                console.log(`[UPLOAD] Will retry in 1 second (attempt ${uploadAttempts + 1} of ${maxAttempts})`);
                setTimeout(() => {
                  attemptUpload().then(resolve).catch(reject);
                }, 1000);
              } else {
                reject(error);
              }
            },
            async () => {
              // Upload completed, get download URL
              console.log('[UPLOAD] Upload completed, getting download URL');
              try {
                console.log('[UPLOAD] Calling getDownloadURL');
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('[UPLOAD] Download URL received', { downloadURL });
                
                if (!downloadURL) {
                  console.error('[UPLOAD] Download URL is empty or undefined');
                  throw new Error('Failed to get download URL');
                }
                
                // Return download URL and file path
                const result = {
                  url: downloadURL,
                  path: filePath,
                  fileName: uniqueFileName,
                  contentType: file.type
                };
                
                console.log('[UPLOAD] Upload completed successfully', result);
                resolve(result);
              } catch (error) {
                console.error('[UPLOAD] Error getting download URL:', error);
                console.error('[UPLOAD] Detailed error:', JSON.stringify(error, null, 2));
                
                // If we have more attempts, retry after delay
                if (uploadAttempts < maxAttempts) {
                  console.log(`[UPLOAD] Will retry getting URL in 1 second (attempt ${uploadAttempts + 1} of ${maxAttempts})`);
                  setTimeout(() => {
                    attemptUpload().then(resolve).catch(reject);
                  }, 1000);
                } else {
                  reject(error);
                }
              }
            }
          );
        });
      } catch (error) {
        console.error(`[UPLOAD] Error in attempt ${uploadAttempts}:`, error);
        
        // Retry or throw
        if (uploadAttempts < maxAttempts) {
          console.log('[UPLOAD] Retrying upload...');
          return attemptUpload();
        }
        throw error;
      }
    };
    
    return attemptUpload();
  } catch (error) {
    console.error('[UPLOAD] Unexpected error during upload setup:', error);
    throw error;
  }
};

/**
 * Custom hook for uploading files to Firebase Storage
 * @param options Configuration options for the upload
 * @returns Object containing upload state, progress, file URL, error message, and upload functions
 */
export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const {
    path = 'uploads',
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    maxSizeMB = 5
  } = options;

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetUpload = () => {
    setUploadState('idle');
    setProgress(0);
    setFileUrl(null);
    setErrorMessage(null);
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      setErrorMessage(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      setUploadState('error');
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setErrorMessage(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      setUploadState('error');
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!validateFile(file)) {
      return Promise.reject(errorMessage);
    }

    resetUpload();
    setUploadState('uploading');

    // Create a unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `${path}/${uniqueFileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progressPercent);
        },
        (error) => {
          // Handle upload error
          setErrorMessage(`Upload failed: ${error.message}`);
          setUploadState('error');
          reject(error.message);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setFileUrl(downloadUrl);
            setUploadState('success');
            resolve(downloadUrl);
          } catch (error: any) {
            setErrorMessage(`Failed to get download URL: ${error.message}`);
            setUploadState('error');
            reject(error.message);
          }
        }
      );
    });
  };

  return {
    uploadState,
    progress,
    fileUrl,
    errorMessage,
    uploadFile,
    resetUpload
  };
};

/**
 * Helper function to format file size
 * @param bytes File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Test function to verify Firebase storage connection by uploading a simple test file
 * Call this function for debugging purposes only
 */
export const testFirebaseStorage = async (): Promise<boolean> => {
  console.log('[FIREBASE-TEST] Testing Firebase storage connection...');
  
  try {
    // First validate Firebase config
    if (!isFirebaseConfigured()) {
      console.error('[FIREBASE-TEST] Firebase not configured properly');
      return false;
    }
    
    // Then validate Firebase storage
    if (!testFirebaseStorage()) {
      console.error('[FIREBASE-TEST] Firebase storage validation failed');
      return false;
    }
    
    // Create a small test file (1x1 pixel transparent GIF)
    const base64Data = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, {type: 'image/gif'});
    const testFile = new File([blob], 'test.gif', {type: 'image/gif'});
    
    console.log('[FIREBASE-TEST] Created test file', {
      size: testFile.size,
      type: testFile.type,
      name: testFile.name
    });
    
    // Upload test file
    console.log('[FIREBASE-TEST] Attempting to upload test file...');
    const storageRef = ref(storage, 'test/test-' + Date.now() + '.gif');
    const uploadTask = uploadBytesResumable(storageRef, testFile);
    
    return new Promise((resolve) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[FIREBASE-TEST] Upload progress:', Math.round(progress));
        },
        (error) => {
          console.error('[FIREBASE-TEST] Upload failed:', error);
          resolve(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[FIREBASE-TEST] Test successful! Download URL:', downloadURL);
            resolve(true);
          } catch (error) {
            console.error('[FIREBASE-TEST] Failed to get download URL:', error);
            resolve(false);
          }
        }
      );
    });
  } catch (error) {
    console.error('[FIREBASE-TEST] Test failed with error:', error);
    return false;
  }
}; 