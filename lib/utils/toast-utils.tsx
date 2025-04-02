import { Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReactNode } from 'react';

/**
 * Toast utility functions for displaying consistent toast notifications
 * with appropriate colors for different status types.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  description?: string | ReactNode;
  duration?: number;
}

/**
 * Show a toast notification with the appropriate status color
 */
export const showToast = (
  message: string, 
  type: ToastType = 'info', 
  options?: ToastOptions
) => {
  switch (type) {
    case 'success':
      return toast({
        title: message,
        description: options?.description,
        variant: "default",
        className: "bg-success-background border-success text-success-foreground",
        duration: options?.duration,
      });
    case 'error':
      return toast({
        title: message,
        description: options?.description,
        variant: "destructive",
        duration: options?.duration,
      });
    case 'warning':
      return toast({
        title: message,
        description: options?.description,
        variant: "default",
        className: "bg-warning-background border-warning text-warning-foreground",
        duration: options?.duration,
      });
    case 'info':
      return toast({
        title: message,
        description: options?.description,
        variant: "default",
        className: "bg-info-background border-info text-info-foreground",
        duration: options?.duration,
      });
  }
};

/**
 * Show a loading toast with a shield icon
 */
export const showLoadingToast = async (
  promise: Promise<any>,
  {
    loading,
    success,
    error,
  }: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  // Create a loading toast
  const { id } = toast({
    title: loading,
    description: (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 animate-pulse" />
        <span>Please wait...</span>
      </div>
    ),
    duration: Infinity,
  });

  try {
    // Wait for the promise to resolve
    const result = await promise;
    
    // Update with success message
    toast({
      title: success,
      description: (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-success" />
          <span>Operation completed successfully</span>
        </div>
      ),
      variant: "default",
      className: "bg-success-background border-success text-success-foreground",
      duration: 3000,
    });
    
    return result;
  } catch (err) {
    // Update with error message
    toast({
      title: error,
      description: (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" />
          <span>An error occurred</span>
        </div>
      ),
      variant: "destructive",
      duration: 3000,
    });
    
    throw err;
  }
};
