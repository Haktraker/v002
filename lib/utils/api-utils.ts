import { useLoading } from '@/lib/context/loading-context';

export function useApiLoading() {
  const { startLoading, stopLoading } = useLoading();

  const withLoading = async <T,>(promise: Promise<T>): Promise<T> => {
    try {
      startLoading();
      return await promise;
    } finally {
      stopLoading();
    }
  };

  return { withLoading };
}
