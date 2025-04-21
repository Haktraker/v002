'use client';

import React from 'react';
// Import ALL_MONTHS_WITH_ALL instead of ALL_MONTHS
import { useGlobalFilter, ALL_MONTHS_WITH_ALL } from '@/lib/context/GlobalFilterContext'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const GlobalFilterComponent = () => {
  const { selectedMonth, selectedYear, availableYears, setSelectedMonth, setSelectedYear } = useGlobalFilter();

  return (
    <div className="flex items-center space-x-4 mb-4 p-4 bg-card rounded-lg shadow border">
      <div className="flex items-center space-x-2">
        <Label htmlFor="month-select" className="text-sm font-medium">Month:</Label>
        <Select
          value={selectedMonth}
          onValueChange={setSelectedMonth}
        >
          <SelectTrigger id="month-select" className="w-[140px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {/* Use ALL_MONTHS_WITH_ALL for the options */}
            {ALL_MONTHS_WITH_ALL.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="year-select" className="text-sm font-medium">Year:</Label>
        <Select
          value={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger id="year-select" className="w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {/* availableYears already includes 'All' from the context */}
            {availableYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};