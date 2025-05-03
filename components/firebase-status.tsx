'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { testFirebaseStorage } from '@/lib/utils/file-upload';
import { Button } from '@/components/ui/button';

/**
 * Check if the required Firebase environment variables are present
 */
const isFirebaseConfigured = (): boolean => {
  if (typeof window === 'undefined') return true; // Skip server-side
  
  const requiredEnvVars = [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ];
  
  return requiredEnvVars.every(value => !!value);
};

/**
 * Component that displays a warning if Firebase isn't configured properly
 */
export function FirebaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Check Firebase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await testFirebaseStorage();
        setStatus(isConnected ? 'connected' : 'error');
        setErrorMessage(isConnected ? null : 'Failed to connect to Firebase Storage');
        setIsVisible(!isConnected); // Only show if there's a problem
      } catch (error) {
        setStatus('error');
        setErrorMessage(`Error checking Firebase connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsVisible(true);
      }
    };

    checkConnection();
  }, []);

  const handleRetry = async () => {
    setIsTesting(true);
    setStatus('checking');
    try {
      const isConnected = await testFirebaseStorage();
      setStatus(isConnected ? 'connected' : 'error');
      setErrorMessage(isConnected ? null : 'Failed to connect to Firebase Storage');
      setIsVisible(true); // Show the result after a manual check
      
      // Hide success message after 3 seconds
      if (isConnected) {
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(`Error checking Firebase connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert variant={status === 'connected' ? 'default' : 'destructive'} className="mb-4">
      {status === 'checking' && (
        <RefreshCw className="h-4 w-4 animate-spin" />
      )}
      {status === 'connected' && (
        <CheckCircle className="h-4 w-4" />
      )}
      {status === 'error' && (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {status === 'checking' && 'Checking Firebase Connection...'}
        {status === 'connected' && 'Firebase Connected'}
        {status === 'error' && 'Firebase Connection Error'}
      </AlertTitle>
      <div className="flex justify-between items-center">
        <AlertDescription>
          {status === 'checking' && 'Verifying connection to Firebase Storage...'}
          {status === 'connected' && 'Successfully connected to Firebase Storage.'}
          {status === 'error' && (
            <>
              {errorMessage || 'Failed to connect to Firebase Storage. File uploads will not work.'}
              <div className="mt-2 text-xs">
                Make sure your Firebase project is properly configured and has a valid storage bucket.
              </div>
            </>
          )}
        </AlertDescription>
        <Button 
          variant={status === 'connected' ? 'outline' : 'default'} 
          size="sm" 
          className="ml-2"
          onClick={handleRetry}
          disabled={isTesting}
        >
          {isTesting ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Test Connection
            </>
          )}
        </Button>
      </div>
    </Alert>
  );
} 