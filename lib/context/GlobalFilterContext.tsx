'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react'; // Import useEffect

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Add 'All' to the list of months for selection
export const ALL_MONTHS_WITH_ALL = ['All', ...MONTHS];

interface GlobalFilterContextProps {
  selectedMonth: string;
  selectedYear: string;
  availableYears: string[];
  setSelectedMonth: (month: string) => void;
  setSelectedYear: (year: string) => void;
}

const GlobalFilterContext = createContext<GlobalFilterContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY_MONTH = 'globalFilterMonth';
const LOCAL_STORAGE_KEY_YEAR = 'globalFilterYear';

export const GlobalFilterProvider = ({ children }: { children: ReactNode }) => {
  const currentYear = new Date().getFullYear();
  // Default to 'All'
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  // Load from local storage on initial mount
  useEffect(() => {
    const savedMonth = localStorage.getItem(LOCAL_STORAGE_KEY_MONTH);
    const savedYear = localStorage.getItem(LOCAL_STORAGE_KEY_YEAR);
    if (savedMonth && savedMonth !== 'All') {
      setSelectedMonth(savedMonth);
    }
    if (savedYear && savedYear !== 'All') {
      setSelectedYear(savedYear);
    }
  }, []);

  // Save to local storage when selection changes (and is not 'All')
  useEffect(() => {
    if (selectedMonth !== 'All') {
      localStorage.setItem(LOCAL_STORAGE_KEY_MONTH, selectedMonth);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_MONTH);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedYear !== 'All') {
      localStorage.setItem(LOCAL_STORAGE_KEY_YEAR, selectedYear);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_YEAR);
    }
  }, [selectedYear]);

  // Generate a list of years (e.g., last 5 years including current) + 'All'
  const availableYears = useMemo(() => {
    return ['All', ...Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())];
  }, [currentYear]);

  const value = {
    selectedMonth,
    selectedYear,
    availableYears,
    setSelectedMonth,
    setSelectedYear,
  };

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = (): GlobalFilterContextProps => {
  const context = useContext(GlobalFilterContext);
  if (context === undefined) {
    throw new Error('useGlobalFilter must be used within a GlobalFilterProvider');
  }
  return context;
};

// Keep original MONTHS export if needed elsewhere, otherwise remove
export const ALL_MONTHS = MONTHS;