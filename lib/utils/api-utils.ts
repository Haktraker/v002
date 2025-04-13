"use client"
import { useState } from 'react';

export function useApiLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = async <T>(promise: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await promise();
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, withLoading };
}
