import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, validateFirebaseStorage } from '@/lib/utils/firebase-config';
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
  
  // Validate Firebase configuration and initialization using the central validator
  if (!validateFirebaseStorage()) {
    console.error('[UPLOAD] Firebase storage validation failed. Check console logs from firebase-config.ts for details.');
    throw new Error('Firebase storage is not properly configured or initialized. Cannot upload file.');
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
              // Handle upload errors with more detail
              console.error('[UPLOAD] Error during upload', error);
              console.error('[UPLOAD] Error code:', error.code);
              console.error('[UPLOAD] Error message:', error.message);

              // Log specific Firebase Storage errors
              switch (error.code) {
                case 'storage/unauthorized':
                  console.error('[UPLOAD] Unauthorized: User does not have permission.');
                  break;
                case 'storage/canceled':
                  console.error('[UPLOAD] Canceled: User canceled the upload.');
                  break;
                case 'storage/object-not-found':
                  console.error('[UPLOAD] Object Not Found: The file path may be incorrect.');
                  break;
                case 'storage/bucket-not-found':
                  console.error('[UPLOAD] Bucket Not Found: Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.');
                  break;
                case 'storage/project-not-found':
                  console.error('[UPLOAD] Project Not Found: Check Firebase project configuration.');
                  break;
                case 'storage/quota-exceeded':
                  console.error('[UPLOAD] Quota Exceeded: Storage quota has been reached.');
                  break;
                case 'storage/unauthenticated':
                  console.error('[UPLOAD] Unauthenticated: User is not authenticated.');
                  break;
                case 'storage/retry-limit-exceeded':
                  console.error('[UPLOAD] Retry Limit Exceeded: Max retry time limit exceeded.');
                  break;
                case 'storage/invalid-checksum':
                  console.error('[UPLOAD] Invalid Checksum: File might be corrupted.');
                  break;
                case 'storage/server-file-wrong-size':
                   console.error('[UPLOAD] Server File Wrong Size: File size mismatch.');
                   break;
                case 'storage/unknown':
                default:
                  console.error('[UPLOAD] Unknown Error: Inspect error object and server response.');
                  break;
              }
              
              // If we have more attempts, retry after delay
              if (uploadAttempts < maxAttempts) {
                console.log(`[UPLOAD] Will retry in 1 second (attempt ${uploadAttempts + 1} of ${maxAttempts})`);
                setTimeout(() => {
                  attemptUpload().then(resolve).catch(reject);
                }, 1000);
              } else {
                reject(new Error(`Upload failed after ${maxAttempts} attempts: ${error.message} (Code: ${error.code})`));
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
                  throw new Error('Failed to get download URL after successful upload.');
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
                
                // If we have more attempts, retry getting URL after delay
                if (uploadAttempts < maxAttempts) {
                  console.log(`[UPLOAD] Will retry getting URL in 1 second (attempt ${uploadAttempts + 1} of ${maxAttempts})`);
                  // Note: Retrying the entire upload, as getting URL failed after upload completion
                  setTimeout(() => {
                    attemptUpload().then(resolve).catch(reject); 
                  }, 1000);
                } else {
                  reject(new Error(`Failed to get download URL after ${maxAttempts} attempts: ${error instanceof Error ? error.message : String(error)}`));
                }
              }
            }
          );
        });
      } catch (error) {
        console.error(`[UPLOAD] Error setting up upload task in attempt ${uploadAttempts}:`, error);
        
        // Retry or throw
        if (uploadAttempts < maxAttempts) {
          console.log('[UPLOAD] Retrying upload setup...');
          // Add a small delay before retrying the setup
          await new Promise(res => setTimeout(res, 500)); 
          return attemptUpload();
        }
        throw error; // Throw after max attempts at setup
      }
    };
    
    return attemptUpload();
  } catch (error) {
    console.error('[UPLOAD] Unexpected error during upload setup:', error);
    // Ensure the error is re-thrown correctly
    throw error instanceof Error ? error : new Error(String(error));
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
    // First validate Firebase config and initialization using the central validator
    if (!validateFirebaseStorage()) {
      console.error('[FIREBASE-TEST] Firebase storage validation failed. Check console logs from firebase-config.ts for details.');
      return false; // Exit early if validation fails
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
    
    // Upload test file to a dedicated test path
    const testPath = 'test/connection-test-' + Date.now() + '.gif';
    console.log('[FIREBASE-TEST] Attempting to upload test file to:', testPath);
    const storageRef = ref(storage, testPath);
    const uploadTask = uploadBytesResumable(storageRef, testFile);
    
    return new Promise((resolve) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[FIREBASE-TEST] Upload progress:', Math.round(progress));
          // Optional: Add timeout logic here if needed
        },
        (error) => {
          console.error('[FIREBASE-TEST] Upload failed:', error);
          console.error('[FIREBASE-TEST] Error Code:', error.code);
          // Provide hints based on common errors
          if (error.code === 'storage/unauthorized') {
             console.error('[FIREBASE-TEST] Hint: Check Firebase Storage security rules. Are writes allowed to the /test path for authenticated/unauthenticated users?');
          } else if (error.code === 'storage/bucket-not-found') {
             console.error('[FIREBASE-TEST] Hint: Double-check the NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
          }
          resolve(false);
        },
        async () => {
          try {
            console.log('[FIREBASE-TEST] Test upload completed. Verifying download URL...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[FIREBASE-TEST] Test successful! Download URL obtained:', downloadURL);
            // Optional: Try to delete the test file here?
            resolve(true);
          } catch (error) {
            console.error('[FIREBASE-TEST] Failed to get download URL after successful upload:', error);
            resolve(false);
          }
        }
      );
    });
  } catch (error) {
    console.error('[FIREBASE-TEST] Test failed with an unexpected error during setup:', error);
    return false;
  }
}; 