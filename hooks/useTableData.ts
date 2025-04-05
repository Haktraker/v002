import { useState, useMemo } from 'react';
import { showToast } from '@/lib/utils/toast-utils';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterConfig {
  key: string;
  value: string;
  type: 'contains' | 'equals' | 'startsWith' | 'endsWith';
}

export interface PaginationConfig {
  pageSize: number;
  currentPage: number;
}

export interface TableDataOptions<T> {
  requiredFields: string[];
  validateRow?: (row: T) => { isValid: boolean; error?: string };
  transformRow?: (row: any) => T;
  onError?: (error: string) => void;
  defaultSort?: SortConfig;
  defaultFilters?: FilterConfig[];
  defaultPageSize?: number;
}

interface UseTableDataReturn<T> {
  // CSV handling
  data: T[];
  isProcessing: boolean;
  isSubmitting: boolean;
  csvFile: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProcessCSV: () => void;
  resetData: () => void;
  setIsSubmitting: (value: boolean) => void;

  // Sorting
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig | null) => void;
  handleSort: (key: string) => void;
  
  // Filtering
  filters: FilterConfig[];
  setFilters: (filters: FilterConfig[]) => void;
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  
  // Pagination
  pagination: PaginationConfig;
  setPagination: (config: PaginationConfig) => void;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Selection
  selectedRows: Set<string>;
  toggleRowSelection: (id: string) => void;
  selectAllRows: () => void;
  clearSelection: () => void;
  
  // Computed data
  processedData: T[];
  currentPageData: T[];
}

export function useTableData<T extends { [key: string]: any }>(
  options: TableDataOptions<T>
): UseTableDataReturn<T> {
  // CSV handling state
  const [data, setData] = useState<T[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(options.defaultSort || null);

  // Filtering state
  const [filters, setFilters] = useState<FilterConfig[]>(options.defaultFilters || []);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationConfig>({
    pageSize: options.defaultPageSize || 10,
    currentPage: 1,
  });

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // CSV handling functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      setData([]);
      clearSelection();
    }
  };

  const handleProcessCSV = () => {
    if (!csvFile) {
      showToast('Please select a CSV file first', 'error');
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');

        // Get headers from first line
        const headers = lines[0].split(',').map(header => header.trim());

        // Validate headers
        const missingFields = options.requiredFields.filter(field => !headers.includes(field));
        if (missingFields.length > 0) {
          showToast(`CSV is missing required fields: ${missingFields.join(', ')}`, 'error');
          setIsProcessing(false);
          return;
        }

        // Parse data rows
        const parsedData: T[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(value => value.trim());

          if (values.length !== headers.length) {
            console.error(`Line ${i + 1} has incorrect number of fields`);
            continue;
          }

          const entry: any = {};
          headers.forEach((header, index) => {
            entry[header] = values[index];
          });

          // Transform row if transformer provided
          const transformedEntry = options.transformRow ? options.transformRow(entry) : entry;

          // Validate row if validator provided
          if (options.validateRow) {
            const validation = options.validateRow(transformedEntry);
            if (!validation.isValid) {
              console.error(`Line ${i + 1}: ${validation.error}`);
              if (options.onError) {
                options.onError(`Line ${i + 1}: ${validation.error}`);
              }
              continue;
            }
          }

          parsedData.push(transformedEntry);
        }

        setData(parsedData);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        showToast(`Successfully parsed ${parsedData.length} valid entries`, 'success');
      } catch (error) {
        console.error('Error parsing CSV:', error);
        showToast('Failed to parse CSV file. Please check the format.', 'error');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      showToast('Failed to read the file', 'error');
      setIsProcessing(false);
    };

    reader.readAsText(csvFile);
  };

  // Sorting functions
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Filter functions
  const addFilter = (filter: FilterConfig) => {
    setFilters(current => [...current.filter(f => f.key !== filter.key), filter]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const removeFilter = (key: string) => {
    setFilters(current => current.filter(f => f.key !== key));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters([]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Selection functions
  const toggleRowSelection = (id: string) => {
    setSelectedRows(current => {
      const newSet = new Set(current);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllRows = () => {
    const allIds = processedData.map(row => row.id || row._id);
    setSelectedRows(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // Pagination functions
  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const nextPage = () => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, totalPages),
    }));
  };

  const previousPage = () => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(prev.currentPage - 1, 1),
    }));
  };

  // Reset function
  const resetData = () => {
    setData([]);
    setCsvFile(null);
    setIsProcessing(false);
    setIsSubmitting(false);
    setSortConfig(options.defaultSort || null);
    setFilters(options.defaultFilters || []);
    setPagination({
      pageSize: options.defaultPageSize || 10,
      currentPage: 1,
    });
    clearSelection();
  };

  // Computed values using useMemo
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    filters.forEach(filter => {
      result = result.filter(row => {
        const value = String(row[filter.key]).toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        switch (filter.type) {
          case 'contains':
            return value.includes(filterValue);
          case 'equals':
            return value === filterValue;
          case 'startsWith':
            return value.startsWith(filterValue);
          case 'endsWith':
            return value.endsWith(filterValue);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  const totalPages = Math.ceil(processedData.length / pagination.pageSize);

  const currentPageData = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return processedData.slice(start, end);
  }, [processedData, pagination]);

  return {
    // CSV handling
    data,
    isProcessing,
    isSubmitting,
    csvFile,
    handleFileChange,
    handleProcessCSV,
    resetData,
    setIsSubmitting,

    // Sorting
    sortConfig,
    setSortConfig,
    handleSort,

    // Filtering
    filters,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,

    // Pagination
    pagination,
    setPagination,
    totalPages,
    goToPage,
    nextPage,
    previousPage,

    // Selection
    selectedRows,
    toggleRowSelection,
    selectAllRows,
    clearSelection,

    // Computed data
    processedData,
    currentPageData,
  };
}
